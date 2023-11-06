#!/usr/bin/env python
# NOTE(stephen): For best results, use pypy to run this script since pypy
# respects dict key insertion order.
import json

from collections import defaultdict, OrderedDict

DATA_ELEMENT_TYPE_FIELDS = [
    'aggregationType',
    'domainType',
    'valueType',
    'dimensionItemType',
]
BASE_FIELDS = ['id', 'displayName', 'shortName']
DATA_ELEMENT_FIELDS = BASE_FIELDS + DATA_ELEMENT_TYPE_FIELDS
GROUPS = 'dataElementGroups'
ELEMENTS = 'dataElementOperands'
BASE_ELEMENT = 'dataElements'
DATA_SETS = 'dataSets'
DATA_SET_FIELDS = ['*']
BASE_LOCATION_RESOURCE_MAP = {
    GROUPS: DATA_ELEMENT_FIELDS + [BASE_ELEMENT],
    ELEMENTS: BASE_FIELDS + ['dataElement'],
    BASE_ELEMENT: DATA_ELEMENT_FIELDS,
    DATA_SETS: DATA_SET_FIELDS,
}

ALWAYS_INCLUDE = lambda ind: True
REPORTING_RATES = [
    'Yearly',
    'SixMonthly',
    'FinancialJuly',
    'Quarterly',
    'Monthly',
    'Weekly',
    'Daily',
    'FinancialNov',
    'FinancialApril',
]

BASE_DATASET_RESOURCE_MAP = {
    'dataSets': [
        'id',
        'displayName',
        'dataSetElements',
        'periodType',
        'organisationUnits',
    ]
}

DATASET_REPORTING = [
    'REPORTING_RATE_ON_TIME',
    'REPORTING_RATE',
    'ACTUAL_REPORTS',
    'ACTUAL_REPORTS_ON_TIME',
    'EXPECTED_REPORTS',
]


def get_processed_id(ind_id):
    return ind_id.replace('.', '_')


def get_data_element_id(ind_id):
    return ind_id.split('.')[0]


class IndicatorGroupBuilder:
    '''Build the disaggregated indicator definitions for the DHIS2 instance
    based on the datasets defined in DHIS2.'''

    def __init__(
        self,
        resources,
        indicator_filter=ALWAYS_INCLUDE,
        default_reporting_rate='Monthly',
        use_larger_reporting_rate=False,
        prefix='',
    ):
        self.prefix = prefix
        self.indicator_groups = resources[GROUPS]
        data_element_operands = resources.get(ELEMENTS, [])
        self.indicators = data_element_operands + resources[BASE_ELEMENT]
        self.default_reporting_rate = default_reporting_rate
        self.indicator_lookup = self._build_indicator_lookup(
            resources[BASE_ELEMENT], data_element_operands
        )
        self.missing_data_elements = defaultdict(set)
        self.unique_indicator_ids = set()
        self.indicator_filter = indicator_filter
        decide_between_reporting_rates = min if use_larger_reporting_rate else max
        self._reporting_rate_lookup = self._build_reporting_rate_lookup(
            resources[DATA_SETS],
            decide_between_reporting_rates,
        )

    def add_prefix(self, val):
        return f'{self.prefix}_{val}' if self.prefix else val

    def get_processed_dataset(self, dataset):
        short_text = (
            dataset['shortName'] if 'shortName' in dataset else dataset['displayName']
        )
        new_dataset = {
            'groupTextShort': short_text.strip(),
            'groupText': dataset['displayName'].strip(),
            'groupId': self.add_prefix(dataset['id']),
            'indicators': [],
        }
        return new_dataset

    def get_processed_indicator(self, processed_id, indicator, aggregation_type=None):
        new_indicator = OrderedDict()
        new_indicator['id'] = self.add_prefix(processed_id)
        new_indicator['dhis2_id'] = indicator['id']
        new_indicator['text'] = indicator['displayName'].strip()
        new_indicator['short_text'] = indicator['shortName'].strip()
        extra_type_info = {
            field: indicator.get(field) for field in DATA_ELEMENT_TYPE_FIELDS
        }
        new_indicator['data_element_type_info'] = extra_type_info
        children = indicator.get('children')
        if children:
            new_indicator['children'] = [
                self.add_prefix(get_processed_id(c['id'])) for c in children
            ]
            new_indicator['type'] = 'COMPOSITE'
        elif aggregation_type:
            # Attach the correct aggregation type to the indicator.
            # TODO(stephen, moriah): Handle COUNT, AVERAGE, and any other
            # aggregation type that isn't SUM (the default).
            if aggregation_type == 'LAST_SUM_ORG_UNIT':
                new_indicator['type'] = 'STOCK'
                new_indicator['subtype'] = 'LAST_BUCKET'
                new_indicator['stock_granularity'] = 'MONTH'

        return new_indicator

    def _build_reporting_rate_lookup(self, data_sets, decide_between_reporting_rates):
        _reporting_rate_lookup = {}
        reporting_rates_by_id = defaultdict(set)
        for data_set in data_sets:
            reporting_rate = data_set.get('periodType', self.default_reporting_rate)
            if reporting_rate:
                for data_set_element in data_set['dataSetElements']:
                    data_element_id = data_set_element['dataElement']['id']
                    if data_element_id in _reporting_rate_lookup:
                        # If there are multiple data sets that contain a data element
                        # it is possible that there are conflicting reporting rates for the
                        # data element. If this is the case use the most granular reporting rate.
                        old_reporting_rate = _reporting_rate_lookup[data_element_id]
                        if old_reporting_rate != reporting_rate:
                            reporting_rates_by_id[data_element_id].add(reporting_rate)
                            reporting_rates_by_id[data_element_id].add(
                                old_reporting_rate
                            )
                        new_val = REPORTING_RATES[
                            decide_between_reporting_rates(
                                REPORTING_RATES.index(old_reporting_rate),
                                REPORTING_RATES.index(reporting_rate),
                            )
                        ]
                        _reporting_rate_lookup[data_element_id] = new_val
                    else:
                        _reporting_rate_lookup[data_element_id] = reporting_rate
        print(
            f'The following indicators have multiple reporting rates: {reporting_rates_by_id}'
        )
        return _reporting_rate_lookup

    def _build_indicator_lookup(self, data_elements, data_element_operands):
        # Create a lookup of indicators data element to the indicator dict
        # and all children that it has.
        indicator_lookup = defaultdict(list)
        indicator_lookup = {}
        for element in data_elements:
            element_id = element['id']
            element['children'] = []
            indicator_lookup[element_id] = element

        for operand in data_element_operands:
            operand_id = operand['id']
            element_id = operand['dataElement']['id']

            # If the operand ID and the element ID do not match, this means the
            # operand is part of a larger composite element.
            if operand_id != element_id:
                if element_id in indicator_lookup:
                    indicator_lookup[element_id]['children'].append(operand)
                else:
                    print(element_id, operand_id)

        return indicator_lookup

    def _add_indicator(self, dataset, ind_id, ind, aggregation_type):
        # NOTE(moriah) DHIS2 allows indicators to be duplicated over multiple
        # indicator groups. This makes it so that an indicator can only be
        # found once, in the first DHIS2 group it is seen in.
        if ind_id not in self.unique_indicator_ids:
            new_indicator = self.get_processed_indicator(ind_id, ind, aggregation_type)
            new_indicator['reporting_rate'] = self._reporting_rate_lookup.get(
                ind_id[:11], self.default_reporting_rate
            )
            include_indicator = self.indicator_filter(new_indicator)
            if include_indicator:
                self.unique_indicator_ids.add(ind_id)
                dataset['indicators'].append(new_indicator)

    def _build_indicator_group(self, dataset):
        # Process the DHIS2 indicator group into the correct format, if a data
        # element is in the DHIS2 dataset add all of its disaggregations to the
        # group.
        new_dataset = self.get_processed_dataset(dataset)
        for item in dataset['dataElements']:
            item_id = item['id']

            # Sometimes datasets can include data elements that are not included
            # in the dataElements fetch. Store these for debugging.
            if item_id not in self.indicator_lookup:
                self.missing_data_elements[dataset['id']].add(item_id)
                continue

            data_element = self.indicator_lookup[item_id]
            children = data_element['children']
            aggregation_type = data_element['aggregationType']
            ind_id = data_element['id']
            self._add_indicator(new_dataset, ind_id, data_element, aggregation_type)

            for child in children:
                new_indicator_id = get_processed_id(child['id'])
                self._add_indicator(
                    new_dataset, new_indicator_id, child, aggregation_type
                )
        return new_dataset

    def _build_misc_group(self):
        # Make sure that if any dataElements are not part of a dataset get added
        # to a group.
        missing_elements = []

        for element_id in self.indicator_lookup:
            if element_id not in self.unique_indicator_ids:
                missing_elements.append({'id': element_id})

        misc_dataset = {
            'displayName': 'Miscellaneous DHIS2 indicators',
            'id': 'dhis2_misc',
            'dataElements': missing_elements,
            'aggregationType': 'SUM',
        }
        return self._build_indicator_group(misc_dataset)

    def _build_indicator_groups(self):
        # For all of the data sets in indicator groups process them into the format
        # that we use for indcator groups.
        datasets = []
        for dataset in self.indicator_groups:
            new_dataset = self._build_indicator_group(dataset)
            if len(new_dataset['indicators']) > 0:
                datasets.append(new_dataset)
        # Create a group with any dataElements that are not part of a dataset in DHIS2.
        misc_group = self._build_misc_group()
        if len(misc_group['indicators']) > 0:
            datasets.append(misc_group)
        return datasets

    def write_indicator_groups(
        self, file_name, python_file_name=None, element_filter=None
    ):
        indicator_groups = self._build_indicator_groups()
        if element_filter:
            filtered_groups = []
            for group in indicator_groups:
                filtered_indicators = []
                for indicator in group['indicators']:
                    if element_filter(indicator):
                        filtered_indicators.append(indicator)
                if len(filtered_indicators) > 0:
                    filtered_group = group
                    filtered_group['indicators'] = filtered_indicators
                    filtered_groups.append(filtered_group)
            indicator_groups = filtered_groups

        json_data = json.dumps(indicator_groups, indent=4)
        with open(file_name, 'w') as output_file:
            output_file.write(json_data)

        if python_file_name:
            with open(python_file_name, 'w') as python_output_file:
                # Clean up the indicator data so that it produces a consistent
                # output each time.
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
                    .replace('null', 'None')
                )
                python_output_file.write('DHIS2_GROUPS = ')
                python_output_file.write(json_data)
                python_output_file.write('\n')

        print('Finished writing datasets')

        n_elements = 0
        for dataset in indicator_groups:
            n_elements += len(dataset['indicators'])

        print(
            'The following indicators have been omitted because they are not in %s:'
            % ELEMENTS
        )
        print(
            f'Datasets with missing elements: {list(self.missing_data_elements.keys())}'
        )
        print(
            'There are %s missing elements.'
            % len(list(self.missing_data_elements.values()))
        )
        print(f'Missing elements: {list(self.missing_data_elements.values())}')
        print(f'Data sets written {len(indicator_groups)}')
        print(f'Data Elements written {n_elements}')


class ReportingElementBuilder:
    def __init__(self, dataset_generator):
        self.datasets = self.build_datasets(dataset_generator)

    def build_datasets(self, dataset_generator):
        dataset_resources = dataset_generator.get_resources(BASE_DATASET_RESOURCE_MAP)
        datasets = []
        for dataset in dataset_resources['dataSets']:
            # NOTE(Moriah): Each data set has dataset elements that are actually dataElements.
            # I thought that they were originally used and had rates associated with them
            # but I think the have more to do with how Dhis2 calculates rates. I will revisit
            # this in vV of the dataset integration.
            dataset_id = dataset['id']
            dataset_text = dataset['displayName']
            dataset_rate = dataset['periodType']
            dataset_disaggragations = []
            for report_disaggrgegation in DATASET_REPORTING:
                dataset_disaggragations.append(
                    {
                        'dhis2_id': dataset_id + '.' + report_disaggrgegation,
                        'id': dataset_id + '_' + report_disaggrgegation,
                        'text': dataset_text + ' (' + report_disaggrgegation + ')',
                        'reporting_rate': dataset_rate,
                    }
                )
            datasets.append(
                {
                    'unit_ids': [oid['id'] for oid in dataset['organisationUnits']],
                    'groupId': dataset_id,
                    'groupText': dataset_text,
                    'indicators': dataset_disaggragations,
                    'reporting_rate': dataset_rate,
                }
            )
        return datasets

    def write_datasets(self, output_file_name, output_python_file=''):
        json_data = json.dumps(self.datasets, indent=4)
        python_datasets = json.dumps(
            [
                {
                    'groupId': group['groupId'],
                    'groupText': group['groupText'],
                    'indicators': group['indicators'],
                }
                for group in self.datasets
            ],
            indent=4,
        )
        with open(output_file_name, 'w') as output_file:
            output_file.write(json_data)

        with open(output_python_file, 'w') as python_output_file:
            # Clean up the indicator data so that it produces a consistent
            # output each time.
            python_datasets = (
                python_datasets.replace(' \n', '\n')
                .replace('"\n', '",\n')
                .replace('\'', '\\\'')
                .replace('"', '\'')
                .replace('\u00e2\u2030\u00a5', '')
                .replace('\u00a0', '')
                .replace('\u201c', '"')
                .replace('\u201d', '"')
                .replace('  ', ' ')
            )
            python_output_file.write('DHIS2_DATASETS = ')
            python_output_file.write(python_datasets)
            python_output_file.write('\n')
