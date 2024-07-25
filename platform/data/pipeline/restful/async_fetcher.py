'''This module contains the Async RestfulFetcher class which is used to fetch data from a restful
 api'''

import asyncio
import contextlib
from typing import Optional, Tuple, Dict, Set
from urllib.parse import parse_qsl, urlparse

import httpx

from data.pipeline.restful.common import (
    update_last_updated_timestamps,
    DEFAULT_MAX_CONCURRENT_REQUESTS,
    DEFAULT_TIMEOUT,
)
from data.pipeline.restful.writer import ResponseStreamWriter
from log import LOG


class AsyncRestFulFetcher:
    '''This class is used to fetch data from a restful api asynchronously'''

    REQUESTS_LEFT = "(%s requests left)"

    requests: Set = set()

    def __init__(
        self,
        base_url: str,
        endpoint: str,
        credentials: Tuple[str, str],
        request_config: Optional[Dict] = None,
    ):
        self.base_url = base_url
        self.endpoint = endpoint
        self.retried_urls: Dict[str, int] = {}

        request_config = request_config or {}
        self.headers = request_config.get("headers", {})
        self.retry_num = request_config.get("retry_num", 3)
        self.retry_delay_ms = request_config.get("retry_delay_ms", 0)
        self.fail_immediately = request_config.get("fail_immediately", False)
        self.follow_redirects = request_config.get("follow_redirects", False)

        max_connections = request_config.get(
            "max_connections", DEFAULT_MAX_CONCURRENT_REQUESTS
        )
        max_keepalive_connections = request_config.get(
            "max_keepalive_connections", max_connections - 2
        )
        timeout = request_config.get("timeout", DEFAULT_TIMEOUT)
        self.client = httpx.AsyncClient(
            headers=self.headers,
            verify=False,
            auth=credentials,
            base_url=self.base_url,
            follow_redirects=self.follow_redirects,
            limits=httpx.Limits(
                max_connections=request_config.get(
                    "max_connections", DEFAULT_MAX_CONCURRENT_REQUESTS
                ),
                max_keepalive_connections=max_keepalive_connections,
            ),
            timeout=httpx.Timeout(timeout, read=3600),
        )

    def update_retries_for_url(self, url):
        '''Update the number of retries for a given url'''
        if url not in self.retried_urls:
            self.retried_urls[url] = 0
        self.retried_urls[url] += 1

    def can_retry_url(self, url):
        '''Check if a url can be retried'''
        return self.retried_urls.get(url, 0) < self.retry_num

    def update_requests(self, response: httpx.Response, request_key: str):
        '''We keep track of what requests are still pending using this methods'''
        if request_key:
            key = dict(parse_qsl(urlparse(str(response.request.url)).query)).get(
                request_key, ""
            )
            with contextlib.suppress(KeyError):
                self.requests.remove(key)

    async def _stream_can_be_read(self, response, request_key):
        '''Check if a stream can be read'''
        try:
            await response.aread()
            return True
        except httpx.StreamConsumed:
            # NOTE: This happens when there is a read timeout but part of the stream is
            # already consumed.
            self.update_requests(response, request_key)
            LOG.error(
                "Skipping retry for request %s (%s requests left)",
                response.request.url,
                len(self.requests),
            )
            await response.aclose()
            return False

    def _give_up(self, response, request_key, params, err):
        '''Give up on a request'''
        if not self.can_retry_url(response.request.url):
            self.update_requests(response, request_key)
            LOG.error(
                "Fully Failed to fetch url %s: Params provided: %s \n Error: "
                "%s (%s requests left)",
                response.request.url,
                params,
                response.content,
                len(self.requests),
            )
            # If the fail_immediately flag is set, raise the exception
            if self.fail_immediately:
                raise err
            return True
        return False

    async def fetch_and_write(
        self,
        filename,
        params: dict = None,
        last_updated_timestamps: Optional[Dict[str, str]] = None,
        request_key: str = "",
    ):
        '''Fetch from DHIS2 API and write data to a file'''
        async with self.client.stream("GET", self.endpoint, params=params) as response:
            try:
                response.raise_for_status()
                await ResponseStreamWriter.async_save_response(response, filename)
                self.update_requests(response, request_key)
                LOG.info(
                    "Successfully fetched %s and written (%s requests left)",
                    response.request.url,
                    len(self.requests),
                )
                if last_updated_timestamps is not None:
                    update_last_updated_timestamps(
                        response, last_updated_timestamps, request_key
                    )
            except (httpx.HTTPError, httpx.ConnectTimeout) as err:
                LOG.error(err)
                if not await self._stream_can_be_read(response, request_key):
                    return
                await response.aclose()
                if self._give_up(response, request_key, params, err):
                    return
                LOG.info(
                    "Retrying fetch for url %s: Params provided: %s",
                    response.request.url,
                    params,
                )
                self.update_retries_for_url(response.request.url)
                await asyncio.sleep(self.retry_delay_ms / 1000)
                return await self.fetch_and_write(
                    filename,
                    params=params,
                    last_updated_timestamps=last_updated_timestamps,
                    request_key=request_key,
                )
