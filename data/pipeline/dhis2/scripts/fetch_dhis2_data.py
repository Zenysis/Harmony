#!/usr/bin/env python
import datetime
import importlib
import json
import os
import sys

from collections import defaultdict
from pylib.base.flags import Flags

from data.pipeline.dhis2.date_periods import DHIS2Periods
from data.pipeline.dhis2.raw_data_generator import RawDataFetcher, RawDataBuilder
from data.pipeline.dhis2.util import (
    SUPPORTED_REPORTING_RATES,
    EXCLUDED_VALUE_TYPES,
    RESAMPLE_AGGREGATION_TYPES,
)
from log import LOG


def build_data_element_id_groups(
    indicator_groups,
    exclusion_list,
    override_inclusion,
    resample,
    reporting_rate_exclusion=tuple(),
    fetch_only=None,
    reporting_rate_override=None,
):
    # Since we are using the analytics/rawData endpoint we don't need to specify the indicators
    # categoryOptionCombos (disaggregations) we only need the dataElement id which is the
    # first 11 characters of the id.
    output = defaultdict(set)
    for group in indicator_groups:
        for indicator in group['indicators']:
            reporting_rate = indicator.get('reporting_rate')
            if reporting_rate not in reporting_rate_exclusion:
                if include_data_element(
                    indicator,
                    exclusion_list,
                    override_inclusion,
                    resample,
                    reporting_rate,
                    fetch_only=fetch_only,
                ):
                    indicator_id = indicator['dhis2_id'][:11]
                    if (
                        reporting_rate_override
                        and indicator_id in reporting_rate_override
                    ):
                        output[reporting_rate_override[indicator_id]].add(indicator_id)
                    else:
                        output[reporting_rate].add(indicator_id)

    for reporting_rate in list(output.keys()):
        LOG.info(
            f'Found {len(output[reporting_rate])} data element ids from {reporting_rate}'
        )
        if reporting_rate not in SUPPORTED_REPORTING_RATES:
            LOG.info(f'WARNING UNSUPPORTED REPORTING RATE \n {reporting_rate} \n ')
            output.pop(reporting_rate, None)
    return output


def include_data_element(
    indicator,
    exclusion_list,
    override_inclusion,
    resample,
    reporting_rate,
    fetch_only=None,
):
    indicator_data_element = indicator['dhis2_id'][:11]
    if fetch_only and not resample:
        return indicator_data_element in fetch_only
    if indicator_data_element in exclusion_list:
        return False
    if indicator_data_element in override_inclusion:
        return True
    if not reporting_rate:
        LOG.info(
            'Indicator reporting rate not found for: %s (%s)', indicator, reporting_rate
        )
        return False
    data_element_type_info = indicator.get('data_element_type_info', {})

    value_type = data_element_type_info.get('valueType')
    if not value_type or value_type in EXCLUDED_VALUE_TYPES:
        return False
    is_resample_indicator = (
        data_element_type_info.get('aggregationType') in RESAMPLE_AGGREGATION_TYPES
    )
    if fetch_only and resample:
        return (
            is_resample_indicator is resample and indicator_data_element in fetch_only
        )
    return is_resample_indicator is resample


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
        help='Location of the indicator json file, created in the fetch indicator step',
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
        '--resample',
        type=bool,
        required=False,
        default=False,
        help='Whether we are fetching the data that should be resampled or not.',
    )
    Flags.PARSER.add_argument(
        '--ignore_some',
        type=bool,
        required=False,
        default=False,
        help='Whether we are ignoring certian ids.',
    )
    Flags.PARSER.add_argument(
        '--months_back',
        type=int,
        required=False,
        default=0,
        help='Override how many months to fetch',
    )
    Flags.InitArgs()
    # A lot of integration specfifc information is stored in the api_config_filepath
    # in order make this script more generalizable we import this dynamically, since it
    # changes on an integration by integration basis
    api_config_filepath = Flags.ARGS.api_config_filepath
    module_name = os.path.basename(api_config_filepath).replace('-', '_')
    spec = importlib.util.spec_from_loader(
        module_name,
        importlib.machinery.SourceFileLoader(module_name, api_config_filepath),
    )
    dhis2_api_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dhis2_api_module)

    # We have different querying requirements in terms of date ranges
    # for most DHIS2 instances, also different dhis2 instances have
    # support for differen reporting rates. OR different frequencies of
    # indicators with a certain reporting rate. The most common reporting rate is monthly
    dhis2_periods = dhis2_api_module.DHIS2_PERIODS

    months_to_fetch = Flags.ARGS.months_back
    if months_to_fetch > 0:
        dhis2_periods = DHIS2Periods(
            datetime.datetime.today() - datetime.timedelta(days=31 * months_to_fetch),
            datetime.datetime.today(),
        )
    # This file is created in the 00_fetch_indicator_groups step and is dhis2 dataElements
    # in the format of our indicator group files.
    with open(Flags.ARGS.input_indicator_filepath) as f:
        indicator_groups = json.load(f)

    output_file_pattern = Flags.ARGS.output_file_pattern
    resample = Flags.ARGS.resample
    # Sometimes indicators are not queryable with any periods. This could be either because we don't
    # have permissions, OR the indicator value type is text or date or a similar non-aggregateable type.
    excluded_ids = dhis2_api_module.EXCLUSION_LIST
    if Flags.ARGS.ignore_some:
        excluded_ids.update(getattr(dhis2_api_module, 'MISC_TO_EXCLUDE', set()))

    if not resample:
        excluded_ids.update(dhis2_api_module.RESAMPLE_OVERRIDE)
    data_elements_by_reporting_rate = build_data_element_id_groups(
        indicator_groups,
        excluded_ids,
        dhis2_api_module.RESAMPLE_OVERRIDE,
        Flags.ARGS.resample,
        reporting_rate_exclusion=getattr(
            dhis2_api_module, 'REPORTING_RATE_EXCLUSION', []
        ),
        fetch_only=getattr(dhis2_api_module, 'FETCH_ONLY', []),
        reporting_rate_override=getattr(
            dhis2_api_module, 'REPORTING_RATE_OVERRIDE', {}
        ),
    )
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

    for reporting_rate in data_elements_by_reporting_rate:
        periods = dhis2_periods[reporting_rate]
        if len(periods) > 0:
            LOG.info('Starting to pull %s data', reporting_rate)
            indicators = list(data_elements_by_reporting_rate[reporting_rate])
            dimension_builder = RawDataBuilder(
                indicators,
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
