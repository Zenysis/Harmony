import json
from datetime import datetime
from typing import List, Union

from data.pipeline.dhis2.raw_data_generator import RawDataBuilder, RawDataFetcher
from log import LOG

PATH = "analytics?dimension=dx:%s&dimension=pe:%s&dimension=ou:%s"


def get_months_back(start_date: datetime, end_date: datetime = datetime.now()) -> int:
    '''This function will calculate the number of months between two dates

    Args
    -----
    start_date: Start date
    end_date: End date
    '''
    return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)


def fetch_program_indicator_data(
    dhis2_api_module,
    json_file_path: str,
    output_file_pattern,
    shard_by_date_range: bool = False,
    assert_data_success: bool = True,
    parent_locations: Union[List[str], None] = None,
):
    '''This function will use previously fetched Program Indicator IDs to fetch data for those IDs

    Args
    -----
    dhis2_api_module: This is the module that contains the DHIS2 Configuration for the integration
    json_file_path: This is the path to the file with Program Indicator IDs
    output_file_pattern: Path to write data file to
    reporting_period: DHIS2 Reporting period for the program indicators.
    shard_by_date_range: Whether to write output to multiple files
    assert_data_success: Whether to fail this step if some data was not fetched.
    indicator_prefix: Prefix to filter indicators by
    parent_locations: List of parent locations to filter by
    '''
    periods = dhis2_api_module.DHIS2_PERIODS["Monthly"]
    parent_locations = parent_locations or [dhis2_api_module.NATION]
    max_concurrent_requests = dhis2_api_module.MAX_CONCURRENT_REQUESTS
    shard_dates_size = dhis2_api_module.SHARD_DATES_SIZE
    shard_indicator_size = dhis2_api_module.SHARD_INDICATOR_SIZE
    options = dhis2_api_module.DHIS_OPTIONS
    shard_locations_size = getattr(dhis2_api_module, 'SHARD_LOCATION_SIZE', 100)
    with open(json_file_path) as program_ids_file:
        indicators = []
        for _indicators in json.load(program_ids_file).values():
            indicators.extend(_indicators)
    retry_max = getattr(dhis2_api_module, 'RETRY_MAX', 0)

    LOG.info(
        'Fetching program indicator data for %s indicators and %s locations',
        len(indicators),
        len(parent_locations),
    )

    dimension_builder = RawDataBuilder(
        indicators,
        periods,
        parent_locations,
        max_concurrent_requests=max_concurrent_requests,
        shard_indicator_size=shard_indicator_size,
        shard_dates_size=shard_dates_size,
        shard_locations_size=shard_locations_size,
        analytics_resource_type='json',
    )

    data_fetcher = RawDataFetcher(options, retry_max=retry_max, path=PATH)
    dimension_builder.write_output_data(
        output_file_pattern, data_fetcher, shard_by_date_range=shard_by_date_range
    )

    if assert_data_success:
        data_fetcher.assert_success()
