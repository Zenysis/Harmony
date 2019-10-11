import related

from data.wip.models import Granularity, GranularityExtraction, GroupingDimension
from web.server.query.visualizations.aqt.aqt_base import AQTBase
from web.server.query.visualizations.aqt.request import (
    AQTQueryRequest,
    SUBTOTAL_RESULT_LABEL,
)
from web.server.query.visualizations.util import join_str_columns


@related.immutable
class HierarchyQueryRequest(AQTQueryRequest):
    def build_subtotal_dimensions(self):
        # Override the query request and force all groupings to include a total. This
        # is needed because each level of the hierarchy should have a value for its
        # children. The best way to do this is by having druid calculate the total for
        # each level since it knows how to calculate each value already.
        output = []
        for group in self.groups:
            if isinstance(group, GroupingDimension):
                output.append(group.dimension.id)
            elif isinstance(group, GranularityExtraction):
                output.append(group.id)
        return output

    @staticmethod
    def rewrite_groups(groups):
        '''Convert the groups sent by the frontend into a version that will allow
        subtotals to be calculated for all group levels. Without conversion, there
        will be issues calculating subtotals when a Granularity is present.
        '''
        output = []
        for group in groups:
            if isinstance(group, (GranularityExtraction, GroupingDimension)):
                output.append(group)
            elif isinstance(group, Granularity):
                # Convert a granularity grouping into an extraction so that we can
                # properly calculate subtotal values all the way up the chain. If we
                # were to leave the Granularity as-is, then the best Druid can produce
                # is a total for each date bucket. Unfortunately, if we are grouping by
                # [Region, Month] then this will not produce the right results since
                # there will be no Region buckets.
                output.append(
                    GranularityExtraction(
                        group.id, group.name, group.category, group.description
                    )
                )
        return output


def attach_parent_node_metadata(df, groups, level_idx):
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

    # NOTE(stephen): This is somewhat counterintuitive. The actual grouping level a
    # subtotal value represents is a level higher than than our current level. This is
    # because values are reported at the n + 1 lower level by druid when it calculates
    # subtotals.
    true_level = groups[level_idx - 1] if not is_root else ''

    # Use the parent dimension name as the node's name. If we are on the root level and
    # have no parent, set Nation as the name.
    df.loc[subtotal_filter, 'name'] = (
        df[subtotal_filter][true_level] if not is_root else 'Nation'
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


class HierarchyVisualization(AQTBase):
    ''' Class to process the pandas dataframe returned from a druid query into a
    hierarchical data format.
    '''

    def __init__(self, request, query_client, datasource):
        # Override the query request and force all groupings to include a total. This
        # is needed because each level of the hierarchy should have a value for its
        # children. The best way to do this is by having druid calculate the total for
        # each level since it knows how to calculate each value already.
        new_request = HierarchyQueryRequest(
            fields=request.fields,
            groups=HierarchyQueryRequest.rewrite_groups(request.groups),
            filter=request.filter,
        )
        super().__init__(new_request, query_client, datasource)

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        groups = self.grouping_order()
        if not groups:
            # TODO(stephen): Handle nation level queries.
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

    def build_response(self, df):
        '''Output a nested hierarchy containing all data from root to leaf.'''
        if df.empty:
            return {}

        tree = {}

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
        metric_fields = [field.id for field in self.request.fields]
        subtotal_metrics = subtotal_df[metric_fields].to_dict('index')

        # Loop over each non-leaf node and store it in the tree.
        for key, value in subtotal_df[columns].to_dict('index').items():
            parent = value.pop('parent')
            node = {'children': [], 'metrics': subtotal_metrics[key], **value}
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
            node = {'metrics': leaf_metrics[i], **row}
            tree[parent]['children'].append(node)

        # Return only the root as the result since it can be traversed to reach each
        # level.
        root = tree[SUBTOTAL_RESULT_LABEL]
        return {'levels': self.grouping_order(), 'root': root}
