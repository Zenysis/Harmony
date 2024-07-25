from typing import List, TypedDict, Union, Dict

import pandas as pd

from db.druid.datasource import DruidDatasource
from data.query.models import GroupingDimension, GroupingGranularity
from web.server.query.request import QueryRequest, SUBTOTAL_RESULT_LABEL
from web.server.query.visualizations.base import QueryBase
from web.server.query.visualizations.util import join_str_columns
from web.server.routes.views.query_policy import AuthorizedQueryClient


def rewrite_hierarchy_groups(
    groups: List[Union[GroupingDimension, GroupingGranularity]]
) -> List[Union[GroupingDimension, GroupingGranularity]]:
    '''Convert the groups sent by the frontend into a version that will allow
    subtotals to be calculated for all group levels. Without conversion, there
    will be issues calculating subtotals when a Granularity is present.
    '''
    output = []
    for group in groups:
        output_group = group

        # Force all grouping dimensions to include totals.
        if isinstance(group, GroupingDimension):
            # mypy-related-issue
            output_group = GroupingDimension(  # type: ignore[call-arg]
                group.dimension,
                group.include_all,
                group.include_null,
                include_total=True,
            )
        else:
            # Make sure the `include_total` flag is set for the granularity group.
            # If we were to leave the Granularity as-is, then the best Druid can
            # produce is a total for each date bucket. Unfortunately, if we are
            # grouping by [Region, Month] then this will not produce the right
            # results since there will be no Region buckets. Also make sure that
            # `include_total` is set to True so that we can actually get subtotals
            # for the dates.
            # mypy-related-issue
            output_group = GroupingGranularity(  # type: ignore[call-arg]
                group.granularity, include_total=True
            )
        output.append(output_group)
    return output


def attach_parent_node_metadata(
    df: pd.DataFrame, groups: List[str], level_idx: int
) -> None:
    '''Add metadata to each subtotal result to make building a tree easier.
    Columns added:
        key: The ID of a subtotal result that children nodes will point to.
        level_idx: The index of this level to make sorting by level easier.
        name: The display name for each subtotal result.
        dimension: The dimension level this subtotal result represents values for.
        parent: The parent ID that this subtotal result is located beneath.
    '''
    current_level = groups[level_idx]
    is_root = level_idx == 0
    subtotal_filter = df[current_level] == SUBTOTAL_RESULT_LABEL

    # Assign a key to each subtotal result at this level.
    df.loc[subtotal_filter, 'key'] = join_str_columns(
        df[subtotal_filter], groups[: level_idx + 1]
    )
    df.loc[subtotal_filter, 'level_idx'] = level_idx

    # NOTE: This is somewhat counterintuitive. The actual grouping level a
    # subtotal value represents is a level higher than than our current level. This is
    # because values are reported at the n + 1 lower level by druid when it calculates
    # subtotals.
    true_level = groups[level_idx - 1] if not is_root else ''

    # Use the parent dimension name as the node's name. If we are on the root level and
    # have no parent, set Overall as the name.
    df.loc[subtotal_filter, 'name'] = (
        df[subtotal_filter][true_level] if not is_root else 'Overall'
    )

    # Set the dimension ID for each non-root level.
    df.loc[subtotal_filter, 'dimension'] = true_level

    # Update the parent ID to point to the true parent. The original parent ID was set
    # only for the lowest (leaf) level nodes.
    df.loc[subtotal_filter, 'parent'] = (
        join_str_columns(df[subtotal_filter], groups[: level_idx - 1] + ['suffix'])
        if not is_root
        else ''
    )


class Node(TypedDict):
    '''A node in the hierarchy tree that has children.'''

    # This class can't refer to itself yet (see links below re. forward references),
    # so we have to use a string literal, and tell mypy to ignore.
    # https://peps.python.org/pep-0484/#forward-references
    # https://peps.python.org/pep-0484/#the-problem-of-forward-declarations
    children: List['Node']  # type: ignore
    metrics: Dict[str, object]
    name: str
    dimension: str


class TerminalRootNode(TypedDict):
    '''A root node without children'''

    dimension: str
    metrics: Dict[str, object]
    name: str


class ZeroGroupingResponse(TypedDict):
    '''Response for a query with no grouping.'''

    levels: List[str]
    root: TerminalRootNode


class EmptyResponse(TypedDict):
    '''Response for a query with no results.'''


class HierarchicalResponse(TypedDict):
    '''Response for a healthy hierarchical query.'''

    levels: List[str]
    root: Node


def build_zero_grouping_response(
    df: pd.DataFrame, metric_fields: List[str]
) -> ZeroGroupingResponse:
    '''Construct the response structure for when the query has no grouping.'''
    return {
        'levels': [],
        'root': {
            'dimension': '',
            'metrics': df[metric_fields].to_dict('records')[0],
            'name': 'Overall',
        },
    }


class HierarchyVisualization(QueryBase):
    '''Class to process the pandas dataframe returned from a druid query into a
    hierarchical data format.
    '''

    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: DruidDatasource,
    ):
        # Override the query request and force all groupings to include a total. This
        # is needed because each level of the hierarchy should have a value for its
        # children. The best way to do this is by having druid calculate the total for
        # each level since it knows how to calculate each value already.
        new_request = request.copy(groups=rewrite_hierarchy_groups(request.groups))
        super().__init__(new_request, query_client, datasource)

    def build_df(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        if raw_df.empty:
            return raw_df

        groups = self.grouping_order()
        if not groups:
            # NOTE: Nation level queries will have a different dataframe format
            # since building the response dict is much easier.
            return raw_df

        # Add a suffix column to make building parent IDs easier. All parent IDs will
        # contain the SUBTOTAL_RESULT_LABEL.
        raw_df['suffix'] = SUBTOTAL_RESULT_LABEL
        # Set the parent ID that each leaf node should point to.
        raw_df['parent'] = join_str_columns(raw_df, groups[:-1] + ['suffix'])
        # Set the display name and dimension level for each leaf node. The leaf level is
        # the last group in the list.
        leaf_level = groups[-1]
        raw_df['name'] = raw_df[leaf_level]
        raw_df['dimension'] = leaf_level

        # Add the metadata for each non-leaf level.
        for i, _ in enumerate(groups):
            attach_parent_node_metadata(raw_df, groups, i)

        return raw_df

    def build_response(
        self, df: pd.DataFrame
    ) -> Union[ZeroGroupingResponse, EmptyResponse, HierarchicalResponse]:
        '''Output a nested hierarchy containing all data from root to leaf.'''
        if df.empty:
            return {}

        groups = self.grouping_order()
        metric_fields = [field.id for field in self.request.fields]
        if not groups:
            return build_zero_grouping_response(df, metric_fields)

        tree: Dict[str, Node] = {}

        # All leaf nodes do not have a key. They only have a parent node to point to.
        leaf_filter = ~df['key'].notnull()

        # Index the subtotal dataframe by the unique `key` column.
        subtotal_df = (
            df[~leaf_filter]
            # Reset the index so we can preserve the original sort order of results
            # within each level.
            .reset_index()
            # Sort the results by level then original sort order.
            .sort_values(['level_idx', 'index'])
            .drop('index', 'columns')
            .set_index('key')
        )

        columns = ['parent', 'name', 'dimension']
        subtotal_metrics = subtotal_df[metric_fields].to_dict('index')

        # Loop over each non-leaf node and store it in the tree.
        for key, value in subtotal_df[columns].to_dict('index').items():
            parent = value.pop('parent')
            node: Node = {
                'children': [],
                'metrics': subtotal_metrics[key],
                'name': value.get('name'),
                'dimension': value.get('dimension'),
            }
            tree[key] = node
            # If this node also has a parent, add it as a child of that parent. The
            # parent is guaranteed to exist because we are iterating from lowest level
            # to highest level.
            if parent:
                tree[parent]['children'].append(node)

        # Build and store all leaf nodes.
        leaf_df = df[leaf_filter]
        leaf_metrics = leaf_df[metric_fields].to_dict('records')
        for i, row in enumerate(leaf_df[columns].to_dict('records')):
            parent = row.pop('parent')
            node = {
                'metrics': leaf_metrics[i],
                'name': row.get('name'),
                'dimension': row.get('dimension'),
                # Not all nodes will have children, we introduce an empty list,
                # TypedDict doesn't like optional keys, and we can't yet use
                # https://peps.python.org/pep-0655/ which would simplfy a lot
                # of this.
                'children': row.get('children', []),
            }
            tree[parent]['children'].append(node)

        # Return only the root as the result since it can be traversed to reach each
        # level.
        root = tree[SUBTOTAL_RESULT_LABEL]
        response: HierarchicalResponse = {'levels': self.grouping_order(), 'root': root}
        return response
