#!/usr/bin/env python
import json
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.raw_data_generator import (
    build_quarterly_list,
    build_dates_list,
    build_weekly_dates_list,
    build_yearly_dates_list,
    build_daily_dates_list,
    RawDataFetcher,
    RawDataBuilder,
)
from data.pipeline.dhis2.util import load_module_by_filepath

PATH = (
    'analytics.csv?'
    'dimension=dx:%s&'
    'dimension=pe:%s&'
    'dimension=ou:%s&'
    'ignoreLimit=true'
)


def main():
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Location of the output data',
    )
    Flags.PARSER.add_argument(
        '--input_datasets',
        type=str,
        required=True,
        help='Location of input datasets to fetch',
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

    datasets = json.load(open(Flags.ARGS.input_datasets, 'r'))

    start_year = dhis2_api_config.START_DATE.strftime("%Y")
    end_year = dhis2_api_config.END_DATE.strftime("%Y")

    start_date = dhis2_api_config.START_DATE.strftime(
        dhis2_api_config.DHIS_OPTIONS.date_format
    )
    end_date = dhis2_api_config.END_DATE.strftime(
        dhis2_api_config.DHIS_OPTIONS.date_format
    )

    quarterly_dates_list = build_quarterly_list(int(start_year), int(end_year))
    monthly_dates_list = build_dates_list(
        start_date, end_date, dhis2_api_config.DHIS_OPTIONS.date_format
    )
    weekly_dates_list = build_weekly_dates_list(int(start_year), int(end_year))
    yearly_dates_list = build_yearly_dates_list(int(start_year), int(end_year))
    six_monthly_list = [year + s for year in yearly_dates_list for s in ['S1', 'S2']]
    daily_dates_list = build_daily_dates_list(
        start_date, end_date, dhis2_api_config.DHIS_OPTIONS.date_format
    )

    date_field_lookup = {
        'Quarterly': quarterly_dates_list,
        'Monthly': monthly_dates_list,
        'Weekly': weekly_dates_list,
        'Yearly': yearly_dates_list,
        'SixMonthly': six_monthly_list,
        'Daily': daily_dates_list,
    }

    data_fetcher = RawDataFetcher(dhis2_api_config.DHIS_OPTIONS, path=PATH, retry_max=2)
    output_file_pattern = Flags.ARGS.output_file_pattern

    for dataset_group in datasets:
        group_id = dataset_group['groupId']
        if group_id in getattr(dhis2_api_config, 'EXCLUSION_LIST', []):
            continue
        output_file = output_file_pattern.replace('#', group_id)
        unit_ids = dataset_group.get('unit_ids', [])
        indicator_ids = [ind['dhis2_id'] for ind in dataset_group['indicators']]
        date_fields = date_field_lookup[dataset_group['reporting_rate']]
        dimension_builder = RawDataBuilder(
            indicator_ids,
            date_fields,
            unit_ids,
            max_concurrent_requests=getattr(
                dhis2_api_config, 'MAX_CONCURRENT_REQUESTS', 1
            ),
            shard_dates_size=10,
            shard_locations_size=10,
        )
        dimension_builder.write_output_data(output_file, data_fetcher)
    print('Finished building all output files')
    return 0


if __name__ == '__main__':
    sys.exit(main())
