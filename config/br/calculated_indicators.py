# pylint: disable=C0301
# TODO(stephen, anyone): This calculated indicator structure is in the
# deprecated format. Update it to match the other deployments.

import re

from collections import defaultdict, OrderedDict

from config.br.calculated_indicator_defs.calculated_indicator_defs import (
    CALCULATED_INDICATOR_GROUP_DEFINITIONS,
)

CALCULATED_INDICATOR_FORMULAS = OrderedDict()

# TODO(sball): Make this less hacky.
CALCULATED_INDICATOR_GROUP = {
    'groupId': 'zenysis-calculated-indicators',
    'groupText': 'Calculated Indicators',
    'groupTextShort': 'Calculated Indicators',
    'indicators': [],
}

# Map from calculated indicator id to a list of constituent indicator ids.
CALCULATED_INDICATOR_CONSTITUENTS = {}

# Map from program area to calculated indicator ids
CALCULATED_INDICATOR_PROGRAM_AREAS = defaultdict(set)


def _build_group_indicator(indicator_id, name, ind_obj, value_type=None):
    output = {
        'id': indicator_id,
        'text': name,
        'decreaseIsGood': ind_obj['decrease_is_good'],
        'programAreas': [],  # ind_obj['program_areas']
        'constituents': list(CALCULATED_INDICATOR_CONSTITUENTS[indicator_id]),
    }
    if value_type:
        output['valueType'] = value_type
    return output


def _get_constituent_fields(formula):
    return set(re.findall(r'\b([a-zA-Z][a-zA-Z0-9_]+)\b', formula))


def _formula_is_valid(formula):
    # HACK: check for placeholder values to determine formula validity
    # TODO(stephen): Find set difference of
    # (formula constituents - config.indicators.VALID_FIELDS) to correctly
    # detect invalid formulas. Requires refactor of config.indicators to
    # remove circular reference on this file.
    constituents = _get_constituent_fields(formula)
    return len(constituents) and 'XXX' not in formula


def _set_exports_for_indicator(
    ind_id, ind_name, raw_formula, ind_obj, hide_constituents=False
):
    formula = raw_formula.strip()
    if not _formula_is_valid(formula):
        return
    value_type = 'PERCENT' if '/' in formula else None

    CALCULATED_INDICATOR_FORMULAS[ind_id] = formula
    if not hide_constituents:
        CALCULATED_INDICATOR_CONSTITUENTS[ind_id] = _get_constituent_fields(formula)
    CALCULATED_INDICATOR_GROUP['indicators'].append(
        _build_group_indicator(ind_id, ind_name, ind_obj, value_type)
    )

    '''
    for p in ind_obj['program_areas']:
        CALCULATED_INDICATOR_PROGRAM_AREAS[p].add(ind_id)
    '''


def get_constituents_for_indicator(ind_id):
    return CALCULATED_INDICATOR_CONSTITUENTS.get(ind_id, set())


for indicator in CALCULATED_INDICATOR_GROUP_DEFINITIONS:
    base_id = indicator['id']
    _set_exports_for_indicator(
        base_id,
        indicator['name'],
        indicator['formula'],
        indicator,
        indicator.get('hide_constituents'),
    )

    if 'disaggregations' in indicator:
        for disaggregation in indicator['disaggregations']:
            full_id = base_id + '_' + disaggregation['sub_id']
            full_name = '%s - %s' % (indicator['name'], disaggregation['name'])
            _set_exports_for_indicator(
                full_id,
                full_name,
                disaggregation['formula'],
                indicator,
                disaggregation.get('hide_constituents'),
            )
