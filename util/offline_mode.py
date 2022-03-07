from builtins import str, range, object
from typing import Dict, Any
from past.utils import old_div
from datetime import date, datetime, timedelta
import random
import string

from flask import current_app
from dateutil.relativedelta import relativedelta

from db.druid.datasource import SiteDruidDatasource
from db.druid.metadata import ISO_8601_FORMAT, AbstractDruidMetadata
from db.druid.query_client import DruidQueryRunner
from db.druid.util import unpack_time_interval

# This is a dictionary that caches randomized values to use for the dimension
# fields of different queries so that they all come from the same set of strings
DIMENSION_VALUES: Dict[Any, Any] = {}  # type: ignore

VOWELS = 'aeiou'
CONSONANTS = 'bcdfghjklmnpqrstvwxyz'

# This function returns an empty list. It is useful if the mock should return a
# function instead of a concrete result.


def list_return(*args, **kwargs):
    return []


def random_string_array(str_length, arr_length):
    arr = []
    for _ in range(arr_length):
        name_pieces = [random.choice(string.ascii_uppercase)]
        for _ in range(old_div((str_length - 1), 2)):
            name_pieces.append(random.choice(VOWELS))
            name_pieces.append(random.choice(CONSONANTS))
        arr.append(''.join(name_pieces))
    return arr


def random_coord_array(center, lrange, urange, count):
    coords = []
    for _ in range(count):
        coords.append(str(center + random.uniform(-1 * lrange, urange)))
    return coords


def granularity_increment(day, granularity):
    if granularity == 'day':
        day = day + timedelta(days=1)
    elif granularity == 'week':
        day = day + timedelta(weeks=7)
    if granularity == 'month':
        day = day + relativedelta(months=1)
    elif granularity == 'quarter':
        day = day + relativedelta(months=3)
    elif granularity == 'year':
        day = day + relativedelta(years=1)
    elif granularity == 'all':
        day = date.max
    else:
        day = day + relativedelta(months=1)
    return day


class MockGeoExplorerCache(object):
    def __init__(self):
        self.location_hierarchy = {}
        self.metrics = []
        self.properties = []


class MockDruidMetadata(AbstractDruidMetadata):
    def __init__(self, deployment_name, min_time_boundary=None, max_time_boundary=None):
        self.deployment_name = deployment_name
        self.all_datasources = [SiteDruidDatasource(self.deployment_name)]
        self.current_time = datetime.now()
        self.max_time_boundary = max_time_boundary or self.current_time
        self.min_time_boundary = min_time_boundary or (
            self.current_time - timedelta(days=3650)
        )
        super(MockDruidMetadata, self).__init__()

    # Return an unfiltered list of all druid datasources available

    def get_all_datasources(self):
        return self.all_datasources

    # Return the list of druid datasources available that match our standard
    # indexing naming pattern
    def get_site_datasources(self):
        return self.all_datasources

    # Return a list of druid datasource names available for a given site
    def get_datasources_for_site(self, site):
        return [ds.name for ds in self.get_site_datasources() if ds.site == site]

    # Return the most recent datasource for a given site
    def get_most_recent_datasource(self, site):
        return self.all_datasources[0]

    # Issue a druid datasource metadata query and return the metadata
    # druid has for the requested datasource.
    # http://druid.io/docs/latest/querying/datasourcemetadataquery.html
    def get_datasource_metadata(self, datasource_name):
        return [
            {
                "timestamp": self.current_time.strftime(ISO_8601_FORMAT),
                "result": {
                    "maxIngestedEventTime": self.current_time.strftime(ISO_8601_FORMAT)
                },
            }
        ]

    # Retrieve the current version of the given datasource.
    def get_datasource_version(self, datasource_name):
        return '{0}{1}{2}'.format(
            self.current_time.year, self.current_time.month, self.current_time.day
        )

    # Retrieve the percentage of segments that are queryable on the cluster for
    # the given datasource.
    def get_datasource_load_status(self, datasource_name):
        raise NotImplementedError()

    # Check if the given datasource is loaded on the cluster.
    def is_datasource_queryable(self, datasource_name):
        return True

    # Issue a druid timeBoundary metadata query and return the results.
    # Optionally pass the specified query_filter along with the request.
    # Converts the result to a datetime object, and returns a tuple of
    # (start, end) datetime objects.
    def get_datasource_timeboundary(self, datasource_name, query_filter=None):
        return (self.min_time_boundary, self.max_time_boundary)


class MockSqlAlchemy(object):
    # NOTE(stephen): This assumes the SQLAlchemy session object will only have
    # methods called on it and not have attributes accessed.
    # TODO(stephen): Provide (or find) a more robust mocking library for
    # SQLAlchemy.
    def __getattr__(self, attr):
        if attr == 'all':
            return list_return
        return self.self_return

    def self_return(self, *args, **kwargs):
        return self


class MockDruidQueryClient(DruidQueryRunner):
    def __init__(self, geo_to_lat_long_field, map_default_lat_long):
        self.geo_to_lat_long_field = geo_to_lat_long_field
        self.map_default_lat_long = map_default_lat_long

    def run_query(self, query):
        (begin, end) = unpack_time_interval(query.intervals[0])
        aggreg = list(query.aggregations.keys())
        dimen = query.dimensions
        gran = query.granularity
        lat_lng = [_f for _f in list(self.geo_to_lat_long_field.values()) if _f]
        lat_fields = [coord[0] for coord in lat_lng]
        lng_fields = [coord[1] for coord in lat_lng]
        post_aggreg = list(query.post_aggregations.keys())

        result = []
        count = 1 if not dimen else 10

        for i in range(count):
            day = begin
            # Generates a new set of regions and makes one result for each date
            result_dimen = {}
            for dim in dimen:
                if dim in DIMENSION_VALUES:
                    result_dimen[dim] = DIMENSION_VALUES[dim][i]
                elif dim in lat_fields:
                    DIMENSION_VALUES[dim] = random_coord_array(
                        self.map_default_lat_long[0], 5, 5, 10
                    )
                    result_dimen[dim] = DIMENSION_VALUES[dim][i]
                elif dim in lng_fields:
                    DIMENSION_VALUES[dim] = random_coord_array(
                        self.map_default_lat_long[1], 5, 5, 10
                    )
                    result_dimen[dim] = DIMENSION_VALUES[dim][i]
                else:
                    DIMENSION_VALUES[dim] = random_string_array(10, 10)
                    result_dimen[dim] = DIMENSION_VALUES[dim][i]

            while day < end:
                data = {
                    'timestamp': day.strftime('%Y-%m-%dT00:00:00.000Z'),
                    'version': 'v1',
                    'event': {'timestamp': day.strftime('%Y-%m-%dT00:00:00.000Z')},
                }

                for dim in dimen:
                    data['event'][dim] = result_dimen[dim]

                for a in aggreg:
                    data['event'][a] = random.uniform(1, 100)

                for pa in post_aggreg:
                    data['event'][pa] = random.uniform(1, 1000)

                result.append(data)
                day = granularity_increment(day, gran)

        query.optimize = False
        pydruid_query = query.prepare()
        pydruid_query.result = result
        return pydruid_query

    def run_raw_query(self, query):
        # Provide a valid query response for all Druid query types.
        # TODO(stephen): Provide a way for the common druid queries to be mocked out
        # and provide useful sample data.
        # TimeBoundary queries have a special response.
        if query.get('queryType') == 'timeBoundary':
            today = date.today().strftime('%Y-%m-%d')
            return [
                {
                    'timestamp': '2013-05-09T18:24:00.000Z',
                    'result': {
                        'minTime': '2010-01-01T00:00:00.000Z',
                        'maxTime': '%sT00:00:00.000Z' % today,
                    },
                }
            ]
        # Most query types understand an empty list to mean an empty query result.
        return []
