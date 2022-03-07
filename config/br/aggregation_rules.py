from pydruid.utils.filters import Filter
from config.druid_base import FIELD_NAME
from config.br.indicators import GROUP_DEFINITIONS
from config.br.calculated_indicators import (
    CALCULATED_INDICATOR_CONSTITUENTS,
    CALCULATED_INDICATOR_FORMULAS,
)
from data.calculated_indicator.util import (
    build_calculated_indicator_calculation,
    sort_calculated_indicators,
)
from data.composite_indicator.util import build_composite_indicator_calculation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.calculations.simple_calculation import (
    AverageCalculation,
    AverageOverTimeBucketCalculation,
    SumCalculation,
    LastValueCalculation,
)
from db.druid.aggregations.time_interval_aggregation import (
    GregorianStockIntervalCreator,
    TimeIntervalAggregation,
)
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation

# The mapping of Calculated Indicator to its respective calculation.
CALCULATIONS_FOR_FIELD = {}

# The set of Calculated Indicators which do not have complete definitions
# due to missing component data. As such, these values may differ significantly
# from their actual value.
INCOMPLETE_CALCULATED_INDICATORS = set()

# Build a unified calculation for the requested fields that combines each
# fields aggregations and post aggregations into a single queriable set
# TODO(stephen, ian): We can precalculate the possible calculations at
# server initialization like ET if we want
def get_calculation_for_fields(fields):
    calculations = [
        CALCULATIONS_FOR_FIELD[field]
        for field in fields
        if field in CALCULATIONS_FOR_FIELD
    ]
    return CalculationMerger(calculations)


# Build a valid druid granularity for the requested granularity level
# pylint: disable=W0613
def get_granularity_for_interval(
    requested_granularity, query_start_date, query_end_date
):
    # No custom granularity is needed
    return requested_granularity


def _build_indicator_calculation(ind):
    ind_id = ind['id']
    ind_type = ind.get('type')
    ind_subtype = ind.get('subtype')
    if ind_type == 'AVERAGE' and ind_subtype == 'TIME_BUCKET':
        return AverageOverTimeBucketCalculation(FIELD_NAME, ind_id)

    if ind_type == 'AVERAGE':
        return AverageCalculation(dimension=FIELD_NAME, field=ind_id)

    # Stock indicators should take the summed value for a specific time interval.
    # This time interval is computed at runtime by computing the start and end
    # timestamps for the given granularity bucket during the queried interval.
    if ind_type == 'STOCK':
        # TODO(stephen): Enforce that the granularity requested is actually
        # one we can interpret
        granularity = ind['stock_granularity'].lower()
        # A stock indicator can be computed from either the first or the last
        # bucket of the queried interval.
        # TODO(stephen): Support more than first/last bucket by allowing an
        # index to be passed. This will require more validation at runtime.
        bucket_index = -1 if ind_subtype == 'LAST_BUCKET' else 0
        interval_creator = GregorianStockIntervalCreator(granularity, bucket_index)

        # Convert the basic sum/count aggregations into a time interval
        # aggregation that can only be resolved at query time
        calculation = SumCalculation(dimension=FIELD_NAME, field=ind_id)
        aggregations = calculation.aggregations
        for key in aggregations.keys():
            base_aggregation = aggregations[key]
            aggregations[key] = TimeIntervalAggregation(
                base_aggregation, interval_creator
            )
        return calculation

    if ind_type == 'THETA_SKETCH_UNIQUE_COUNT':
        sketch_field = ind['theta_sketch_field']
        # TODO(stephen, vinh): Figure out how to find the sketch size without
        # having it hardcoded. (Potentially via dimension collector data?)
        sketch_size = ind['theta_sketch_size']
        filter_field = ind.get('filter_field')
        count_filter = None
        if filter_field:
            count_filter = Filter(dimension=FIELD_NAME, value=filter_field)

        # NOTE(stephen): Having issues indexing facility_sketch, so temporarily
        # forcing theta sketch usage without a true sketch field.
        return ThetaSketchUniqueCountCalculation(
            ind_id,
            sketch_field,
            sketch_size,
            count_filter=count_filter,
            is_input_theta_sketch=False,
        )

    return SumCalculation(dimension=FIELD_NAME, field=ind_id)


def _cache_groups(groups):
    for group in groups:
        for ind in group['indicators']:
            ind_id = ind['id']
            if ind_id in CALCULATED_INDICATOR_FORMULAS:
                continue
            calculation = _build_indicator_calculation(ind)
            CALCULATIONS_FOR_FIELD[ind_id] = calculation


def _process_groups(groups):
    _cache_groups(groups)

    # Add calculated indicators at the end so that we can use the
    # calculations built above for their constituents
    calc_ind_order = sort_calculated_indicators(CALCULATED_INDICATOR_FORMULAS)
    composite_ids = set(
        [
            ind['id']
            for group in groups
            for ind in group['indicators']
            if ind.get('type') == 'COMPOSITE'
        ]
    )
    for ind_id in calc_ind_order:
        formula = CALCULATED_INDICATOR_FORMULAS[ind_id]
        fields = CALCULATED_INDICATOR_CONSTITUENTS[ind_id]
        constituents_calculation = get_calculation_for_fields(fields)
        if ind_id in composite_ids:
            calculation = build_composite_indicator_calculation(
                ind_id, constituents_calculation, fields
            )
        else:
            calculation = build_calculated_indicator_calculation(
                ind_id, constituents_calculation, formula
            )
        CALCULATIONS_FOR_FIELD[ind_id] = calculation


_process_groups(GROUP_DEFINITIONS)
