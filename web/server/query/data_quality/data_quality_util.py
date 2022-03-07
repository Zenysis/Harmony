from typing import Dict
from db.druid.util import (
    build_filter_from_aggregation,
)
from db.druid.aggregations.query_dependent_aggregation import QueryDependentAggregation
from db.druid.query_builder_util.optimization.filter_optimizations import (
    optimize_query_filter,
)

from data.query.models import Field
from data.query.models.calculation.count_calculation import CountCalculation
from data.query.models.query_filter.raw_filter import RawFilter

from web.server.query.visualizations.request import QueryRequest


def modify_request_for_data_quality_reporting(request: QueryRequest) -> QueryRequest:
    new_fields = [
        # mypy-related-issue
        Field(  # type: ignore[call-arg]
            id=field.id,
            calculation=build_calculation(field),
            canonical_name=field.canonical_name,
            short_name=field.short_name,
            label=field.label,
        )
        for field in request.fields
    ]

    # mypy-related-issue
    return QueryRequest(  # type: ignore[call-arg]
        fields=new_fields, groups=request.groups, filter=request.filter
    )


def build_calculation(field: Field) -> CountCalculation:
    field_id = field.id
    query_filter = build_query_filter(field.calculation.to_druid(field_id))
    return CountCalculation(filter=RawFilter(filter=query_filter))


def build_data_quality_filter_from_aggregations(
    aggregations: Dict[str, QueryDependentAggregation],
):
    merged_filters = None
    for aggregation in aggregations.values():
        agg_filter = build_filter_from_aggregation(aggregation)
        if not agg_filter:
            continue
        if not merged_filters:
            merged_filters = agg_filter
        else:
            merged_filters |= agg_filter

    if not merged_filters:
        raise Exception(
            'There should always be at least one filter for data quality, the field itself'
        )

    return merged_filters


def build_query_filter(original_calculation):
    '''Build a query filter that will captures all reported events for the given
    calculation.
    '''

    aggregations = {}
    for key, aggregation in original_calculation.aggregations.items():
        agg = aggregation
        # If the aggregation requires information from the query to be computed, extract
        # the filter applied to the base aggregation. Most aggregations of this type
        # have a dependency on *time*, which we do not care about here. We want to
        # capture all events and we can ignore the query dependent portion since we are
        # not trying to accurately calculate the aggregation's value.
        if isinstance(aggregation, QueryDependentAggregation):
            agg = aggregation.base_aggregation
        aggregations[key] = agg
    query_filter = optimize_query_filter(
        build_data_quality_filter_from_aggregations(aggregations)
    )
    return query_filter
