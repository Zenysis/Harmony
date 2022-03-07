from typing import List, NamedTuple, Optional, Union

import related

from flask import current_app
from pydruid.utils.filters import (
    Dimension as DimensionFilter,
    Filter as DruidQueryFilter,
)
from pydruid.utils.dimensions import DimensionSpec

from data.query.models import (
    Field,
    GranularityExtraction,
    GroupingDimension,
    GroupingGranularity,
)
from data.query.models.query_filter import QueryFilter
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import EmptyFilter
from web.server.query.visualizations.util import FilterTree

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

    # NOTE(stephen): There is a lot of business logic that we need to apply to be able
    # to convert the user's groups into a Druid format.
    query_dimensions = []
    query_granularity: Union[str, dict] = 'all'
    for group in groups:
        # NOTE(stephen): Re-parsing which groups are GroupingDimensions instead of
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
        # NOTE(stephen): This behavior might have query performance issues because the
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


class MultiTypeSequenceConverter:
    def __init__(self, base_classes):
        self._allowed_types = tuple(base_classes)

    def __call__(self, values):
        output = related.TypedSequence(self._allowed_types[0], [])
        output.allowed_types = self._allowed_types
        output.extend(values)
        return output


# pylint: disable=invalid-name
def MultiTypeSequenceField(base_classes):
    '''This field type allows multiple class types to be stored in the same
    sequence of a related model.

    NOTE(stephen): Because Potion is deserializing the raw request into full
    Dimension and Granularity models, this field doesn't actually do any
    deserialization. It most likely wouldn't work if it needed to.
    '''
    attrib = related.SequenceField(base_classes[0])
    attrib.converter = MultiTypeSequenceConverter(base_classes)
    return attrib


@related.immutable
class QueryRequest:
    fields = related.SequenceField(Field)
    groups = MultiTypeSequenceField([GroupingDimension, GroupingGranularity])
    filter = QueryFilter.child_field(required=False)

    def to_druid_query(
        self,
        datasource: str,
        supplemental_druid_calculations: Optional[List[BaseCalculation]] = None,
    ) -> GroupByQueryBuilder:
        # NOTE(sophie): The supplemental_druid_calculations parameter allows us to customize our
        # query by adding in additional calculations without repeating the rest of the query
        # building functionality.

        # TODO(nina, anyone): We always exclude nation values for the AQT.
        # However, the SQT no longer exists. So we should condense this in
        # some way. From stephen: "It's baked into the ET druid datasource,
        # which is why this keeps happening all over the place. It's worth
        # removing in a different diff and tracking separately since it is in
        # a lot of weird places. This was originally left in because ET was
        # not fully migrated to AQT. However now that ET is deprecated and
        # not receiving updates, it's likely ok to remove in the future."
        query_filter = self.build_query_filter()
        use_nation_hack = datasource.startswith('et')
        if use_nation_hack:
            query_filter &= DimensionFilter('RegionName') != 'Nation'

        # Experimental feature. If the user has requested it, we will remove an
        # optimization to the query that restricts the rows processed by Druid to only
        # rows that contribute to the calculations applied. This can significantly
        # affect query performance.
        filter_non_aggregated_rows = all(
            not g.include_all for g in self.grouping_dimensions()
        )
        calculation = self.build_calculation()
        if supplemental_druid_calculations:
            calculation = CalculationMerger(
                [calculation, *supplemental_druid_calculations]
            )

        intervals = self.build_intervals()
        druid_grouping_selection = parse_groups_for_query(self.groups, intervals)
        return GroupByQueryBuilder(
            datasource=datasource,
            granularity=druid_grouping_selection.granularity,
            grouping_fields=druid_grouping_selection.dimensions,
            intervals=intervals,
            calculation=calculation,
            dimension_filter=query_filter,
            subtotal_dimensions=druid_grouping_selection.subtotal_dimensions,
            subtotal_result_label=SUBTOTAL_RESULT_LABEL,
            filter_non_aggregated_rows=filter_non_aggregated_rows,
        )

    def grouping_dimensions(self) -> List[GroupingDimension]:
        return [group for group in self.groups if isinstance(group, GroupingDimension)]

    def build_calculation(self) -> BaseCalculation:
        return CalculationMerger(
            [field.calculation.to_druid(field.id) for field in self.fields]
        )

    def build_query_filter(self) -> DruidQueryFilter:
        query_filter = self.filter.to_druid() if self.filter else EmptyFilter()
        for group in self.grouping_dimensions():
            query_filter &= group.to_druid_filter()
        return query_filter

    def build_intervals(self) -> List[str]:
        tree = FilterTree(self.filter)
        if tree.all_time:
            time_boundary = current_app.druid_context.data_time_boundary
            return [time_boundary.get_full_time_interval()]
        return tree.to_druid_intervals()
