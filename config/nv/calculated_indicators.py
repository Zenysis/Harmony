# pylint: disable=C0301
# coding=utf-8
from collections import OrderedDict

from config.template.calculated_indicator_defs.calculated_indicator_defs import (
    CALCULATED_INDICATOR_GROUP_DEFINITIONS,
)
from data.calculated_indicator.util import (
    formula_is_valid,
    get_constituent_fields,
    guess_value_type,
)

# Map from calculated indicator id to a list of constituent indicator ids.
CALCULATED_INDICATOR_CONSTITUENTS = {}
CALCULATED_INDICATOR_FORMULAS = OrderedDict()
CALCULATED_INDICATOR_GROUPS = []


def _build_indicator_group(
    group_id,
    group_text,
    group_text_short,
    indicators,
    hidden_by_default=False,
    disabled=False,
):
    return {
        'groupId': group_id,
        'groupText': group_text,
        'groupTextShort': group_text_short,
        'hiddenByDefault': hidden_by_default,
        'disabled': disabled,
        'indicators': indicators,
    }


def _build_group_indicator(c_ind):
    return {
        'id': c_ind['id'],
        'text': c_ind['text'],
        'constituents': list(CALCULATED_INDICATOR_CONSTITUENTS[c_ind['id']]),
        'enableDimensions': c_ind['enableDimensions'],
        'definition': c_ind['definition'],
        'valueType': guess_value_type(c_ind),
    }


def _set_exports_for_indicator(c_ind):
    ind_id = c_ind['id']
    formula = c_ind['formula'].strip()
    if not formula_is_valid(formula):
        return

    CALCULATED_INDICATOR_FORMULAS[ind_id] = formula
    CALCULATED_INDICATOR_CONSTITUENTS[ind_id] = get_constituent_fields(formula)


def get_constituents_for_indicator(ind_id):
    return CALCULATED_INDICATOR_CONSTITUENTS.get(ind_id, set())


# Process a list of calculated indicators and output the frontend usable
# indicator definition
def process_indicator_definitions(calculated_indicators):
    output = []
    for c_ind in calculated_indicators:
        formula = c_ind['formula']
        if not formula_is_valid(formula):
            continue
        _set_exports_for_indicator(c_ind)
        output.append(_build_group_indicator(c_ind))
    return output


def process_group_definition(group):
    indicators = process_indicator_definitions(group['calculated_indicators'])
    # TODO(stephen): The calculated indicator group definition should already
    # match the output indicator definition format. You can consolidate this
    # method call if you remove the 'calculated_indicators' key
    ind_group = _build_indicator_group(
        group['groupId'],
        group['groupText'],
        group['groupTextShort'],
        indicators,
        group.get('hiddenByDefault', False),
        group.get('disabled', False),
    )
    CALCULATED_INDICATOR_GROUPS.append(ind_group)


for c_ind_group in CALCULATED_INDICATOR_GROUP_DEFINITIONS:
    process_group_definition(c_ind_group)
