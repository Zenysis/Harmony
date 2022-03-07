import re

from toposort import toposort_flatten

# Pattern for extracting the data fields referenced in a
# calculated indicator formula
FIELD_MATCH_PATTERN = re.compile(r'\b([a-zA-Z][a-zA-Z0-9_]+)\b')

# Extract the unique set of fields referenced in the given formula
def get_constituent_fields(formula):
    return set(FIELD_MATCH_PATTERN.findall(formula))


# Check if a calculated indicator formula is valid and can be computed
def formula_is_valid(formula):
    # HACK: check for placeholder values to determine formula validity
    # TODO(stephen): Find set difference of
    # (formula constituents - config.indicators.VALID_FIELDS) to correctly
    # detect invalid formulas. Requires refactor of config.indicators to
    # remove circular reference on this file.
    constituents = get_constituent_fields(formula)
    return len(constituents) and 'XXXXX' not in formula


# Build a raw calculated indicator that can be processed like
# a predefined calculated indicator
def build_calculated_indicator(
    ind_id, name, formula, decrease_is_good=False, program_areas=None, value_type=None
):
    return {
        'id': ind_id,
        'name': name,
        'formula': formula,
        'decrease_is_good': decrease_is_good,
        'program_areas': program_areas or [],
        'value_type': value_type,
    }


# Topologically sort the calculated indicators so that any dependent
# calculations will appear in the list before any indicator that needs them.
# 'formulas' is a mapping fron indicator ID to the formula string needed to
# calculate it.
# Will throw an error if there is a circular dependency.
def sort_calculated_indicators(formulas):
    dep_graph = {}
    calc_ind_ids = set(formulas.keys())
    for ind_id, formula in formulas.items():
        fields = get_constituent_fields(formula)
        # Determine whether any fields used by this formula are themselves
        # calculated indicators.
        dependencies = fields & calc_ind_ids

        # Store the dependencies for this indicator in the dependency graph.
        dep_graph[ind_id] = dependencies

    return toposort_flatten(dep_graph)


def guess_value_type(c_ind):
    # If the calculated indicator has a non-empty value type set, use that.
    if c_ind.get('value_type'):
        return c_ind['value_type']

    # If the formula uses division, it is likely to be a percentage type.
    if '/' in c_ind['formula']:
        return 'PERCENT'

    # Let the frontend use the default value type when displaying this
    # calculated indicator.
    return None


# Build a druid Calculation for the provided calculated indicator formula. The
# base calculation provided is the underlying calculation needed to compute
# all the individual fields used by the formula.
def build_calculated_indicator_calculation(ind_id, constituents_calculation, formula):
    # TODO(stephen): Nesting import to avoid circular dependencies. Fix this by
    # refactoring the location of these functions.
    from db.druid.calculations.base_calculation import BaseCalculation

    # Clone the calculation so we do not modify it in place.
    calculation = BaseCalculation(
        aggregations=constituents_calculation.aggregations,
        post_aggregations=constituents_calculation.post_aggregations,
        strict_null_fields=constituents_calculation.strict_null_fields,
    )
    calculation.add_post_aggregation_from_formula(ind_id, formula)
    return calculation


# Build a formula calculation and list of constituent fields the composite indicator
# needs.
def get_exports_for_composite_indicator(indicator):
    assert 'children' in indicator, (
        'Somehow received a non-composite indicator: %s' % indicator
    )
    constituents = set(indicator['children'])
    formula = ' + '.join(constituents).strip()
    return (formula, constituents)
