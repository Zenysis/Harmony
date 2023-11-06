#!/usr/bin/env python
import csv
import json
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from functools import partial
from queue import SimpleQueue
from threading import Lock
import requests

# pylint: disable=import-error
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from requests.packages.urllib3.exceptions import InsecureRequestWarning

from data.pipeline.dhis2.options import DhisOptions
from log import LOG
from util.file.compression.lz4 import LZ4Writer
from util.file.file_config import FilePattern
from util.file.shard import ShardWriter
from util.thread.task_list import TaskList

# pylint: disable=no-member
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

PATH = (
    "analytics/rawData.csv?"
    "dimension=dx:%s&"
    "dimension=pe:%s&"
    "dimension=ou:%s&"
    "dimension=co:*&"
    "ignoreLimit=true"
)

# Tuple matching the format of `requests` timeout param.
DEFAULT_REQUEST_TIMEOUT = (
    # Connection timeout: the time it takes for the connection to be established.
    15,
    # Read timeout: the time it takes for the first byte to be received.
    75,
)


# TODO(moriah, sophie): Remove the build_*_dates_list() functions once MZ_COVID
# and ZM dhis2 pipeline steps have been refactored to use the general fetch_dhis2_data.py
# script
def build_dates_list(start_date_str, end_date_str, date_format):
    # Create a list of dates in dateformat starting at START_DATE until now.
    start_date = datetime.strptime(start_date_str, date_format)
    end_date = datetime.strptime(end_date_str, date_format)
    output = [start_date.strftime(date_format)]

    month_diff = (
        end_date.month - start_date.month + (end_date.year - start_date.year) * 12
    )
    year = start_date.year
    month = start_date.month
    for _ in range(1, month_diff + 1):
        month += 1
        if month > 12:
            year += 1
            month = 1
        output.append(datetime(year, month, 1).strftime(date_format))
    return output


def build_daily_dates_list(start_date_str, end_date_str, date_format):
    output = []
    start_date = datetime.strptime(start_date_str, date_format)
    end_date = datetime.strptime(end_date_str, date_format)
    delta = end_date - start_date

    for day in range(delta.days + 1):
        current_day = start_date + timedelta(day)
        output.append(current_day.strftime(date_format))
    return output


def build_weekly_dates_list(start_year, end_year):
    output = []
    for year in range(start_year, end_year + 1):
        output.extend(iter([f"{year}W{w}" for w in range(1, 53)]))
    return output


def build_quarterly_list(start_year, end_year):
    output = []
    for year in range(start_year, end_year + 1):
        output.extend(f"{year}{q}" for q in ("Q1", "Q2", "Q3", "Q4"))
    return output


def build_yearly_dates_list(start_year, end_year):
    return [str(year) for year in range(start_year, end_year + 1)]


@dataclass
class Response:
    header: str = ""
    data: list = field(default_factory=list)
    json: dict = field(default_factory=dict)
    content: str = ""
    error_msg: str = ""
    error_content: str = ""

    @property
    def success(self):
        return not self.error_msg and not self.error_content

    def log_retry_message(self, request_id, url):
        LOG.error(
            "%s\tRetrying request %s...\nURL: %s\n\t%s",
            self.error_msg,
            request_id,
            url,
            self.error_content,
        )

    def log_full_failure_message(self, request_id, url):
        LOG.error(
            "Request %s fully failed.\n%s\nURL: %s\n\t%s",
            request_id,
            self.error_msg,
            url,
            self.error_content,
        )


def execute_request(session, auth, url, timeout=DEFAULT_REQUEST_TIMEOUT):
    try:
        raw_response = session.get(url, verify=False, auth=auth, timeout=timeout)
    except requests.exceptions.ConnectTimeout:
        return Response(error_msg="Request timed out")
    except Exception as e:  # pylint: disable=broad-except
        return Response(error_msg="Unknown error occurred", error_content=str(e))

    # Quick check to see if we have been sent to the login page. This
    # happens occasionally and we can normally recover by logging in again.
    # NOTE(stephen): It might be useful to just switch the requests back
    # to passing auth every time the request is made. It is useful, though,
    # to know when DHIS2 acts up so I am inclined to leave it for now. No
    # noticeable performance hit was seen.
    if "Login-Page" in raw_response.headers or raw_response.url.endswith(
        "login.action"
    ):
        return Response(
            error_msg="Session was logged out.",
            error_content=f"Response URL: {raw_response.url}",
        )

    content = raw_response.content.decode()
    if raw_response.status_code != requests.codes.ok:
        return Response(
            error_msg=f"Failed to fetch resource.\nURL: {url}\n\tResponse: {content}"
        )

    return Response(content=content)


def execute_json_request(session, auth, url, timeout=DEFAULT_REQUEST_TIMEOUT):
    response = execute_request(session, auth, url, timeout=timeout)
    if response.success:
        content = response.content
        return Response(json=json.loads(content))
    return response


def execute_raw_request(session, auth, url, timeout=DEFAULT_REQUEST_TIMEOUT):
    """Fetch the requested URL and return a Response object."""
    response = execute_request(session, auth, url, timeout=timeout)
    if not response.success:
        return response

    content = response.content
    # The first row is a header and rest is the actual rows with data. The last row is
    # always an empty string.
    lines = content.split("\n")
    header = None
    data = []
    required_field_count = 0
    for i, line in enumerate(lines):
        field_count = line.count(",")
        if i == 0:
            header = line
            required_field_count = field_count
            continue

        # The last row is a blank line which we should skip. In theory there should not
        # be any other blank lines in the response, but if there are, we should filter
        # them as well.
        if not line:
            continue

        # Check to make sure the response was not corrupted. Sometimes we will received
        # a response with too few fields. If this happens, return an error and retry.
        if field_count != required_field_count:
            return Response(
                error_msg="Incorrect number of fields returned in line.",
                error_content=(
                    f"Expected: {required_field_count}\t"
                    f"Actual: {field_count}\n"
                    f"Line: {line}"
                ),
            )
        data.append(line)

    return Response(header=header, data=data)


def create_session(hostname, connection_attempts, cookies=None):
    """Create and return a requests.Session object that stores cookies and reuses
    connections.
    """
    LOG.info("Creating session")
    session = requests.Session()

    # Attempt to retry requests N times upon connection failure.
    retry = Retry(connect=connection_attempts, backoff_factor=2.0)
    adapter = HTTPAdapter(max_retries=retry)

    # Use the http adapter with retry capabilities for all urls that match
    # the hostname provided.
    session.mount(f"http://{hostname}", adapter)
    session.mount(f"https://{hostname}", adapter)

    if cookies:
        session.cookies.update(cookies)
    return session


# pylint: disable=too-many-instance-attributes
class RawDataFetcher:
    # Use this to query data from dhis2's analytics api for a given set of
    # dimensions, dates/periods, & locations
    def __init__(
        self,
        dhis_options: DhisOptions,
        path: str = PATH,
        connection_attempts: int = 2,
        delay_ms: int = 0,
        retry_delay_ms: int = 5000,
        retry_max: int = 20,
    ):
        self.hostpath = dhis_options.hostpath
        self.user_name = dhis_options.username
        self.password = dhis_options.password
        self.url_pattern = dhis_options.url_pattern
        self.path = path
        self.base_url = dhis_options.url_pattern % (dhis_options.hostpath, path)
        self.auth = (self.user_name, self.password)

        # Number of times to attempt to retry requests upon connection failure.
        self.connection_attempts = connection_attempts

        # Delay before each request
        self.delay_ms = delay_ms

        # Retry parameters
        self.retry_delay_ms = retry_delay_ms
        self.retry_max = retry_max

        self.base_session = create_session(self.hostpath, self.connection_attempts)
        self.session_queue = SimpleQueue()

        self.errors = []
        self.fail_immediately = dhis_options.fail_immediately

        # Ensure the provided credentials are correct.
        self.login()

    def login(self):
        # Login to DHIS2 with the provided credentials. The session will store
        # a cookie so we don't need to pass auth headers again.
        me_endpoint = self.url_pattern % (self.hostpath, "me")
        response = self.base_session.get(me_endpoint, verify=False, auth=self.auth)

        # If login was unsuccessful, alert as soon as possible.
        response.raise_for_status()

        # Detect if this DHIS2 instance supports HTTPS. If it does, ensure the
        # base URL uses https so we can avoid a redirect being issued with
        # every request.
        if not self.base_url.startswith("https") and response.url.startswith(
            "https://"
        ):
            self.base_url = self.base_url.replace("http://", "https://")

    def get_session(self):
        """Retrieve a free session from the queue. If none exists, create a new session
        for this task to use.
        """
        if self.session_queue.empty():
            return create_session(
                self.hostpath,
                self.connection_attempts,
                self.base_session.cookies.copy(),
            )
        return self.session_queue.get_nowait()

    def get_json_analytics_resource(
        self,
        dimensions: str,
        periods: list,
        locations: list,
        request_id: str,
        retry_num: int = 0,
    ):
        # Takes in a list of indicator ids, list of dates (months), and list of location ids
        # and queries the analyics api for their data.
        url = self.base_url % (
            ";".join(dimensions),
            ";".join(periods),
            ";".join(locations),
        )
        LOG.info("get_analytics_resource %s", url)
        session = self.get_session()
        if self.delay_ms:
            time.sleep(self.delay_ms / 1000.0)
        response = execute_json_request(session, self.auth, url)

        # Return the session so another thread can use it.
        self.session_queue.put_nowait(session)

        if not response.success:
            if retry_num < self.retry_max:
                response.log_retry_message(request_id, url)
                time.sleep(self.retry_delay_ms / 1000.0)
                return self.get_json_analytics_resource(
                    dimensions, periods, locations, request_id, retry_num=retry_num + 1
                )
            response.log_full_failure_message(request_id, url)
            err_msg = f"URL: {url}\n\t{response.error_content}"
            self.errors.append(err_msg)

            if self.fail_immediately:
                raise RuntimeError(f"DHIS query failed: {err_msg}")
            return None
        return response.json

    def get_analytics_resource(
        self,
        dimensions: str,
        periods: list,
        locations: list,
        request_id: str,
        retry_num: int = 0,
    ):
        # Takes in a list of indicator ids, list of dates (months), and list of location ids
        # and queries the analytics api for their data.
        url = self.base_url % (
            ";".join(dimensions),
            ";".join(periods),
            ";".join(locations),
        )
        LOG.info("get_analytics_resource %s", url)
        session = self.get_session()
        if self.delay_ms:
            time.sleep(self.delay_ms / 1000.0)
        response = execute_raw_request(session, self.auth, url)

        # Return the session so another thread can use it.
        self.session_queue.put_nowait(session)

        if not response.success:
            if retry_num < self.retry_max:
                response.log_retry_message(request_id, url)
                time.sleep(self.retry_delay_ms / 1000.0)
                return self.get_analytics_resource(
                    dimensions, periods, locations, request_id, retry_num=retry_num + 1
                )
            response.log_full_failure_message(request_id, url)
            err_msg = f"URL: {url}\n\t{response.error_content}"
            self.errors.append(err_msg)

            if self.fail_immediately:
                raise RuntimeError(f"DHIS query failed: {err_msg}")
            return [], []
        if not response.header or not response.data:
            LOG.info("Failed or empty response for: %s", url)
        return response.header, response.data

    def assert_success(self):
        if self.errors:
            LOG.error("\n".join(self.errors))
            raise RuntimeError("Not all data could be successfully fetched.")


def maybe_get_sharded_dimensions(dimensions, shard_size):
    dimension_shards = [dimensions]
    if shard_size:
        dimension_shards = [
            dimensions[i : i + shard_size]
            for i in range(0, len(dimensions), shard_size)
        ]
    return dimension_shards


class RawDataBuilder:
    # Takes in a start_date (str), list of indicator ids, & list of locations
    # creates a list of dates to query and splits the lists of locations and indicator ids into
    # chunks (lists of list) to query.
    # pylint: disable=too-many-instance-attributes,too-many-arguments
    def __init__(
        self,
        indicators,
        dates_list,
        parent_locations,
        max_concurrent_requests=1,
        shard_dates_size=None,
        shard_locations_size=None,
        shard_indicator_size=1,
        retry_empty_requests=False,
        analytics_resource_type="raw",
        sleep_start=None,
        sleep_duration=None,
    ):
        self.dates = maybe_get_sharded_dimensions(dates_list, shard_dates_size)
        self.locations = maybe_get_sharded_dimensions(
            parent_locations, shard_locations_size
        )
        self.parent_locations = parent_locations

        # Store indicator IDs as a set so that we can quickly perform lookups.
        self.indicators = maybe_get_sharded_dimensions(indicators, shard_indicator_size)
        self.max_concurrent_requests = max_concurrent_requests
        self._header_written = False
        self._lock = Lock()
        self._shard_dates = shard_dates_size
        self._shard_locations_size = shard_locations_size
        self.retry_empty_requests = retry_empty_requests
        self._empty_responses = []
        # A set of the urls that fully timed out with 504. After all retrys were sent
        self._fully_timed_out_fields = []
        self.analytics_resource_type = analytics_resource_type
        self.sleep_start = sleep_start
        self.sleep_duration = sleep_duration

    def maybe_sleep(self):
        if self.sleep_start:
            assert (
                self.sleep_duration
            ), "SLEEP DURATION must be set if SLEEP_START is not None"
            current_time = datetime.now()
            sleep_time = current_time.replace(
                hour=self.sleep_start, minute=0, second=0, microsecond=0
            )
            sleep_end = current_time.replace(
                hour=self.sleep_start + self.sleep_duration,
                minute=0,
                second=0,
                microsecond=0,
            )

            if sleep_end > current_time > sleep_time:
                sleep_hours = self.sleep_duration - current_time.hour + sleep_time.hour
                sleep_minutes = 60 - current_time.minute
                total_sleep_seconds = sleep_hours * 60 * 60 + sleep_minutes * 60
                LOG.info(
                    "Sleeping for %s hours and %s minutes until %s",
                    sleep_hours,
                    sleep_minutes,
                    sleep_end.strftime("%Y-%m-%d %H:%M:%S"),
                )
                time.sleep(total_sleep_seconds)
                LOG.info("Waking up now to continue data fetching.")

    def _choose_fetch_and_write(self):
        self.maybe_sleep()
        if self.analytics_resource_type == "json":
            return self._json_fetch_and_write
        return self._fetch_and_write

    def _fetch_and_write(
        self, output_file, data_fetcher, indicators, dates, locations, request_id
    ):
        LOG.info("Starting request %s", request_id)
        (res_header, data) = data_fetcher.get_analytics_resource(
            indicators, dates, locations, request_id
        )
        if not res_header or not data:
            LOG.info("Failed  request %s", request_id)
            self._empty_responses.append(
                (output_file, data_fetcher, indicators, dates, locations, request_id)
            )
        else:
            self._write_data(output_file, data, res_header)
            LOG.info("Finished request %s", request_id)

    def _json_fetch_and_write(
        self, output_file, data_fetcher, indicators, dates, locations, request_id
    ):
        LOG.info("Starting request %s", request_id)
        data = data_fetcher.get_json_analytics_resource(
            indicators, dates, locations, request_id
        )
        if not data:
            LOG.info("Failed  request %s", request_id)
            self._empty_responses.append(
                (output_file, data_fetcher, indicators, dates, locations, request_id)
            )
        else:
            self._write_json_data(output_file, data)
            LOG.info("Finished request %s", request_id)

    def _write_data(self, output_file, data, header):
        with self._lock:
            if not self._header_written:
                self._header_written = True
                output_file.write(header)
                output_file.write("\n")

            lines = "\n".join(data).strip()
            if lines:
                output_file.write(lines)
                output_file.write("\n")

    def _write_json_data(self, output_file, data):
        writer = csv.writer(output_file)
        with self._lock:
            if not self._header_written:
                self._header_written = True
                header = [h["column"] for h in data["headers"]]
                writer.writerow(header)
            writer.writerows(data["rows"])

    def maybe_reissue_empty_requests(self, task_list):
        if self.retry_empty_requests:
            LOG.info(
                "Issuing request for empty responses %s", len(self._empty_responses)
            )
            backup_tasks = []
            while self._empty_responses:
                (
                    output_file,
                    data_fetcher,
                    indicators,
                    dates,
                    locations,
                    request_id,
                ) = self._empty_responses.pop(0)
                task = partial(
                    self._choose_fetch_and_write(),
                    output_file,
                    data_fetcher,
                    indicators,
                    dates,
                    locations,
                    request_id,
                )
                backup_tasks.append(task)
            task_list.add_all(backup_tasks)
            task_list.run()
            task_list.wait()

    def write_output_data_single_file(self, output_filename, data_fetcher):
        # TODO(moriah): Delete this file once we are sure sharding is what we want to do.
        # Query the analytics api for every location for every indicator for all dates.
        # querying is done in chunks to avoid excess network use.
        asynchronous = self.max_concurrent_requests > 1
        with TaskList(
            asynchronous=asynchronous, max_workers=self.max_concurrent_requests
        ) as task_list, LZ4Writer(output_filename) as output_file:
            LOG.info("Beginning analytics data retrieval")
            LOG.info(
                "Number of requests to issue: %s",
                len(self.parent_locations) * len(self.indicators),
            )
            count = 0
            total_requests = (
                len(self.indicators) * len(self.dates) * len(self.locations)
            )

            tasks = []
            for indicator in self.indicators:
                for date_shard in self.dates:
                    for location_shard in self.locations:
                        count += 1
                        request_id = f"{count}/{total_requests}"
                        task = partial(
                            self._choose_fetch_and_write(),
                            output_file,
                            data_fetcher,
                            indicator,
                            date_shard,
                            location_shard,
                            request_id,
                        )
                        tasks.append(task)

            task_list.add_all(tasks)
            task_list.run()
            task_list.wait()
            self.maybe_reissue_empty_requests(task_list)

    def write_output_data_sharded(self, output_filepath, data_fetcher):
        # TODO(Moriah): Figure out if we need this basic sharding functionality instead
        # of the date sharded one.
        # Query the analytics api for every location for every indicator for all dates.
        # querying is done in chunks to avoid excess network use.
        output_file_pattern = FilePattern(output_filepath)
        asynchronous = self.max_concurrent_requests > 1
        with TaskList(
            asynchronous=asynchronous, max_workers=self.max_concurrent_requests
        ) as task_list, ShardWriter(
            output_file_pattern, 3000000, LZ4Writer
        ) as output_file:
            LOG.info("Beginning analytics data retrieval")
            LOG.info(
                "Number of requests to issue: %s",
                len(self.parent_locations) * len(self.indicators),
            )
            count = 0
            total_requests = (
                len(self.indicators) * len(self.dates) * len(self.locations)
            )

            tasks = []
            for indicator_shard in self.indicators:
                for date_shard in self.dates:
                    for location_shard in self.locations:
                        count += 1
                        request_id = f"{count}/{total_requests}"
                        task = partial(
                            self._choose_fetch_and_write(),
                            output_file,
                            data_fetcher,
                            indicator_shard,
                            date_shard,
                            location_shard,
                            request_id,
                        )
                        tasks.append(task)

            task_list.add_all(tasks)
            task_list.run()
            task_list.wait()
            self.maybe_reissue_empty_requests(task_list)

    def write_date_sharded_output_data(self, output_filepath, data_fetcher):
        # Query the analytics api for every date period, location and indicator.
        # querying is done in chunks to avoid excess network use.
        # This alternate method iterates over dates at the top level so that each
        # request is for a singular date period, this allows the file writing to be
        # sharded by dates so that we can easily separate data between historical and
        # recent.
        # output_file_pattern is fetched_data_#.csv.lz4 so that we can add date
        # information to the file name and shard the files by that date period.
        output_file_pattern = FilePattern(output_filepath)
        asynchronous = self.max_concurrent_requests > 1
        with TaskList(
            asynchronous=asynchronous, max_workers=self.max_concurrent_requests
        ) as task_list:
            LOG.info("Beginning analytics data retrieval")
            LOG.info(
                "Number of requests to issue: %s, %s",
                len(self.parent_locations) * len(self.indicators),
                len(self.indicators) * len(self.dates) * len(self.locations),
            )
            count = 0
            total_requests = (
                len(self.indicators) * len(self.dates) * len(self.locations)
            )

            for date_shard in self.dates:
                time_period = f"{date_shard[0]}-{date_shard[-1]}"
                LOG.info(time_period)
                with LZ4Writer(output_file_pattern.build(time_period)) as output_file:
                    tasks = []
                    self._header_written = False
                    for location_shard in self.locations:
                        for indicator_shard in self.indicators:
                            count += 1
                            request_id = f"{count}/{total_requests}"
                            task = partial(
                                self._choose_fetch_and_write(),
                                output_file,
                                data_fetcher,
                                indicator_shard,
                                date_shard,
                                location_shard,
                                request_id,
                            )
                            tasks.append(task)

                    task_list.add_all(tasks)
                    task_list.run()
                    task_list.wait()
                    # Reissue the tasks at the end of the date period while
                    # the file is open
                    self.maybe_reissue_empty_requests(task_list)

    def write_output_data(
        self, output_filename, data_fetcher, shard_by_date_range=False
    ):
        if shard_by_date_range:
            self.write_date_sharded_output_data(output_filename, data_fetcher)
        else:
            # TODO(moriah): replace this with the basic write_output_data_sharded once we
            # have processing working for shards.
            self.write_output_data_single_file(output_filename, data_fetcher)
