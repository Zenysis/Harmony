from pydruid.utils.filters import Filter

from config.druid_base import FIELD_NAME
from config.template.calculated_indicators import (
    CALCULATED_INDICATOR_CONSTITUENTS,
    CALCULATED_INDICATOR_FORMULAS,
)
from config.template.indicators import GROUP_DEFINITIONS
from data.calculated_indicator.util import (
    build_calculated_indicator_calculation,
    get_exports_for_composite_indicator,
    sort_calculated_indicators,
)
from data.composite_indicator.util import build_composite_indicator_calculation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.calculations.simple_calculation import (
    AverageCalculation,
    AverageOverTimeBucketCalculation,
    LastValueCalculation,
    MaxCalculation,
    SumCalculation,
    WeightedAverageCalculation,
)
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation
from log import LOG

# The mapping of Calculated Indicator to its respective calculation.
CALCULATIONS_FOR_FIELD = {}

# Build a unified calculation for the requested fields that combines each
# fields aggregations and post aggregations into a single queriable set
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


# pylint: disable=too-many-return-statements
def _build_indicator_calculation(ind):
    ind_id = ind['id']
    ind_type = ind.get('type')
    ind_subtype = ind.get('subtype')
    # The default calculation for an indicator is a simple sum and count.
    if not ind_type:
        return SumCalculation(dimension=FIELD_NAME, field=ind_id)

    if ind_type == 'MAX':
        return MaxCalculation(dimension=FIELD_NAME, field=ind_id)

    if ind_type == 'AVERAGE':
        if ind_subtype == 'TIME_BUCKET':
            return AverageOverTimeBucketCalculation(FIELD_NAME, ind_id)
        if ind_subtype:
            LOG.error('Unknown AVERAGE indicator subtype: %s', ind_subtype)
        return AverageCalculation(dimension=FIELD_NAME, field=ind_id)

    # Stock indicators should take the summed value when the row's timestamp equals
    # the max timestamp seen for that field in the grouping.
    if ind_type == 'STOCK':
        return LastValueCalculation(dimension=FIELD_NAME, field=ind_id)

    if ind_type == 'WEIGHTED_AVG':
        return WeightedAverageCalculation(
            dimension=FIELD_NAME, field=ind_id, weight_field=ind['weight_field']
        )

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

    LOG.error('Indicator type not found: %s', ind_type)
    return SumCalculation(dimension=FIELD_NAME, field=ind_id)


def _cache_groups(groups):
    for group in groups:
        for ind in group['indicators']:
            ind_id = ind['id']
            # Calculated indicators and composite indicators will be processed last.
            is_composite = ind.get('type') == 'COMPOSITE'
            if ind_id in CALCULATED_INDICATOR_FORMULAS or is_composite:
                if is_composite:
                    (formula, constituents) = get_exports_for_composite_indicator(ind)
                    CALCULATED_INDICATOR_FORMULAS[ind_id] = formula
                    CALCULATED_INDICATOR_CONSTITUENTS[ind_id] = constituents
                continue
            calculation = _build_indicator_calculation(ind)
            CALCULATIONS_FOR_FIELD[ind_id] = calculation


def _process_groups(groups):
    _cache_groups(groups)

    # Add calculated indicators at the end so that we can use the
    # calculations built above for their constituents
    calc_ind_order = sort_calculated_indicators(CALCULATED_INDICATOR_FORMULAS)
    composite_ids = set(
        ind['id']
        for group in groups
        for ind in group['indicators']
        if ind.get('type') == 'COMPOSITE'
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
