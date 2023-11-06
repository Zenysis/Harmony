from datetime import datetime
from unittest.mock import patch, MagicMock

import pytest
from pytest_httpx import HTTPXMock

from data.pipeline.dhis2.dhis2_fetcher import AsyncDHIS2Fetcher
from data.pipeline.restful.tests.utils import clean_up_files_with_pattern

URL = "https://internal.zenysis.com"
TEST_FILE_PATTERN = "test.#.csv.lz4"
TEST_NATION = "test_nation"
DEFAULT_START_DATE = "2023-05-01"
TEST_INSTANCE_NAME = "test"
RESPONSE_WRITER_PATH = "data.pipeline.restful.async_fetcher.ResponseStreamWriter"


def create_dhis2_api_module():
    instance = MagicMock()
    instance.DHIS_OPTIONS.url = URL
    instance.DHIS_OPTIONS.instance_name = TEST_INSTANCE_NAME
    instance.START_DATE.strftime.return_value = DEFAULT_START_DATE
    instance.data_start_date.strftime.return_value = DEFAULT_START_DATE
    instance.NATION = TEST_NATION
    return instance


@pytest.mark.asyncio
async def test_fetch_data_value_set_dataset(httpx_mock: HTTPXMock):
    '''This test verifies that the fetch_data_value_set method calls the httpx api with the correct
    parameters.'''
    httpx_mock.add_response()
    with patch(f"{RESPONSE_WRITER_PATH}.async_save_response") as m_save_response, patch(
        "data.pipeline.dhis2.dhis2_fetcher.datetime"
    ) as m_date:
        m_date.now.return_value = datetime(2023, 5, 26)
        m_date.strptime = datetime.strptime
        await AsyncDHIS2Fetcher.fetch_data(
            create_dhis2_api_module(),
            {"group1", "group2"},
            TEST_FILE_PATTERN,
            ("", ""),
            {},
        )
        clean_up_files_with_pattern(TEST_FILE_PATTERN, ["group1", "group2"])
        m_save_response.call_count = 2
    requests = httpx_mock.get_requests()
    expected_requests = [
        'https://internal.zenysis.com/test/api/dataValueSets.csv?dataSet=group1'
        '&orgUnit=test_nation&lastUpdatedDuration=25d&children=true',
        'https://internal.zenysis.com/test/api/dataValueSets.csv?dataSet=group2'
        '&orgUnit=test_nation&lastUpdatedDuration=25d&children=true',
    ]

    assert sorted(expected_requests) == sorted(
        [str(request.url) for request in requests]
    )


@pytest.mark.asyncio
async def test_fetch_data_value_set_data_element_group(httpx_mock: HTTPXMock):
    '''This test verifies that the fetch_data_value_set method calls the httpx api with the correct
    parameters and respects the request_key parameter.'''
    httpx_mock.add_response()
    with patch(f"{RESPONSE_WRITER_PATH}.async_save_response") as m_save_response, patch(
        "data.pipeline.dhis2.dhis2_fetcher.datetime"
    ) as m_date:
        m_date.now.return_value = datetime(2023, 5, 26)
        m_date.strptime = datetime.strptime
        await AsyncDHIS2Fetcher.fetch_data(
            create_dhis2_api_module(),
            {"group1", "group2"},
            TEST_FILE_PATTERN,
            ("", ""),
            {},
            request_key="dataElementsGroup",
        )
        clean_up_files_with_pattern(TEST_FILE_PATTERN, ["group1", "group2"])
        m_save_response.call_count = 2
    requests = httpx_mock.get_requests()
    expected_requests = [
        'https://internal.zenysis.com/test/api/dataValueSets.csv?'
        'dataElementsGroup=group1&orgUnit=test_nation&lastUpdatedDuration=25d'
        '&children=true',
        'https://internal.zenysis.com/test/api/dataValueSets.csv?'
        'dataElementsGroup=group2&orgUnit=test_nation&lastUpdatedDuration=25d'
        '&children=true',
    ]

    assert sorted(expected_requests) == sorted(
        [str(request.url) for request in requests]
    )
