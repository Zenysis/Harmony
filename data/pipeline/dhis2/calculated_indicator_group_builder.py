from builtins import str
import json

from collections import OrderedDict
from log import LOG

INDICATOR_ENDPOINT = 'indicators'
GROUPS_ENDPOINT = 'indicatorGroups'
CONSTANTS_ENDPOINT = 'constants'

INDICATOR_FIELDS = [
    'id',
    'name',
    'shortName',
    'dimensionItemType',
    'numerator',
    'denominator',
]
GROUPS_FIELDS = ['id', 'name', 'displayName', 'indicators']
CONSTANTS_FIELDS = ['id', 'name', 'value']


BASE_CALCULATED_INDICATOR_RESOURCE_MAP = {
    INDICATOR_ENDPOINT: INDICATOR_FIELDS,
    GROUPS_ENDPOINT: GROUPS_FIELDS,
    CONSTANTS_ENDPOINT: CONSTANTS_FIELDS,
}

GROUPS_OUTPUT_FIELDS = ['groupId', 'groupText', 'groupTextShort']
INDICATOR_OUTPUT_FIELDS = ['dhis2_id', 'text', 'short_text']

GROUP_FIELD_RENAME = {
    field: GROUPS_OUTPUT_FIELDS[i]
    for i, field in enumerate(GROUPS_FIELDS[: len(GROUPS_OUTPUT_FIELDS)])
}
INDICATOR_FIELD_RENAME = {
    field: INDICATOR_OUTPUT_FIELDS[i]
    for i, field in enumerate(INDICATOR_FIELDS[: len(INDICATOR_OUTPUT_FIELDS)])
}


class CalculatedIndicatorBuilder:
    def __init__(
        self,
        indicator_ids,
        resources,
        source='',
        indicator_component_lookup=None,
        support_program_indicators=False,
        prefix='',
    ):
        self.prefix = prefix
        self.source = source
        self.indicator_ids = indicator_ids
        self.constants_lookup = {
            constant['id']: constant for constant in resources['constants']
        }
        self.ind_lookup = {
            indicator['id']: indicator for indicator in resources['indicators']
        }
        self.indicator_groups = resources['indicatorGroups']

        self.unique_data_elements = set()
        self.calc_with_missing_elements = []
        self.created_indcators_count = 0
        self.created_indcator_groups_count = 0
        self.broken_indicators = []
        self.missing_components = set()
        self.seen_indicator_ids = set()
        self.indicator_component_lookup = indicator_component_lookup or {}
        self.support_program_indicators = support_program_indicators
        self.ids_using_program_indicators = set()

    def add_prefix(self, val):
        return f'{self.prefix}_{val}' if self.prefix else val

    # Process a single indicator found in a formula
    def process_indicator_component(
        self, output_formula_component, operator, indicator_field
    ):
        self.unique_data_elements.add(indicator_field)
        output_formula_component.append(operator)
        indicator_id = indicator_field.replace('.', '_')
        if indicator_id not in self.indicator_ids:
            # If the indicator field is a disaggregation that
            # is unnecessary/default then replace it with the
            # correct indicator id
            prefix = indicator_id.split('_')[0]
            if prefix in self.indicator_ids:
                indicator_id = prefix
            else:
                # NOTE/HACK is happening for liberia. Will return None
                # log the incorrect indicator and skip it.
                self.missing_components.add(prefix)
                return False
                # raise ValueError('Indicator %s not found: %s, %s'
                #     % (indicator_field, prefix, component))
        indicator_id = self.indicator_component_lookup.get(indicator_id, indicator_id)
        output_formula_component.append(self.add_prefix(indicator_id))
        return True

    def get_formula_component(self, component):
        output_formula_component = []
        for indicator in component.split('}'):
            if any(part in indicator for part in ['[days]', 'OUG{', 'R{', 'D{']):
                # TODO(abby, kenneth): Figure out how to handle these or log them. Skip them for
                # now because they give malformed formulas that can't be used.
                self.missing_components.add(indicator)
                return None

            if '#{' in indicator:
                # This means that the field represents an indicator.
                operator, indicator_field = indicator.split('#{')
                if not self.process_indicator_component(
                    output_formula_component, operator, indicator_field
                ):
                    return None
            elif 'C{' in indicator:
                # This means that the field represents a constant.
                operator, constant_field = indicator.split('C{')
                output_formula_component.append(operator)
                if constant_field not in self.constants_lookup:
                    return None
                output_formula_component.append(
                    str(self.constants_lookup[constant_field]['value'])
                )
            elif 'I{' in indicator:
                # This means that the field represents a program indicator.
                operator, indicator_field = indicator.split('I{')
                if not self.process_indicator_component(
                    output_formula_component, operator, indicator_field
                ):
                    return None
            else:
                # Indicator could potentially be one of [')', '(', '1', '}']
                output_formula_component.append(indicator)
        return output_formula_component

    def get_formula(self, numerator, denominator):
        # Create the formula for a calculated indicator given the numerator and
        # denominator. Numerators & denominators are in the form of
        # '#{indicator}+C{constant}+I{program indicator}'
        # TODO(moriah): if we come across a formula using other types of
        # formula components that dhsi2 supports deal with them here.
        processed_numerator = self.get_formula_component(numerator)
        if len(denominator) > 1:
            processed_denominator = self.get_formula_component(denominator)
            if not processed_numerator or not processed_denominator:
                return None
            return f'({" ".join(processed_numerator)}) / ({" ".join(processed_denominator)})'
        if not processed_numerator:
            return None
        return f'({" ".join(processed_numerator)})'

    def build_indicators(self, raw_indicators):
        output_indicators = []
        for indicator in raw_indicators:
            ind_id = indicator['id']
            self.seen_indicator_ids.add(ind_id)
            if ind_id not in self.ind_lookup:
                # If the indicator id is not in the set of indicators
                # then skip it.
                continue
            # Create the indicators for the indicator Group
            new_indicator = OrderedDict()
            old_indicator = self.ind_lookup[ind_id]
            numerator = old_indicator['numerator']
            denominator = old_indicator.get('denominator', '1')

            # If calculated indicators are using program indicators, then log
            # it because the program indicator pipeline steps need to be added.
            if not self.support_program_indicators and (
                'I{' in numerator or 'I{' in denominator
            ):
                self.ids_using_program_indicators.add(ind_id)

            for old_field, new_field in INDICATOR_FIELD_RENAME.items():
                # Select the indicator fields wanted
                new_indicator[new_field] = old_indicator[old_field]
            new_indicator['definition'] = old_indicator.get('description', '')
            new_indicator['id'] = self.add_prefix(
                new_indicator['dhis2_id'].replace('.', '_')
            )
            new_formula = self.get_formula(numerator, denominator)
            if not new_formula:
                self.calc_with_missing_elements.append(indicator)
                continue
            new_indicator['formula'] = new_formula
            self.created_indcators_count += 1
            output_indicators.append(new_indicator)
        return output_indicators

    def get_miscellaneous_group(self):
        unaffiliated_ids = set(self.ind_lookup.keys()) - self.seen_indicator_ids
        unaffiliated_indicators = [
            self.ind_lookup[ind_id] for ind_id in unaffiliated_ids
        ]
        return {
            'groupId': f'{self.source}_miscellaneous_indicators',
            'groupText': 'Miscellaneous Calculated Indicators',
            'groupTextShort': 'Misc. Calculated Indicators',
            'calculated_indicators': self.build_indicators(unaffiliated_indicators),
        }

    def build_groups(self):
        # pylint: disable=W0201
        calculated_groups = []

        for group in self.indicator_groups:
            # Create a indicator group with selected fields
            output_group = OrderedDict()
            for old_field, new_field in GROUP_FIELD_RENAME.items():
                output_group[new_field] = group[old_field]
            output_group['groupId'] = self.add_prefix(output_group['groupId'])
            output_group['calculated_indicators'] = self.build_indicators(
                group['indicators']
            )
            self.created_indcator_groups_count += 1
            calculated_groups.append(output_group)
        calculated_groups.append(self.get_miscellaneous_group())
        return calculated_groups

    def write_output_indicators(self, output_file, json_file_name=None):
        # Write the calculated indicator groups to the output file
        calculated_groups = self.build_groups()

        with open(output_file, 'w') as python_output_file:
            # Clean up the indicator data so that it produces a consistent
            # output each time.
            json_data = json.dumps(calculated_groups, indent=4)
            # pylint: disable=W1402
            json_data = (
                json_data.replace(' \n', '\n')
                .replace('"\n', '",\n')
                .replace('\'', '\\\'')
                .replace('"', '\'')
                .replace('\u00e2\u2030\u00a5', '')
                .replace('\u00a0', '')
                .replace('\u201c', '"')
                .replace('\u201d', '"')
                .replace('  ', ' ')
            )
            python_output_file.write('CALCULATED_GROUPS = ')
            python_output_file.write(json_data)
            python_output_file.write('\n')

        if json_file_name:
            # HACK(abby): Temp workaround for field setup
            for group in calculated_groups:
                group['indicators'] = group['calculated_indicators']
                del group['calculated_indicators']

            json_data = json.dumps(calculated_groups, indent=4)
            with open(json_file_name, 'w') as json_output_file:
                json_output_file.write(json_data)

    def print_stats(self):
        stats = [
            '',
            'Finished writing indicators',
            '*' * 80,
            f'Unique Data Elements Found ({len(self.unique_data_elements)}):',
            '*' * 80,
            f'Indicator Groups written {self.created_indcator_groups_count}',
            '*' * 80,
            f'Indicators written {self.created_indcators_count}',
            '*' * 80,
            f'Indicators with missing elements: ({len(self.calc_with_missing_elements)})',
            '*' * 80,
            f'Missing elements: ({self.missing_components})',
        ]
        if self.ids_using_program_indicators:
            stats.extend(
                [
                    '*' * 80,
                    (
                        'Indicators requiring program indicators: '
                        f'({len(self.ids_using_program_indicators)})'
                    ),
                    '*' * 80,
                    f'Indicators: ({self.ids_using_program_indicators})',
                ]
            )
        LOG.info('\n'.join(stats))
