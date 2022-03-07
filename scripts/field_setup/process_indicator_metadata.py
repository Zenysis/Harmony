#!/usr/bin/env python
import sys
from csv import DictWriter
from os import listdir
from os.path import isfile, join

import json
import related

from pylib.base.flags import Flags
from log import LOG

from config.druid_base import FIELD_NAME
from data.composite_indicator.util import build_composite_indicator_calculation
from data.query.mock import build_single_calculation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.calculations.simple_calculation import SumCalculation

MANDATORY_INDICATOR_FIELDS = set(['groupId', 'indicators'])


def build_calculation(indicator, field_to_calculation):
    ind_aggregation_type = indicator.get('data_element_type_info', {}).get(
        'aggregationType'
    )
    if not ind_aggregation_type:
        # Some dhis2 indicators have the value of the aggregation type defined as null
        # HACK(moriah) TODO(moriah): we are assuming that default is a SUM, we need to
        # support others.
        ind_aggregation_type = 'SUM'
    ind_type = indicator.get('type')
    ind_id = indicator['id']
    if ind_aggregation_type != 'SUM':
        LOG.info('Indicators type is not SUM: %s, %s', ind_type, indicator)
        return None
    if ind_aggregation_type == 'SUM' and ind_type != 'COMPOSITE':
        calculation = SumCalculation(dimension=FIELD_NAME, field=ind_id)
    elif ind_type == 'COMPOSITE':
        children = indicator['children']
        calculation = build_composite_indicator_calculation(
            ind_id,
            CalculationMerger([field_to_calculation[child] for child in children]),
            children,
        )
    # TODO(moriah): figure out what needs to be done to serialize AVERAGE and LAST_VALUE
    # calculations so that they are represented as JSONB approriately.
    field_to_calculation[ind_id] = calculation
    return related.to_dict(
        build_single_calculation(ind_id, calculation), dict_factory=dict
    )


def sort_indicators(indicators):
    # HACK(moriah): we need to build the non-composite indicator
    # calculations first so that when we build the composite calculations the
    # children actually have calculations. If we do this by sorting a groups indicator
    # then all of the composites indicators need to be in the same group.
    # This is true by default for dhis2 indicators but may change for other datasources
    composites, regular = [], []
    for indicator in indicators:
        if indicator.get('type') == 'COMPOSITE':
            composites.append(indicator)
        else:
            regular.append(indicator)
    return regular + composites


def build_fields_file(indicators, field_to_calculation, output_fields_file):
    fields_writer = DictWriter(
        output_fields_file, fieldnames=['id', 'name', 'calculation']
    )
    fields_writer.writeheader()
    for indicator in sort_indicators(indicators):
        indicator_id = indicator['id']
        calculation = build_calculation(indicator, field_to_calculation)
        # LOG.info(calculation)
        fields_writer.writerow(
            {'id': indicator_id, 'name': indicator['text'], 'calculation': calculation}
        )


def build_category_id_mapping_file(indicator_groups, output_category_id_mapping_file):
    # TODO(moriah): Figure out the concept of having linked categories for these
    # we probably need to create an unpublished fields table as well.
    # TODO(moriah): Check to make sure that category id is in the Category table.
    # bisect these to unpublished categories and published category id mappings.
    category_id_mapping_writer = DictWriter(
        output_category_id_mapping_file,
        fieldnames=['unpublished_field_id', 'category_id'],
    )
    category_id_mapping_writer.writeheader()
    for group in indicator_groups:
        category_id = 'aqt_generated_group__' + group['groupId']
        for indicator in group['indicators']:
            category_id_mapping_writer.writerow(
                {'unpublished_field_id': indicator['id'], 'category_id': category_id}
            )


def main():
    Flags.PARSER.add_argument(
        '--input_indicator_metadata_dir',
        type=str,
        required=True,
        help='The input file for indicator with metadata',
    )
    Flags.PARSER.add_argument(
        '--output_field_file',
        type=str,
        required=True,
        help='The output file for field metadata',
    )
    Flags.PARSER.add_argument(
        '--output_category_id_mapping_file',
        type=str,
        required=True,
        help='The output file that represents the category id mapping',
    )
    Flags.InitArgs()

    # We are going to be fetching files from probably mulitple datasources, we can merge
    # all of the indicators together for processing here.
    input_file_dir = Flags.ARGS.input_indicator_metadata_dir
    input_files = [
        join(input_file_dir, f)
        for f in listdir(input_file_dir)
        if isfile(join(input_file_dir, f)) and f.endswith('.json')
    ]
    indicator_groups = []
    for input_file_path in input_files:
        with open(input_file_path, 'rb') as input_file:
            LOG.info('Loading file: %s', input_file_path)
            json_groups = json.load(input_file)
            assert all(
                f in group for f in MANDATORY_INDICATOR_FIELDS for group in json_groups
            ), f'Incorrectly formatted indicator file: {input_file_path}'
            indicator_groups.extend(json_groups)

    with open(Flags.ARGS.output_field_file, 'w') as output_fields_file, open(
        Flags.ARGS.output_category_id_mapping_file, 'w'
    ) as output_category_id_mapping_file:
        indicators = []
        for group in indicator_groups:
            indicators.extend(group['indicators'])
        build_category_id_mapping_file(
            indicator_groups, output_category_id_mapping_file
        )
        field_to_calculation = {}
        build_fields_file(indicators, field_to_calculation, output_fields_file)


if __name__ == '__main__':
    sys.exit(main())
