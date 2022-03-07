# NOTE(stephen): This data is somewhat experimental and its utility is still
# being determined. Right now the cardinality metadata is really useful for
# building optimal thetaSketch queries. I also don't quite like the way it is
# loaded but we are matching the pattern of other server preload stuff like
# dimension values.
from typing import Dict

from pydruid.utils.aggregators import (
    build_aggregators,
    filtered as filtered_aggregator,
    longmax,
    longmin,
    longsum,
)
from pydruid.utils.filters import Dimension as DimensionFilter

from config.druid_base import FIELD_NAME
from log import LOG
from web.server.data.dimension_metadata_util.compute_sketch_sizes import (
    compute_sketch_sizes,
)

# When enabled, metadata for each raw field ID in the druid datasource will be
# collected. This includes first/last event timestamp, the number of rows this field is
# present in, and the non-null dimensions that exist for the field.
ENABLE_FIELD_METADATA_QUERY = False


def create_field_metadata_query(datasource_name, dimensions, intervals):
    # NOTE(stephen): Sorting the dimensions so that the query hash is deterministic.
    aggregators = {
        dim: filtered_aggregator(DimensionFilter(dim) is not None, longsum('count'))
        for dim in sorted(dimensions)
    }
    aggregators['firstEvent'] = longmin('__time')
    aggregators['lastEvent'] = longmax('__time')
    aggregators['count'] = longsum('count')
    # TODO(stephen): Could possibly count the number of days data is reported for and
    # use that to estimate reporting rate. Then DQL wouldn't have to deduce it each
    # time.
    return {
        'aggregations': build_aggregators(aggregators),
        'dataSource': datasource_name,
        'dimensions': [FIELD_NAME],
        'granularity': 'all',
        'intervals': intervals,
        'queryType': 'groupBy',
    }


class DimensionMetadata:
    def __init__(self, query_client, datasource):
        self._query_client = query_client
        self._datasource = datasource
        self._sketch_sizes = {}
        self._grouped_dimension_sketch_sizes = {}
        self._field_metadata = {}

    def fetch_field_metadata(self, dimensions, interval):
        '''For each raw field ID in the database, determine which dimensions are
        supported for that field ID, how many data points it has, and when the first
        and last events were reported.
        '''
        LOG.debug('Fetching field metadata')
        query = create_field_metadata_query(self._datasource.name, dimensions, interval)
        result = self._query_client.run_raw_query(query)

        output = {}
        for row in result:
            event = row['event']
            field_id = event[FIELD_NAME]
            valid_dimensions = set(
                dimension for dimension in dimensions if event[dimension] > 0
            )
            output[field_id] = {
                'dimensions': valid_dimensions,
                'firstEvent': event['firstEvent'],
                'lastEvent': event['lastEvent'],
                'count': event['count'],
            }
        LOG.debug('Finished fetching field metadata')
        return output

    def load_dimension_metadata(self, dimension_categories, dimension_id_map, interval):
        queryable_dimensions = set(
            queryable_dimension
            for _, dimension_list in dimension_categories
            for queryable_dimension in dimension_list
        )

        LOG.info(
            'Fetching dimension metadata for %s dimensions', len(queryable_dimensions)
        )
        (
            self._sketch_sizes,
            self._grouped_dimension_sketch_sizes,
        ) = compute_sketch_sizes(
            self._query_client,
            self._datasource.name,
            [interval],
            sorted(queryable_dimensions),
            dimension_id_map,
        )

        if ENABLE_FIELD_METADATA_QUERY:
            self._field_metadata = self.fetch_field_metadata(
                queryable_dimensions, interval
            )
        LOG.info('Finished fetching dimension metadata')

    @property
    def sketch_sizes(self) -> Dict[str, int]:
        '''A mapping from dimension to sketch size that will guarantee that a sketch
        using that size will never become "approximate".
        '''
        return self._sketch_sizes

    @property
    def grouped_dimension_sketch_sizes(self) -> Dict[str, Dict[str, int]]:
        '''A mapping from a dimension that a user groups by to a sketch size mapping.
        This sketch size mapping contains the optimized sketch size to use only when the
        user groups by the specified dimension.
        '''
        return self._grouped_dimension_sketch_sizes

    @property
    def field_metadata(self):
        return self._field_metadata
