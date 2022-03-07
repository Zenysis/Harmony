# mypy: disallow_untyped_defs=True
from builtins import object
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional, cast
from typing_extensions import TypedDict

from pydruid.utils.filters import Dimension as DimensionFilter
from db.druid.query_client import DruidQueryClient_
from db.druid.util import DRUID_DATE_FORMAT, build_time_interval
from db.druid.datasource import DruidDatasource
from log import LOG

# The ISO8601 format to seconds precision for datetime.
ISO_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'


class TimeBoundaryQuery(TypedDict):
    queryType: str
    dataSource: str


class TimeBoundary(TypedDict):
    maxTime: str
    minTime: str


class TimeBoundaryQueryResult(TypedDict):
    timestamp: str
    result: TimeBoundary


# NOTE(camden): We return the boundary in different formats for the non-filtered and filtered
# versions. The only use of the filtered version is in the field_info api, which should be
# deprecated soon.
class DateTimeInterval(TypedDict):
    max: datetime
    min: datetime


def construct_time_boundary_query(datasource_name: str) -> TimeBoundaryQuery:
    return {'queryType': 'timeBoundary', 'dataSource': datasource_name}


def _datetime_from_iso(timestamp: str) -> datetime:
    timestamp = timestamp.split('.')[0]
    dt = datetime.strptime(timestamp, ISO_DATETIME_FORMAT)
    return dt


class DataTimeBoundary(object):
    def __init__(
        self,
        query_client: DruidQueryClient_,
        datasource: DruidDatasource,
    ):
        self.datasource = datasource
        self.query_client = query_client
        self.time_boundary: Optional[TimeBoundaryQueryResult] = None

        # Map from cache key to response.
        self.time_boundary_cache: Dict[str, DateTimeInterval] = {}

    def load_time_boundary_from_druid(self) -> None:
        """Set time_boundary to the event dict from the time boundary query"""
        LOG.info('Getting time boundary from Druid...')
        result = self.query_client.run_raw_query(
            construct_time_boundary_query(self.datasource.name)
        )
        assert len(result) == 1, 'Result of time boundary query unexpected: %s' % result

        self.time_boundary = result[0]
        LOG.info(
            'Done getting time boundary from Druid: %s', self.get_full_time_interval()
        )

    def get_filtered_time_boundary(
        self, query_filter: DimensionFilter = None, cache_key: str = None
    ) -> Optional[DateTimeInterval]:
        if cache_key not in self.time_boundary_cache:
            query = dict(construct_time_boundary_query(self.datasource.name))
            if query_filter:
                query['filter'] = query_filter.build_filter()

            result = self.query_client.run_raw_query(query)
            if len(result) != 1:
                # Bad result for time boundary.
                return None

            output: DateTimeInterval = {
                'min': _datetime_from_iso(result[0]['result']['minTime']),
                'max': _datetime_from_iso(result[0]['result']['maxTime']),
            }
            if not cache_key:
                return output
            self.time_boundary_cache[cache_key] = output
        return self.time_boundary_cache[cache_key]

    def get_min_data_date(self) -> str:
        """Return a string of format YYYY-MM-DD that was the minimum data date."""
        event = self.get_data_time_boundary()
        min_date = _datetime_from_iso(event['result']['minTime'])
        return min_date.strftime(DRUID_DATE_FORMAT)

    def get_max_data_date(self) -> str:
        """Return a string of format YYYY-MM-DD that was the maximum data date."""
        event = self.get_data_time_boundary()
        max_date = _datetime_from_iso(event['result']['maxTime'])
        return max_date.strftime(DRUID_DATE_FORMAT)

    def get_full_time_interval(self) -> str:
        """Return a string of druid date interval covering the whole range of data
        with [minTime.date, maxTime.date+1day) from the time_boundary query.
        """
        event = self.get_data_time_boundary()
        mintime = _datetime_from_iso(event['result']['minTime'])
        maxtime = _datetime_from_iso(event['result']['maxTime'])
        maxtime = maxtime + timedelta(days=1)
        return build_time_interval(mintime, maxtime)

    def get_data_time_boundary(self) -> TimeBoundaryQueryResult:
        """Return the stored TimeBoundary query result"""
        if self.time_boundary is None:
            self.load_time_boundary_from_druid()

        # NOTE(camden, david): We have now loaded the time boundary so it is
        # safe to do this cast.
        time_boundary = cast(TimeBoundaryQueryResult, self.time_boundary)
        return time_boundary

    # TODO(stephen, ian): Consolidate these scattered field metadata queries into a
    # single place.

    def get_field_time_boundary(
        self, field_id: str, field_filter: DimensionFilter
    ) -> Optional[DateTimeInterval]:
        '''Returns the min/max timestamp for the given field.'''
        cache_key = 'field__%s' % field_id
        return self.get_filtered_time_boundary(
            query_filter=field_filter, cache_key=cache_key
        )

    def get_dimension_time_boundary(
        self, dimension_name: str, dimension_value: str
    ) -> Optional[DateTimeInterval]:
        '''Returns the min/max timestamp for the given dimension's value.'''
        query_filter = DimensionFilter(dimension_name) == dimension_value
        cache_key = '%s__%s' % (dimension_name, dimension_value)
        return self.get_filtered_time_boundary(
            query_filter=query_filter, cache_key=cache_key
        )
