#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import datetime
import json
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.date_periods import DHIS2Periods
from data.pipeline.dhis2.raw_data_generator import RawDataFetcher, RawDataBuilder
from data.pipeline.dhis2.util import load_module_by_filepath
from log import LOG


def main() -> int:
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--input_fields_filepath',
        type=str,
        required=True,
        help='Location of the fields json file, created in the fetch fields step',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Location of the output data',
    )
    Flags.PARSER.add_argument(
        '--shard_by_date_range',
        type=bool,
        required=False,
        default=False,
        help='Whether we should shard the results into files by date period or not',
    )
    Flags.PARSER.add_argument(
        '--months_back',
        type=int,
        required=False,
        default=0,
        help='Override how many months to fetch',
    )
    Flags.InitArgs()
    # A lot of integration specific information is stored in the api_config_filepath.
    # In order make this script more generalizable, we import this dynamically, since
    # it changes on an integration by integration basis.
    dhis2_api_module = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    # We have different querying requirements in terms of date ranges for most DHIS2
    # instances. Also, different dhis2 instances have support for different reporting
    # rates OR different frequencies of indicators with a certain reporting rate. The
    # most common reporting rate is monthly.
    dhis2_periods = dhis2_api_module.DHIS2_PERIODS

    months_to_fetch = Flags.ARGS.months_back
    if months_to_fetch > 0:
        dhis2_periods = DHIS2Periods(
            datetime.datetime.today() - datetime.timedelta(days=31 * months_to_fetch),
            datetime.datetime.today(),
        )

    # This file is created in the 00_fetch_fields step and is DHIS2 field ids organized
    # by reporting rate.
    with open(Flags.ARGS.input_fields_filepath) as f:
        data_elements_by_reporting_rate = json.load(f)
        # Since we are using the analytics/rawData endpoint, we don't need to specify the
        # indicators categoryOptionCombos (disaggregations). We only need the dataElement
        # id which is the first 11 characters of the id.
        data_elements_by_reporting_rate = {
            reporting_rate: {field_id[:11] for field_id in fields}
            for reporting_rate, fields in data_elements_by_reporting_rate.items()
        }
    output_file_pattern = Flags.ARGS.output_file_pattern
    LOG.info('Starting DHIS2 data fetch...')

    extra_data_fetcher_kwargs = {}
    if hasattr(dhis2_api_module, 'RETRY_MAX'):
        extra_data_fetcher_kwargs['retry_max'] = dhis2_api_module.RETRY_MAX
    if hasattr(dhis2_api_module, 'RETRY_DELAY_MS'):
        extra_data_fetcher_kwargs['retry_delay_ms'] = dhis2_api_module.RETRY_DELAY_MS
    data_fetcher = RawDataFetcher(
        dhis2_api_module.DHIS_OPTIONS, **extra_data_fetcher_kwargs
    )

    nation = [dhis2_api_module.NATION]

    if getattr(dhis2_api_module, 'BYPASS_SLEEP', False):
        sleep_start, sleep_duration = None, None
    else:
        sleep_start = getattr(dhis2_api_module, 'SLEEP_START', None)
        sleep_duration = getattr(dhis2_api_module, 'SLEEP_DURATION', None)

    for reporting_rate, fields in data_elements_by_reporting_rate.items():
        periods = dhis2_periods[reporting_rate]
        if len(periods) > 0:
            LOG.info('Starting to pull %s data', reporting_rate)
            dimension_builder = RawDataBuilder(
                list(fields),
                periods,
                nation,
                max_concurrent_requests=dhis2_api_module.MAX_CONCURRENT_REQUESTS,
                shard_dates_size=dhis2_api_module.SHARD_DATES_SIZE,
                shard_indicator_size=dhis2_api_module.SHARD_INDICATOR_SIZE,
                sleep_start=sleep_start,
                sleep_duration=sleep_duration,
            )
            dimension_builder.write_output_data(
                output_file_pattern,
                data_fetcher,
                shard_by_date_range=Flags.ARGS.shard_by_date_range,
            )
            LOG.info('Finished pulling %s data', reporting_rate)

    data_fetcher.assert_success()
    return 0


if __name__ == '__main__':
    sys.exit(main())
