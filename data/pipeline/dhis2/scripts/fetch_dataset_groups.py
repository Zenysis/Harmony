#!/usr/bin/env python
import sys
from collections import defaultdict

from pylib.base.flags import Flags

from data.pipeline.dhis2.dataset_generator import DataSetGenerator
from data.pipeline.dhis2.indicator_group_builder import ReportingElementBuilder
from data.pipeline.dhis2.util import load_module_by_filepath


def segregate_ids_by_reporting_rate(groups, exclusion_list):
    output = defaultdict(list)
    for group in groups:
        if group['groupId'] not in exclusion_list:
            for indicator in group['indicators']:
                output[indicator['reporting_rate']].append(indicator['dhis2_id'])


def main():
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='output locations file path'
    )
    Flags.PARSER.add_argument(
        '--output_python_file', type=str, required=True, help='Output python file path'
    )
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.InitArgs()

    dhis2_api_config = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    builder = ReportingElementBuilder(DataSetGenerator(dhis2_api_config.DHIS_OPTIONS))
    builder.write_datasets(Flags.ARGS.output_file, Flags.ARGS.output_python_file)

    segregate_ids_by_reporting_rate(
        builder.datasets,
        exclusion_list=getattr(dhis2_api_config, 'EXCLUSION_LIST', set()),
    )

    print('Finished writing datasets')
    return 0


if __name__ == '__main__':
    sys.exit(main())
