# mypy: disallow_untyped_defs=True

# NOTE: In python <3.11, this allows typing a class method to return the class (as with
# the copy method). In python 3.11 this has been replaced by `from typing import Self` and
# the copy method should use return type `Self`.
from __future__ import annotations
from typing import List, Optional, Sequence, Union

import related

from flask import current_app
from pydruid.utils.filters import (
    Dimension as DimensionFilter,
    Filter as DruidQueryFilter,
)

from data.query.models import Field, GroupingDimension, GroupingGranularity
from data.query.models.query_filter import QueryFilter
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import EmptyFilter
from util.related.polymorphic_model import (
    MultiTypeSequenceField,
    build_polymorphic_base,
)
from web.server.query.request.util import SUBTOTAL_RESULT_LABEL, parse_groups_for_query
from web.server.query.visualizations.util import FilterTree


@related.immutable
class QueryRequest(build_polymorphic_base()):  # type: ignore[misc]
    fields = related.SequenceField(Field)
    groups = MultiTypeSequenceField([GroupingDimension, GroupingGranularity])
    filter = QueryFilter.child_field(required=False)
    type = related.StringField('GROUP_BY')

    def to_druid_query(
        self,
        datasource: str,
        supplemental_druid_calculations: Optional[List[BaseCalculation]] = None,
    ) -> GroupByQueryBuilder:
        # NOTE: The supplemental_druid_calculations parameter allows us to customize our
        # query by adding in additional calculations without repeating the rest of the query
        # building functionality.

        # TODO: We always exclude nation values for the AQT.
        # However, the SQT no longer exists. So we should condense this in
        # some way. From stephen: "It's baked into the ET druid datasource,
        # which is why this keeps happening all over the place. It's worth
        # removing in a different diff and tracking separately since it is in
        # a lot of weird places. This was originally left in because ET was
        # not fully migrated to AQT. However now that ET is deprecated and
        # not receiving updates, it's likely ok to remove in the future."
        query_filter = self.build_query_filter()
        use_nation_hack = False
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

    def copy(
        self,
        fields: Optional[Sequence[Field]] = None,
        groups: Optional[
            Sequence[Union[GroupingDimension, GroupingGranularity]]
        ] = None,
        request_filter: Optional[QueryFilter] = None,
    ) -> QueryRequest:
        if fields is None:
            fields = self.fields
        if groups is None:
            groups = self.groups
        if request_filter is None:
            request_filter = self.filter

        return QueryRequest(fields=fields, groups=groups, filter=request_filter)


QueryRequest.register_subtype(QueryRequest)
