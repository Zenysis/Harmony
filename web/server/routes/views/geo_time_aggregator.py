from builtins import object
import math
import os
from datetime import datetime
from collections import defaultdict
from multiprocessing.dummy import Pool as ThreadPool

from flask import request, current_app

from pydruid.utils.filters import Dimension

from config.system import STANDARD_DATA_DATE_FORMAT
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import build_time_interval, EmptyFilter
from log import LOG
from web.server.environment import IS_PRODUCTION
from web.server.routes.views.series_statistics import fill_stats
from web.server.util.util import Error, Success

USE_THREAD_POOL = False

# Set to true for demos that should not display sensitive health information.
USE_RANDOMIZED_DATA = False

# Geo field selection of 'nation' will be treated as a special case.
NATION_GEO_FIELD = 'nation'

DEFAULT_TIME_BUCKET = 'month'

DEFAULT_GRANULARITIES = ['month', 'all']


class GeoTimeAggregator(object):
    '''
    Aggregates by geography and time.
    '''

    def __init__(self, query_client, geo_field_ordering):
        self.geo_field = None
        self.denom = None
        self.location_filters = []
        self.non_hierarchical_filter = EmptyFilter()
        self.data_fields = set()
        self.calculated_fields = {}
        self.ordered_fields = []
        self.latitude_field = None
        self.longitude_field = None
        self.start_date = None
        self.end_date = None
        self.selected_granularities = DEFAULT_GRANULARITIES
        self.time_bucket = None

        self.request_data = None
        self.request_is_demo = False
        self.use_randomized_data = False

        self.calculation = None
        self.druid_slice_dimensions = []
        self.druid_geo_dimensions = []
        self.batches = None
        self.response = None
        self.query_client = query_client
        self.all_geo_dimensions = set(geo_field_ordering)

        # Initialize basic structure of result
        self.results = {
            # Aggregate stats.
            'overall': {
                'totals': defaultdict(int),
                'median': defaultdict(int),
                'first_quartile': defaultdict(int),
                'third_quartile': defaultdict(int),
                'mean': defaultdict(int),
                'std': defaultdict(int),
                'variance': defaultdict(int),
                'min': defaultdict(int),
                'max': defaultdict(int),
                'num_nonzero': defaultdict(int),
            },
            # Geo-level stats.
            'byGeo': {},
        }

    def get_response(self):
        return self.response

    def run(self, request_data=None):
        if request_data is None:
            self.request_data = request.get_json(force=True)
        else:
            self.request_data = request_data

        result = all(
            f()
            for f in [
                self.parse_arguments,
                self.run_query,
                self.process_batches,
                self.postprocess_results,
            ]
        )
        if not result and self.response is None:
            self.response = Error('Sorry, an unhandled error has occurred.')

    def parse_arguments(self):
        self.request_is_demo = self.request_data.get('demo')

        # Parse overall modifiers.
        self.use_randomized_data = USE_RANDOMIZED_DATA or self.request_is_demo

        # Location filters are default OR.
        # TODO(stephen, ian): When needed, allow more complex filtering
        filters = self.request_data.get('filters', [])
        for f in filters:
            if not len(list(f.keys())):
                # Skip empty filters.
                continue

            # HACK(stephen): Handle both hierarchical dimension filters (which
            # should be OR'd together) and non-hierarchical dimensions (which
            # should all be AND'd together) with the location filters
            first_key = list(f.keys())[0]
            if len(f) == 1 and first_key not in self.all_geo_dimensions:
                self.non_hierarchical_filter &= (
                    Dimension(first_key) == list(f.values())[0]
                )
                continue

            location_filter = {}
            # Validate that the dimensions being filtered on actually exist
            for key, value in list(f.items()):
                # NOTE(stephen): This should never happen
                if key not in self.all_geo_dimensions:
                    LOG.warn(
                        'A location filter contains non-location columns to '
                        'filter by. Filter: %s',
                        f,
                    )
                location_filter[key] = value
            if location_filter:
                self.location_filters.append(location_filter)

        geo_granularity = self.request_data.get('granularity')
        if geo_granularity != NATION_GEO_FIELD:
            latlng_fields = current_app.zen_config.aggregation.GEO_TO_LATLNG_FIELD.get(
                geo_granularity
            )
            if latlng_fields:
                self.latitude_field = latlng_fields[0]
                self.longitude_field = latlng_fields[1]
            self.geo_field = geo_granularity

        # Capture requested fields
        request_fields = self.request_data.get('fields', [])

        # Parse denominator
        denom = self.request_data.get('denominator')
        if denom:
            if denom in current_app.zen_config.indicators.VALID_FIELDS:
                self.denom = denom
                request_fields.append(denom)
            else:
                error_msg = 'Invalid denominator specified: %s' % denom
                self.response = Error(error_msg)
                return False

        # Deduplicate field list while maintaining the user's selected order
        # since the frontend has implicit requirements around field ordering
        for field in request_fields:
            self.data_fields.add(field)

            # TODO(stephen): Is this even necessary? Can the frontend send
            # duplicate fields? Also, would love an ordered set here instead
            # of searching the list.
            if field not in self.ordered_fields:
                self.ordered_fields.append(field)

        bad_fields = self.data_fields - current_app.zen_config.indicators.VALID_FIELDS
        if bad_fields:
            error_msg = 'Invalid fields specified: %s' % ', '.join(bad_fields)
            self.response = Error(error_msg)
            return False

        self.selected_granularities = self.request_data.get(
            'granularities', DEFAULT_GRANULARITIES
        )

        self.calculation = current_app.zen_config.aggregation_rules.get_calculation_for_fields(
            self.data_fields
        )
        self.calculation.set_strict_null_fields(self.data_fields)

        # Get dates
        # TODO(stephen, ian): Validate these
        self.start_date = datetime.strptime(
            self.request_data.get('start_date'), STANDARD_DATA_DATE_FORMAT
        ).date()
        self.end_date = datetime.strptime(
            self.request_data.get('end_date'), STANDARD_DATA_DATE_FORMAT
        ).date()
        self.time_bucket = self.request_data.get('time_bucket', DEFAULT_TIME_BUCKET)
        return True

    def run_query(self):
        '''
        Constructs and runs the Druid request for this query. The query is
        blocking.
        '''

        LOG.info('Running query...')

        # Filter the dimensions using the location filters passed in
        dimension_filter = GroupByQueryBuilder.build_dimension_filter(
            self.location_filters
        )

        # AND the selected locations with the non-location filters requested
        dimension_filter &= self.non_hierarchical_filter

        # Slice by selected granularity + all fields less specific than it. For
        # example, if user makes a Woreda query, we also want to slice by Zone
        # and Region.
        if self.geo_field:
            # Restrict query to non-null for the given geo
            dimension_filter &= Dimension(self.geo_field) != ''

            # Set the appropriate dimensions for this query
            self.druid_slice_dimensions = self.get_slice_dimensions()
            if self.latitude_field and self.longitude_field:
                self.druid_geo_dimensions = [self.latitude_field, self.longitude_field]

        grouping_fields = self.druid_slice_dimensions + self.druid_geo_dimensions

        batches = []
        overall_interval = build_time_interval(self.start_date, self.end_date)
        for selected_granularity in self.selected_granularities:
            granularity = selected_granularity
            intervals = [overall_interval]  # Druid expects time intervals as
            # a list
            granularity = current_app.zen_config.aggregation_rules.get_granularity_for_interval(
                selected_granularity, self.start_date, self.end_date
            )

            query = GroupByQueryBuilder(
                datasource=current_app.druid_context.current_datasource.name,
                granularity=granularity,
                grouping_fields=grouping_fields,
                intervals=intervals,
                calculation=self.calculation,
                dimension_filter=dimension_filter,
            )

            batch = QueryBatch(
                query,
                selected_granularity,
                self.geo_field,
                self.latitude_field,
                self.longitude_field,
                self.ordered_fields,
                self.denom,
                self.druid_slice_dimensions,
                self.query_client,
            )
            batches.append(batch)

        num_granularities = len(self.selected_granularities)
        if USE_THREAD_POOL and num_granularities > 1:
            pool = ThreadPool(num_granularities)
            pool.map(QueryBatch.run, batches)
            pool.close()
            pool.join()
        else:
            _ = [batch.run() for batch in batches]

        self.batches = batches
        return True

    def process_batches(self):
        '''
        Pack results from Druid into our format.
        '''

        LOG.info('Processing batches...')

        geo_results = self.results['byGeo']

        batch_warnings = []
        for batch in self.batches:
            for geo_key, geo_result in list(batch.result.items()):
                if geo_result.has_data():
                    if geo_key not in geo_results:
                        geo_results[geo_key] = GeoResult(geo_result.metadata)
                    geo_results[geo_key].data.update(geo_result.data)
                    batch_warnings.extend(geo_results[geo_key].warnings)

        if len(batch_warnings):
            LOG.warn('!! You overwrote existing data. Run in dev for detailed debug.')
            if not IS_PRODUCTION:
                # Only show these errors in dev. In production, these outputs
                # can overwhelm slow disks.
                print('\n'.join(batch_warnings))

        return True

    def postprocess_results(self):
        LOG.info('Postprocessing results...')
        self.fill_metadata_and_stats()

        # Tell the frontend which fields we are returning.
        if self.denom:
            self.results['fieldsToDisplay'] = [
                x for x in self.ordered_fields if x != self.denom
            ]
        else:
            self.results['fieldsToDisplay'] = self.ordered_fields

        # Final json response.
        self.response = Success(self.results)
        return True

    def fill_metadata_and_stats(self):
        '''
        Compute 'overall' metadata
        '''
        # We only want to compute metadata if the 'all' granularity was
        # selected.
        if 'all' not in self.selected_granularities:
            return

        # Done grabbing field data, now set up stats.
        field_to_values = defaultdict(list)
        for geo_result in list(self.results['byGeo'].values()):
            # The "all" granularity will contain the total values needed for
            # stats computation. The data series will only contain a single
            # date which all data will be rolled up into.
            # HACK(stephen): Work around bug where some geo results do not have
            # "all" data set.
            if 'all' not in geo_result.data:
                continue

            for field, value in list(list(geo_result.data['all'].values())[0].items()):
                # 1) Create map from field to list of values, used for stats
                # later.
                field_to_values[field].append(value)

        # Done with denominators, now compute statistics.
        fill_stats(self.results['overall'], field_to_values)

    def get_slice_dimensions(self):
        return current_app.zen_config.aggregation.DIMENSION_SLICES.get(
            self.geo_field, [self.geo_field]
        )


class QueryBatch(object):  # pylint: disable=too-few-public-methods
    def __init__(
        self,
        druid_query,
        granularity,
        geo_field,
        lat_field,
        lon_field,
        ordered_fields,
        denom,
        druid_slice_dimensions,
        query_client,
    ):
        self.druid_query = druid_query
        self.granularity = granularity
        self.geo_field = geo_field
        self.lat_field = lat_field
        self.lon_field = lon_field
        self.ordered_fields = ordered_fields
        self.denom = denom
        self.druid_slice_dimensions = druid_slice_dimensions
        self.query_client = query_client
        self.query_result = {}
        self.result = None

    def run(self):
        LOG.debug('Starting: %s', self.granularity)
        self.query_result = self.query_client.run_query(self.druid_query)

        LOG.debug('Query completed: %s', self.granularity)
        self.result = self._process_query_result()

        LOG.debug('Finished: %s', self.granularity)

    def _process_query_result(self):
        output = {}
        for row in self.query_result:
            # TODO(stephen): Handle optimized queries changing from groupby
            # to timeseries better (the results are stored in a different field)
            event = row.get('event', row.get('result'))
            geo_key = '__'.join(
                [event.get(d) or '' for d in self.druid_slice_dimensions]
            )
            if geo_key not in output:
                metadata = self._build_metadata_for_event(event)
                output[geo_key] = GeoResult(
                    metadata, self.granularity, self.ordered_fields, self.denom
                )
            output[geo_key].process_event(event, row['timestamp'])
        return output

    def _build_metadata_for_event(self, event):
        output = {
            # Special case for national level searches since this is not
            # stored as a dimension in the database
            'name': event[self.geo_field]
            if self.geo_field
            else current_app.zen_config.general.NATION_NAME,
            'lat': event.get(self.lat_field),
            'lng': event.get(self.lon_field),
        }

        for dim in self.druid_slice_dimensions:
            output[dim] = event[dim]

        return output


class GeoResult(dict):
    def __init__(self, metadata, granularity=None, data_fields=None, denom_field=None):
        super(GeoResult, self).__init__()
        self.metadata = metadata
        self.data = {}
        self.warnings = []

        if granularity:
            self.data[granularity] = defaultdict(lambda: defaultdict(float))
        self._granularity = granularity
        self._data_fields = data_fields
        self._denom_field = denom_field

    def process_event(self, event, timestamp):
        for field in self._data_fields:
            field_value = event[field]

            if self._should_skip_field(field, field_value):
                continue

            # Apply denominator if it exists
            if self._denom_field:
                denom_value = event.get(self._denom_field) or 0.0
                if denom_value == 0:
                    # TODO(ian, stephen): Should there be some time of warning
                    # displayed to the user?
                    field_value = 0
                else:
                    field_value /= denom_value
            cur_result = self.data[self._granularity][timestamp]
            if field in cur_result:
                self.warnings.append(
                    'You overwrote existing data for '
                    '%s, %s with event \'%s\' but it already has \'%s\'.'
                    % (self._granularity, field, event, cur_result)
                )
            # TODO(ian): Temporary hack on 11/3/2016 to hide the fact that we
            # don't aggregate correctly on data that isn't normalized or is
            # grouped by differeing latlng.
            if os.environ.get('ZEN_ENV').lower() is 'za':
                cur_result[field] += field_value
            else:
                cur_result[field] = field_value

    def has_data(self):
        for series in list(self.data.values()):
            if series:
                return True
        return False

    def _should_skip_field(self, field, value):
        # Don't store the denominator as a separate value in the results.
        if field is self._denom_field:
            return True

        # Sometimes null, NaN, Infinity, -Infinity can be returned for a
        # field's value from druid.
        if value is None or math.isnan(value) or math.isinf(value):
            return True

        return False

    @property
    def metadata(self):
        return self['metadata']

    @metadata.setter
    def metadata(self, data):
        self['metadata'] = data

    @property
    def data(self):
        return self['data']

    @data.setter
    def data(self, data):
        self['data'] = data
