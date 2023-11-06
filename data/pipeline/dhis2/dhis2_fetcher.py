import asyncio
from datetime import datetime
from typing import Any, Dict, Tuple, Set

from data.pipeline.dhis2.common import (
    DATA_VALUESETS_ENDPOINTS,
    EVENTS_ENDPOINTS,
    ENROLLMENTS_ENDPOINTS,
)
from data.pipeline.restful.async_fetcher import AsyncRestFulFetcher
from data.pipeline.restful.common import DATE_FORMAT
from log import LOG
from util.file.file_config import FilePattern


class AsyncDHIS2Fetcher(AsyncRestFulFetcher):
    '''This class is used to fetch data from DHIS2 asynchronously'''

    @classmethod
    def get_params(
        cls,
        request_key: str,
        group: str,
        org_unit: str,
        last_updated_duration: str,
    ) -> Dict[str, str]:
        '''Get params for the request'''
        params = {
            cls.get_request_param(request_key): group,
            "orgUnit": org_unit,
            "lastUpdatedDuration": last_updated_duration,
        }
        if request_key.startswith("program"):
            params["ouMode"] = "DESCENDANTS"
            # There is a known bug in some dhis2 versions around ignoring pagination. The workaround
            # is to set the pageSize to a very large number.
            # https://community.dhis2.org/t/neither-paging-nor-skippaging-filter-works-for-events-and-enrollments-api-2-38-2-1/51228/6
            params["pageSize"] = "10000000"
            if request_key == "program_enrollments":
                params["ou"] = org_unit
                del params["orgUnit"]
        if request_key in {
            "dataSet",
            "dataElementsGroup",
        }:
            params["children"] = "true"
        return params

    @staticmethod
    def get_endpoint(request_key: str) -> str:
        endpoints_map = {
            "dataSet": DATA_VALUESETS_ENDPOINTS,
            "dataElementsGroup": DATA_VALUESETS_ENDPOINTS,
            "program_events": EVENTS_ENDPOINTS,
            "program_enrollments": ENROLLMENTS_ENDPOINTS,
        }
        return endpoints_map[request_key]

    @staticmethod
    def get_request_param(request_key: str) -> str:
        return "program" if request_key.startswith("program") else request_key

    @staticmethod
    def gen_filename(request_key: str, group: str) -> str:
        '''Get filename for the request'''
        if request_key.startswith("program"):
            return f"{request_key.replace('program_', '')}.{group}"
        return group

    @classmethod
    async def fetch_data(
        cls,
        dhis2_api_module: Any,
        groups: Set[str],
        output_path_pattern: str,
        credentials: Tuple[str, str],
        start_dates: Dict[str, str],
        **kwargs,
    ):
        '''Fetch from dataValueSets endpoint asynchronously'''

        url = dhis2_api_module.DHIS_OPTIONS.url
        dhis2_instance_name = dhis2_api_module.DHIS_OPTIONS.instance_name

        # For integrations where the data start date is different from the start date of the
        # instance, use the data start date as the default start date.
        data_start_date = getattr(dhis2_api_module, "data_start_date", None)
        if data_start_date:
            default_start_date = data_start_date.strftime(DATE_FORMAT)
        else:
            default_start_date = dhis2_api_module.START_DATE.strftime(DATE_FORMAT)
        nation = dhis2_api_module.NATION

        # The response format is a file extension and it can be added to the endpoint.
        data_format = kwargs.pop("data_format", "csv")
        request_key = kwargs.pop("request_key", "dataSet")
        endpoint = f"{dhis2_instance_name}{cls.get_endpoint(request_key)}.{data_format.lower()}"
        fetcher = cls(url, endpoint, credentials, **kwargs)
        tasks = []
        end_date = datetime.now()
        for group in groups:
            start_date = datetime.strptime(
                start_dates.get(group, default_start_date), DATE_FORMAT
            )
            last_updated_duration = f"{(end_date - start_date).days}d"
            params = cls.get_params(
                request_key,
                group,
                nation,
                last_updated_duration,
            )
            LOG.info("Fetching URL: %s/%s with params: %s", url, endpoint, params)
            filename = FilePattern(output_path_pattern).build(
                cls.gen_filename(request_key, group)
            )
            tasks.append(
                fetcher.fetch_and_write(
                    filename,
                    params=params,
                    last_updated_timestamps=start_dates,
                    request_key=cls.get_request_param(request_key),
                )
            )
            fetcher.requests.add(group)
        return await asyncio.gather(*tasks)
