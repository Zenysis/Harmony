# mypy: disallow_untyped_defs=True

from typing import List, NamedTuple, Union

from pydruid.utils.dimensions import DimensionSpec

from data.query.models import (
    GranularityExtraction,
    GroupingDimension,
    GroupingGranularity,
)

SUBTOTAL_RESULT_LABEL = 'TOTAL'


class DruidGroupingSelection(NamedTuple):
    '''The grouping related parameters (dimensions, granularity) that will be used to
    construct a GroupByQueryBuilder query.
    '''

    # Granularity can be a string or an arbitrary granularity dict.
    granularity: Union[str, dict]
    dimensions: List[Union[str, DimensionSpec]]
    subtotal_dimensions: List[str]


def parse_groups_for_query(
    groups: List[Union[GroupingDimension, GroupingGranularity]],
    query_intervals: List[str],
) -> DruidGroupingSelection:
    '''Parse the user's groupings, which come in a simplistic, multi-type format that is
    easy for the user to build, into the internal Druid format that we need for
    querying.
    '''
    # Find which dimension groups the user wants total values computed for.
    subtotal_dimensions = []
    for group in groups:
        if not group.include_total:
            continue

        if isinstance(group, GroupingDimension):
            subtotal_dimensions.append(group.dimension)
        else:
            subtotal_dimensions.append(group.granularity.id)

    # NOTE: There is a lot of business logic that we need to apply to be able
    # to convert the user's groups into a Druid format.
    query_dimensions = []
    query_granularity: Union[str, dict] = 'all'
    for group in groups:
        # NOTE: Re-parsing which groups are GroupingDimensions instead of
        # merging it into the subtotal dimension creation since we need to preserve the
        # ordering of GroupingDimension + GranularityExtraction based on the user's
        # selection.
        if isinstance(group, GroupingDimension):
            query_dimensions.append(group.dimension)
            continue

        # If the Druid representation of this granularity is a DimensionSpec, then we
        # must include it in the `dimensions` section and cannot include it in the
        # `granularity` section.
        druid_granularity = group.to_druid(query_intervals)
        if isinstance(druid_granularity, DimensionSpec):
            query_dimensions.append(druid_granularity)
            continue

        # If there are subtotal dimensions and a granularity, we need the granularity to
        # be included in the dimensions section of the query. This will ensure that the
        # subtotal values returned by druid will behave the same way regardless of
        # whether a time grouping is selected. Converting the Granularity into a
        # GranularityExtraction is an easy way to get a DimensionSpec back that we can
        # use in the dimensions section. Ref: T7549
        # NOTE: This behavior might have query performance issues because the
        # we cannot use the optimized `granularity` parameter in the query and *must*
        # use an extraction.
        if subtotal_dimensions:
            # mypy-related-issue
            granularity_group = GroupingGranularity(  # type: ignore[call-arg]
                GranularityExtraction.from_granularity(group.granularity),
                group.include_total,
            )
            query_dimensions.append(granularity_group.to_druid(query_intervals))
        else:
            query_granularity = druid_granularity

    return DruidGroupingSelection(
        query_granularity, query_dimensions, subtotal_dimensions
    )
