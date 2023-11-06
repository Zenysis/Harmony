#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import json
import sys
from datetime import datetime

from pylib.base.flags import Flags

from data.pipeline.dhis2.date_periods import DHIS2Periods
from data.pipeline.dhis2.raw_data_generator import RawDataBuilder, RawDataFetcher
from data.pipeline.dhis2.util import load_module_by_filepath
from log import LOG

PATH = (
    'analytics.csv?'
    'dimension=dx:%s&'
    'dimension=pe:%s&'
    'dimension=ou:%s&'
    'ignoreLimit=true'
)


def main() -> int:
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Location of the output data',
    )
    Flags.PARSER.add_argument(
        '--input_fields_filepath',
        type=str,
        required=True,
        help='Location of the reporting fields json file, created in the fetch fields step',
    )
    Flags.PARSER.add_argument(
        '--fetch_all_data',
        action='store_true',
        default=False,
        help='Whether to override the periods from the config and fetch all data',
    )
    Flags.InitArgs()

    # Load in the DHIS2 configs
    dhis2_api_config = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    LOG.info('Loading reporting fields to fetch')
    with open(Flags.ARGS.input_fields_filepath, 'r') as f:
        datasets = json.load(f)

    if Flags.ARGS.fetch_all_data:
        dhis2_periods = DHIS2Periods(dhis2_api_config.data_start_date, datetime.now())
    else:
        dhis2_periods = dhis2_api_config.DHIS2_PERIODS
    data_fetcher = RawDataFetcher(dhis2_api_config.DHIS_OPTIONS, path=PATH, retry_max=2)
    output_file_pattern = Flags.ARGS.output_file_pattern

    # If there's reporting specific settings, use those. Otherwise, use the standard rate
    # limiting config.
    max_concurrent_requests = getattr(
        dhis2_api_config,
        'MAX_CONCURRENT_REQUESTS_REPORTING',
        dhis2_api_config.MAX_CONCURRENT_REQUESTS,
    )
    shard_dates_size = getattr(
        dhis2_api_config,
        'SHARD_DATES_SIZE_REPORTING',
        dhis2_api_config.SHARD_DATES_SIZE,
    )

    # Indicators need to be queried along with organisation unit ids, reporting rates,
    # and dates. Since those are all specific to the datasets, the easiest appproach
    # is to create a RawDataBuilder for each dataset.
    for dataset in datasets:
        fields = dataset['fields']
        date_fields = dhis2_periods[dataset['reporting_rate']]
        unit_ids = dataset['unit_ids']
        dimension_builder = RawDataBuilder(
            fields,
            date_fields,
            unit_ids,
            max_concurrent_requests=max_concurrent_requests,
            shard_dates_size=shard_dates_size,
            shard_locations_size=getattr(dhis2_api_config, "SHARD_LOCATIONS_SIZE", 100),
            retry_empty_requests=getattr(
                dhis2_api_config, "RETRY_EMPTY_REQUESTS", False
            ),
        )
        output_file = output_file_pattern.replace('#', dataset['id'])
        dimension_builder.write_output_data(output_file, data_fetcher)
    LOG.info('Finished building all output files')
    return 0


if __name__ == '__main__':
    sys.exit(main())
