#!/usr/bin/env python
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.calculated_indicator_group_builder import (
    BASE_CALCULATED_INDICATOR_RESOURCE_MAP,
    CalculatedIndicatorBuilder,
)
from data.pipeline.dhis2.dataset_generator import DataSetGenerator
from data.pipeline.dhis2.util import load_module_by_filepath
from log import LOG


def main():
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--input_indicator_filepath',
        type=str,
        required=True,
        help='Location of indicators file',
    )
    Flags.PARSER.add_argument(
        '--dhis2_indicators_variable',
        type=str,
        required=True,
        help='Variable name representing the dhis2 indicators.',
    )
    Flags.PARSER.add_argument(
        '--source',
        type=str,
        required=True,
        help='The pipeline data source.',
    )
    Flags.PARSER.add_argument(
        '--output_file',
        type=str,
        required=True,
        help='Location of the python file of' 'calculated indicators to be written',
    )
    Flags.PARSER.add_argument(
        '--json_output_file',
        type=str,
        required=False,
        default=None,
        help='Location of the json file of calculated indicators to be written',
    )
    Flags.PARSER.add_argument(
        '--allow_program_indicators',
        action='store_true',
        default=False,
        help='Whether to include calculated indicators that have constituents that are program '
        'indicators',
    )
    Flags.PARSER.add_argument(
        '--prefix',
        type=str,
        required=False,
        default='',
        help='Prefix to use for indicator IDs. Useful when you have conflicting DHIS2 sources',
    )
    Flags.InitArgs()
    LOG.info('Fetching resources!\n')
    dhis2_api_config = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )
    dataset_generator = DataSetGenerator(dhis2_api_config.DHIS_OPTIONS)
    dhis2_indicators_variable = Flags.ARGS.dhis2_indicators_variable
    dhis2_indicator_groups = getattr(
        load_module_by_filepath(
            Flags.ARGS.input_indicator_filepath, dhis2_indicators_variable
        ),
        dhis2_indicators_variable,
    )

    resources = dataset_generator.get_resources(BASE_CALCULATED_INDICATOR_RESOURCE_MAP)
    LOG.info(f'Starting processing...\n {resources}')
    dhis2_ids = [
        ind['dhis2_id']
        for group in dhis2_indicator_groups
        for ind in group['indicators']
    ]

    builder = CalculatedIndicatorBuilder(
        dhis2_ids,
        resources,
        source=Flags.ARGS.source,
        support_program_indicators=Flags.ARGS.allow_program_indicators,
        prefix=Flags.ARGS.prefix,
    )

    builder.write_output_indicators(Flags.ARGS.output_file, Flags.ARGS.json_output_file)
    builder.print_stats()
    return 0


if __name__ == '__main__':
    sys.exit(main())
