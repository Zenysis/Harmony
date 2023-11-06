# mypy: disallow_untyped_defs=True
'''Module for generating data from DHIS2 API'''
import json
from typing import Dict, Tuple, Any, Optional

from data.pipeline.dhis2.dhis2_fetcher import AsyncDHIS2Fetcher
from data.pipeline.restful.common import (
    DEFAULT_MAX_CONCURRENT_REQUESTS,
    load_last_updated_timestamps,
    save_last_updated_timestamps,
    DEFAULT_TIMEOUT,
    ENCODING,
)


class DHIS2DataBuilder:
    '''Class for building data generated from DHIS2 API'''

    credentials: Tuple[str, str] = ("", "")

    # Error messages
    AT_LEAST_ONE_REQUIRED_ERROR = (
        "At least one of 'datasets_path' or 'data_element_groups_path' "
        "should be provided"
    )

    def __init__(
        self,
        dhis2_api_module: Any,  # This will be replaced by the config from the webserver.
        output_path_pattern: str,
        last_updated_path: str,
        request_key: str,
        datasets_path: str,
        resample_datasets_path: Optional[str] = None,
    ):
        self.dhis2_api_module = dhis2_api_module
        self.datasets_path = datasets_path
        self.resample_datasets_path = resample_datasets_path
        self.request_key = request_key
        self.output_path_pattern = output_path_pattern
        self.last_updated_path = last_updated_path
        self.build_credentials()
        self.groups = self.load_data_elements()

    @property
    def data_format(self) -> str:
        """Return the data format"""
        if self.output_path_pattern.endswith(("csv", "csv.lz4", "csv.gz")):
            return "csv"
        if self.output_path_pattern.endswith(("json", "json.lz4", "json.gz")):
            return "json"
        raise ValueError("Output path pattern must end with .csv* or .json*")

    def load_data_elements(self) -> Dict:
        """Build dict of data elements by group. The file is expected to have a structure like this:
        ```
        {"dataElementGroupID": ["dataElementID1", "dataElementID2", ...]} or
        {"datasetID": ["dataElementID1", "dataElementID2", ...]}
        ```
        """
        with open(self.datasets_path, encoding=ENCODING) as data_elements_json:
            data_elements = json.load(data_elements_json)
        if self.resample_datasets_path:
            with open(
                self.resample_datasets_path, encoding=ENCODING
            ) as resample_data_elements_json:
                resample_data_elements = json.load(resample_data_elements_json)
                data_elements.update(resample_data_elements)
        return data_elements

    def build_credentials(self) -> None:
        '''Build credentials tuple'''
        dhis2_options = self.dhis2_api_module.DHIS_OPTIONS
        self.credentials = dhis2_options.username, dhis2_options.password

    async def fetch_data_by_data_value_sets(self) -> None:
        '''Fetch data using the async_fetcher.py `fetch_data_value_sets` method'''
        concurrency = getattr(
            self.dhis2_api_module,
            "MAX_CONCURRENT_REQUESTS",
            DEFAULT_MAX_CONCURRENT_REQUESTS,
        )
        timeout = getattr(
            self.dhis2_api_module,
            "REQUEST_TIMEOUT",
            DEFAULT_TIMEOUT,
        )
        start_dates = load_last_updated_timestamps(self.last_updated_path)
        await AsyncDHIS2Fetcher.fetch_data(
            self.dhis2_api_module,
            set(self.groups.keys()),
            self.output_path_pattern,
            self.credentials,
            start_dates,
            request_config={
                'max_connections': concurrency,
                'timeout': timeout,
                'follow_redirects': True,
            },
            request_key=self.request_key,
            data_format=self.data_format,
        )
        save_last_updated_timestamps(self.last_updated_path, start_dates)
