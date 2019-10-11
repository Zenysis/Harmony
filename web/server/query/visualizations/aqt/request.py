import related

from flask import current_app
from pydruid.utils.filters import Dimension as DimensionFilter

from data.wip.models import (
    FILTER_TYPE_MAP,
    Field,
    Granularity,
    GranularityExtraction,
    GroupingDimension,
    PolymorphicChildField,
    QueryFilter,
)
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import EmptyFilter
from web.server.query.visualizations.aqt.util import FilterTree

SUBTOTAL_RESULT_LABEL = 'TOTAL'


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
class AQTQueryRequest:
    fields = related.SequenceField(Field)
    groups = MultiTypeSequenceField(
        [GroupingDimension, Granularity, GranularityExtraction]
    )
    filter = PolymorphicChildField(QueryFilter, FILTER_TYPE_MAP, required=False)

    def to_druid_query(self, datasource):
        # Always exclude nation values for AQT.
        query_filter = self.build_query_filter()
        use_nation_hack = datasource.startswith('et')
        if use_nation_hack:
            query_filter &= DimensionFilter('RegionName') != 'Nation'

        return GroupByQueryBuilder(
            datasource=datasource,
            granularity=self.build_granularity(),
            grouping_fields=self.build_dimensions(),
            intervals=self.build_intervals(),
            calculation=self.build_calculation(),
            dimension_filter=query_filter,
            subtotal_dimensions=self.build_subtotal_dimensions(),
            subtotal_result_label=SUBTOTAL_RESULT_LABEL,
        )

    def grouping_dimensions(self):
        return [group for group in self.groups if isinstance(group, GroupingDimension)]

    def granularity_extraction(self):
        '''Find if the user has selected a granularity extraction (like Month of Year)
        in the query. There can be only one extraction.
        '''
        for group in self.groups:
            if isinstance(group, GranularityExtraction):
                return group
        return None

    def granularity(self):
        '''Extract the granularity grouping selected. There can be at most one per
        query.
        '''
        for group in self.groups:
            # NOTE(vinh): GranularityExtraction is technically a subclass of
            # Granularity, however it is special. It needs to be handled as a grouping
            # dimension instead of as the query's granularity because of how it operates
            # on the time field to extract a date part.
            if isinstance(group, Granularity) and not isinstance(
                group, GranularityExtraction
            ):
                return group

        return None

    def build_calculation(self):
        return CalculationMerger(
            [field.calculation.to_druid(field.id) for field in self.fields]
        )

    def build_dimensions(self):
        output = []
        for group in self.groups:
            if isinstance(group, GroupingDimension):
                output.append(group.dimension.to_druid())
            elif isinstance(group, GranularityExtraction):
                # If the user has selected a granularity extraction, this must be added
                # to the grouping dimensions. This is because to have the results
                # grouped by a date extraction, it must be included in the grouping
                # dimensions. Druid cannot group by a date extraction natively at the
                # `granularity` level.
                output.append(group.to_druid(self.build_intervals()))
        return output

    def build_query_filter(self):
        query_filter = self.filter.to_druid() if self.filter else EmptyFilter()
        for group in self.grouping_dimensions():
            query_filter &= group.to_druid_filter()
        return query_filter

    def build_intervals(self):
        tree = FilterTree(self.filter)
        if tree.all_time:
            time_boundary = current_app.druid_context.data_time_boundary
            return [time_boundary.get_full_time_interval()]
        return tree.to_druid_intervals()

    def build_granularity(self):
        granularity = self.granularity()
        if not granularity:
            return 'all'

        return granularity.to_druid(self.build_intervals())

    def build_subtotal_dimensions(self):
        return [
            group.dimension.id
            for group in self.grouping_dimensions()
            if group.include_total
        ]
