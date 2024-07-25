from flask import current_app
import related

from data.query.models.calculation import Calculation
from data.query.models.query_filter import AndFilter
from data.query.models import (
    GroupingDimension as QueryGroupingDimension,
    Field as QueryField,
)
from util.related.polymorphic_model import build_polymorphic_base
from web.server.api.query.grouping_item_schema import granularity_converter
from web.server.query.request import QueryRequest


# TODO: fix type error
@related.immutable
class GroupingItem(build_polymorphic_base()):  # type: ignore[misc]
    pass


@related.immutable
class GroupingDimensionItem:
    name = related.StringField()
    dimension = related.StringField()
    include_all = related.BooleanField(False, key='includeAll')
    include_null = related.BooleanField(False, key='includeNull')
    include_total = related.BooleanField(False, key='includeTotal')


@GroupingItem.register_subtype
@related.immutable
class GroupingDimension(GroupingItem):
    type = related.StringField('GROUPING_DIMENSION')
    item = related.ChildField(
        GroupingDimensionItem, required=False
    )  # NOTE: sigh!

    def serialize_for_query(self):
        return QueryGroupingDimension(
            dimension=self.item.dimension,
            include_all=self.item.include_all,
            include_null=self.item.include_null,
            include_total=self.item.include_total,
        )


@related.immutable
class GroupingGranularityItem:
    name = related.StringField()
    granularity = related.StringField()
    include_total = related.BooleanField(False, key='includeTotal')


@GroupingItem.register_subtype
@related.immutable
class GroupingGranularity(GroupingItem):
    type = related.StringField('GROUPING_GRANULARITY')
    item = related.ChildField(
        GroupingGranularityItem, required=False
    )  # NOTE: sigh!

    def serialize_for_query(self):
        # NOTE: T_T This is so cursed, why does not everything match here
        # and why do we have so many models
        return granularity_converter(related.to_dict(self.item))


# TODO: fix type error
@related.immutable
class QueryFilterItem(build_polymorphic_base()):  # type: ignore[misc]
    pass


@QueryFilterItem.register_subtype
@related.immutable
class CustomizableTimeIntervalFilter(QueryFilterItem):
    type = related.StringField('CUSTOMIZABLE_TIME_INTERVAL')
    item = related.ChildField(
        'data.query.models.filter_items.CustomizableTimeIntervalFilterItem',
        required=False,
    )


@QueryFilterItem.register_subtype
@related.immutable
class DimensionValueFilter(QueryFilterItem):
    type = related.StringField('DIMENSION_VALUE')
    item = related.ChildField(
        'data.query.models.DimensionValueFilterItem', required=False
    )


@related.mutable(strict=True)
class AdvancedFieldDefinition:
    id = related.StringField()
    calculation = Calculation.child_field()
    canonical_name = related.StringField(key='canonicalName')
    customizable_filter_items = QueryFilterItem.sequence_field(
        key='customizableFilterItems'
    )
    short_name = related.StringField(key='shortName')
    user_defined_label = related.StringField('', key='userDefinedLabel')
    show_null_as_zero = related.BooleanField(False, key='showNullAsZero')

    def serialize_calcualation_for_query(self):
        # TODO: Move to `Calculation` itself?

        # To correctly serialize a calculation, we have to get its field filter
        # and AND it with any customizable filters we want to apply to it (e.g.
        # dimension filters or date filters).
        filters = list(
            filter(
                None,
                map(lambda f: f.item.build_filter(), self.customizable_filter_items),
            )
        )

        if not filters:
            return self.calculation

        calculation_filter = self.calculation.filter
        if calculation_filter:
            filters.insert(0, calculation_filter)

        filter_ = filters[0] if len(filters) == 1 else AndFilter(fields=filters)
        return self.calculation.update_fields(filter=filter_)

    def serialize_for_query(self):
        return QueryField(
            id=self.id,
            calculation=self.serialize_calcualation_for_query(),
        )


@related.mutable(strict=True)
class QuerySelectionsDefinition:
    fields = related.SequenceField(AdvancedFieldDefinition, required=False)
    filters = QueryFilterItem.sequence_field(required=False)
    groups = GroupingItem.sequence_field(required=False)

    def serialize_for_query(self):
        return QueryRequest(
            fields=[field.serialize_for_query() for field in self.fields or ()],
            filter=self.build_query_filter(),
            groups=[group.serialize_for_query() for group in self.groups or ()],
        )

    def serialize_for_disaggregated_query(self):
        raw_request = self.serialize_for_query()
        request_dimensions = {
            d.dimension: d
            for d in raw_request.groups
            if hasattr(d, 'dimension')
            if d.dimension not in current_app.zen_config.aggregation.GEO_FIELD_ORDERING
        }
        disaggregated_dimensions = [
            QueryGroupingDimension(
                dimension=d,
                include_all=False,
                include_null=True,
                include_total=False,
            )
            for d in current_app.zen_config.aggregation.GEO_FIELD_ORDERING
        ]
        disaggregated_granularities = [
            granularity_converter({'granularity': g, 'includeTotal': False})
            for g in ['day']
        ]
        groupings = (
            list(request_dimensions.values())
            + disaggregated_dimensions
            + disaggregated_granularities
        )
        return QueryRequest(
            fields=raw_request.fields,
            filter=raw_request.filter,
            groups=groupings,
        )

    def build_query_filter(self):
        filters = list(
            filter(None, map(lambda f: f.item.build_filter(), self.filters or ()))
        )
        if not filters:
            return None
        if len(filters) == 1:
            return filters[0]
        return AndFilter(fields=filters)
