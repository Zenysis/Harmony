from builtins import object
from collections import defaultdict
from datetime import datetime, timedelta

from pydruid.utils.filters import Dimension as DimensionFilter

from db.druid.util import DRUID_DATE_FORMAT, build_time_interval
from log import LOG

# The ISO8601 format to seconds precision for datetime.
ISO_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'


def construct_time_boundary_query(datasource):
    return {'queryType': 'timeBoundary', 'dataSource': datasource}


def _datetime_from_iso(timestamp):
    """Return a datetime object from a ISO8601 timestamp
    """
    timestamp = timestamp.split('.')[0]
    dt = datetime.strptime(timestamp, ISO_DATETIME_FORMAT)
    return dt


class DataTimeBoundary(object):
    def __init__(self, query_client, datasource):
        self.datasource = datasource
        self.query_client = query_client
        self.time_boundary = {}

        # Map from cache key to response.
        self.time_boundary_cache = defaultdict(dict)

    def load_time_boundary_from_druid(self):
        """Set time_boundary to the event dict from the time boundary query
        {'timestamp': , 'result': {'maxtime':, 'minTime': }}.
        """
        LOG.info('Getting time boundary from Druid...')
        result = self.query_client.run_raw_query(
            construct_time_boundary_query(self.datasource.name)
        )
        assert len(result) == 1, 'Result of time boundary query unexpected: %s' % result

        self.time_boundary = result[0]
        LOG.info(
            'Done getting time boundary from Druid: %s', self.get_full_time_interval()
        )

    def get_filtered_time_boundary(self, query_filter=None, cache_key=None):
        if cache_key not in self.time_boundary_cache:
            query = dict(construct_time_boundary_query(self.datasource.name))
            if query_filter:
                query['filter'] = query_filter.build_filter()

            result = self.query_client.run_raw_query(query)
            if len(result) != 1:
                # Bad result for time boundary.
                return None

            output = {
                'min': _datetime_from_iso(result[0]['result']['minTime']),
                'max': _datetime_from_iso(result[0]['result']['maxTime']),
            }
            if not cache_key:
                return output
            self.time_boundary_cache[cache_key] = output
        return self.time_boundary_cache[cache_key]

    def get_min_data_date(self):
        """Return a string of format YYYY-MM-DD that was the minimum data date.
        """
        event = self.get_data_time_boundary()
        min_date = _datetime_from_iso(event['result']['minTime'])
        return min_date.strftime(DRUID_DATE_FORMAT)

    def get_max_data_date(self):
        """Return a string of format YYYY-MM-DD that was the maximum data date.
        """
        event = self.get_data_time_boundary()
        max_date = _datetime_from_iso(event['result']['maxTime'])
        return max_date.strftime(DRUID_DATE_FORMAT)

    def get_full_time_interval(self):
        """Return a string of druid date interval covering the whole range of data
        with [minTime.date, maxTime.date+1day) from the time_boundary query.
        """
        event = self.get_data_time_boundary()
        mintime = _datetime_from_iso(event['result']['minTime'])
        maxtime = _datetime_from_iso(event['result']['maxTime'])
        maxtime = maxtime + timedelta(days=1)
        return build_time_interval(mintime, maxtime)

    def get_data_time_boundary(self):
        """Return the stored TimeBoundary query result
        {'timestamp': , 'result':{'maxTime': , 'minTime': }}.
        """
        boundary = self.time_boundary

        if not boundary.get('result'):
            self.load_time_boundary_from_druid()

        return boundary

    # TODO(stephen, ian): Consolidate these scattered field metadata queries into a
    # single place.

    def get_field_time_boundary(self, field_id, field_filter):
        '''Returns the min/max timestamp for the given field.'''
        cache_key = 'field__%s' % field_id
        return self.get_filtered_time_boundary(
            query_filter=field_filter, cache_key=cache_key
        )

    def get_dimension_time_boundary(self, dimension_name, dimension_value):
        '''Returns the min/max timestamp for the given dimension's value.'''
        query_filter = DimensionFilter(dimension_name) == dimension_value
        cache_key = '%s__%s' % (dimension_name, dimension_value)
        return self.get_filtered_time_boundary(
            query_filter=query_filter, cache_key=cache_key
        )

    def get_time_boundary(self):
        return self.time_boundary
