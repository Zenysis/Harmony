# NOTE: This data is somewhat experimental and its utility is still
# being determined. Right now the cardinality metadata is really useful for
# building optimal thetaSketch queries. I also don't quite like the way it is
# loaded but we are matching the pattern of other server preload stuff like
# dimension values.
from typing import Dict, Optional

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
from models.alchemy.query.model import DruidDatasource
from web.server.data.data_access import Transaction
from web.server.data.dimension_metadata_util.compute_sketch_sizes import (
    compute_sketch_sizes,
)

# When enabled, metadata for each raw field ID in the druid datasource will be
# collected. This includes first/last event timestamp, the number of rows this field is
# present in, and the non-null dimensions that exist for the field.
ENABLE_FIELD_METADATA_QUERY = False


def create_field_metadata_query(datasource_name, dimensions, intervals):
    # NOTE: Sorting the dimensions so that the query hash is deterministic.
    aggregators = {
        dim: filtered_aggregator(DimensionFilter(dim) is not None, longsum('count'))
        for dim in sorted(dimensions)
    }
    aggregators['firstEvent'] = longmin('__time')
    aggregators['lastEvent'] = longmax('__time')
    aggregators['count'] = longsum('count')
    # TODO: Could possibly count the number of days data is reported for and
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
    '''
    Represents metadata about dimensions.

    Attributes:
        sketch_sizes (Dict[str, int]): A mapping from dimension to sketch size that will guarantee
                                       that a sketch using that size will never become
                                       "approximate".
        grouped_dimension_sketch_sizes (Dict[str, Dict[str, int]]):
            A mapping from a dimension that a user groups by to a sketch size mapping.
            This sketch size mapping contains the optimized sketch size to use only when the
            user groups by the specified dimension.
        field_metadata: For each raw field ID in the database, determine which dimensions are
                        supported for that field ID, how many data points it has, and when the
                        first and last events were reported.
    '''

    sketch_sizes: Optional[Dict[str, int]] = None
    grouped_dimension_sketch_sizes: Optional[Dict[str, Dict[str, int]]]

    def __init__(self, query_client, datasource):
        self._query_client = query_client
        self._datasource = datasource
        self.field_metadata = None
        self._loaded = False

    def fetch_field_metadata(self, dimensions, interval):
        LOG.debug('Fetching field metadata')
        query = create_field_metadata_query(self._datasource.name, dimensions, interval)
        result = self._query_client.run_raw_query(query)

        output = {}
        for row in result:
            event = row['event']
            field_id = event[FIELD_NAME]
            valid_dimensions = {
                dimension for dimension in dimensions if event[dimension] > 0
            }
            output[field_id] = {
                'dimensions': valid_dimensions,
                'firstEvent': event['firstEvent'],
                'lastEvent': event['lastEvent'],
                'count': event['count'],
            }
        LOG.debug('Finished fetching field metadata')
        return output

    def load_dimension_metadata(self):
        if self._loaded:
            return

        with Transaction() as transaction:
            session = transaction.run_raw()
        db_datasource = (
            session.query(DruidDatasource)
            .filter(
                DruidDatasource.datasource == self._datasource.name,
            )
            .first()
        )
        if db_datasource is None:
            # TODO: add directions how to populate the db
            raise ValueError('Could not load dimension metadata from the db')
        for key, value in db_datasource.meta_data.items():
            setattr(self, key, value)
        self._loaded = True

    def populate_dimension_metadata(
        self,
        dimension_categories,
        dimension_id_map,
        interval,
        skip_grouped_sketch_sizes: bool,
    ):
        """
        Evaluates dimension metadata and populates DB with them for further (re)use.
        """
        queryable_dimensions = {
            queryable_dimension
            for _, dimension_list in dimension_categories
            for queryable_dimension in dimension_list
        }

        LOG.info(
            'Fetching dimension metadata for %s dimensions', len(queryable_dimensions)
        )
        meta_data = {}
        (
            self.sketch_sizes,
            self.grouped_dimension_sketch_sizes,
        ) = compute_sketch_sizes(
            self._query_client,
            self._datasource.name,
            [interval],
            sorted(queryable_dimensions),
            dimension_id_map,
            skip_grouped_sketch_sizes,
        )

        if ENABLE_FIELD_METADATA_QUERY:
            meta_data['field_metadata'] = self.fetch_field_metadata(
                queryable_dimensions, interval
            )
        self._loaded = True
        LOG.info('Finished fetching dimension metadata')
