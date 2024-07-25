from pydruid.utils.filters import Filter

from config.druid_base import FIELD_NAME
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.calculations.simple_calculation import SumCalculation

# Optimize a composite calculation that would normally sum multiple child fields
# using a post aggregator into a single SumCalculation that can calculate those
# child fields directly in a single aggregation. If the calculation cannot be
# optimized, return None.
def optimize_composite_calculation(composite_id, children_calculation, child_fields):
    # Cannot optimize if there are post aggregations combining multiple fields.
    if children_calculation.post_aggregations:
        return None

    filter_fields = set()
    aggregations = children_calculation.aggregations
    for field in child_fields:
        field_agg = aggregations.get(field)

        # If an aggregation is missing for this field (this should never happen)
        # or the aggregator is not a dictionary (implies it is a more complex
        # type), then we cannot optimize.
        if not field_agg or not isinstance(field_agg, dict):
            return None

        # All child fields should be filtered sum calculations where the filter
        # limits the aggregator to just the fields needed to compute the child
        # field.
        if (
            field_agg['type'] != 'filtered'
            or field_agg['aggregator']['type'] != 'doubleSum'
        ):
            return None

        # Only can optimize simple dimension filters (like selector or in) that
        # filter over the field dimension.
        agg_filter = field_agg['filter']
        if agg_filter.get('dimension') != FIELD_NAME:
            return None

        filter_type = agg_filter['type']
        if filter_type == 'selector':
            filter_fields.add(agg_filter['value'])
        elif filter_type == 'in':
            filter_fields.update(agg_filter['values'])
        else:
            return None

    composite_filter = (
        Filter(dimension=FIELD_NAME, value=filter_fields.pop())
        if len(filter_fields) == 1
        else Filter(type='in', dimension=FIELD_NAME, values=sorted(filter_fields))
    )

    return SumCalculation.create_with_filter(
        field=composite_id, agg_filter=composite_filter
    )


def build_composite_indicator_calculation(
    composite_id, children_calculation, child_fields
):
    '''Create a full calculation for the composite indicator that combines the
    child field calculations into a single calculation.

    Args:
        composite_id: The composite indicator ID the final value will be stored
            under.
        children_calculation: A Calculation object (deriving from
            BaseCalculation) that has all aggregations/post aggregations built
            for the child fields.
        child_fields: The list of child fields this composite indicator is
            combining.
    '''
    optimized_calculation = optimize_composite_calculation(
        composite_id, children_calculation, child_fields
    )
    if optimized_calculation:
        return optimized_calculation

    # Clone the calculation so we do not modify it in place.
    full_calculation = BaseCalculation(
        aggregations=children_calculation.aggregations,
        post_aggregations=children_calculation.post_aggregations,
        strict_null_fields=children_calculation.strict_null_fields,
    )
    formula = ' + '.join(child_fields)
    full_calculation.add_post_aggregation_from_formula(composite_id, formula)
    return full_calculation
