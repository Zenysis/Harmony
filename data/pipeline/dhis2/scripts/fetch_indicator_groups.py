#!/usr/bin/env python
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.dataset_generator import DataSetGenerator
from data.pipeline.dhis2.indicator_group_builder import (
    BASE_LOCATION_RESOURCE_MAP,
    IndicatorGroupBuilder,
)
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
        '--output_file', type=str, required=True, help='output locations file path'
    )
    Flags.PARSER.add_argument(
        '--output_python_file', type=str, required=True, help='Output python file path'
    )
    Flags.PARSER.add_argument(
        '--reporting_rates_to_include',
        type=str,
        required=False,
        nargs='+',
        default=None,
        help='Reporting rates to include in the output JSON',
    )
    Flags.PARSER.add_argument(
        '--use_larger_reporting_rate',
        type=bool,
        required=False,
        default=True,
        help='If there are multiple reporting rate for one indicator use the more granular one',
    )
    Flags.PARSER.add_argument(
        '--prefix',
        type=str,
        required=False,
        default='',
        help='Prefix to use for fields ids, to prevent conflicts between DHIS2 sources',
    )
    Flags.InitArgs()

    LOG.info('Starting dataset generation...')
    dhis2_api_config = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    data_set_builder = DataSetGenerator(dhis2_api_config.DHIS_OPTIONS)
    resources = data_set_builder.get_resources(BASE_LOCATION_RESOURCE_MAP)

    included_reporting_rates = Flags.ARGS.reporting_rates_to_include
    LOG.info(f'Including Reporting Rates: {included_reporting_rates}')
    element_filter = None
    if included_reporting_rates is not None:
        included_reporting_rates = set(included_reporting_rates)
        element_filter = lambda x: x['reporting_rate'] in included_reporting_rates

    group_builder = IndicatorGroupBuilder(
        resources,
        use_larger_reporting_rate=Flags.ARGS.use_larger_reporting_rate,
        prefix=Flags.ARGS.prefix,
    )
    group_builder.write_indicator_groups(
        Flags.ARGS.output_file,
        Flags.ARGS.output_python_file,
        element_filter=element_filter,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
