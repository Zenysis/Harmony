# NOTE(stephen): This data is somewhat experimental and its utility is still
# being determined. Right now the cardinality metadata is really useful for
# building optimal thetaSketch queries. I also don't quite like the way it is
# loaded but we are matching the pattern of other server preload stuff like
# dimension values.
from log import LOG


def create_dimension_metadata_query(datasource_name, dimension, intervals):
    return {
        'dataSource': datasource_name,
        'aggregations': [
            {'type': 'thetaSketch', 'fieldName': dimension, 'name': dimension}
        ],
        'intervals': intervals,
        'granularity': 'all',
        'queryType': 'groupBy',
    }


class DimensionMetadata(object):
    def __init__(self, query_client, datasource):
        self._query_client = query_client
        self._datasource = datasource
        self._sketch_sizes = {}

    def fetch_dimension_metadata(self, dimensions, interval):
        # NOTE(stephen): Right now we only care about the cardinality of each
        # dimension.
        LOG.info('Fetching dimension metadata for %s dimensions', len(dimensions))
        output = {}
        for dimension in dimensions:
            query = create_dimension_metadata_query(
                self._datasource.name, dimension, [interval]
            )
            result = self._query_client.run_raw_query(query)
            sketch_size = 0
            if result:
                # The sketch size is represented as powers of 2. The sketch size
                # must be larger than the true column cardinality to ensure that
                # we produce an exact distinct count (otherwise we will produce
                # an approximate).
                # Use the number of bits it takes to represent the approximate
                # distinct count as a shorthand for computing the sketch size.
                bits = int(result[0]['event'][dimension]).bit_length()
                sketch_size = 2 ** bits
                output[dimension] = sketch_size
            LOG.debug('Sketch size %s for dimension %s', sketch_size, dimension)
        LOG.info('Finished fetching dimension metadata')
        return output

    def load_dimension_metadata(self, dimension_categories, dimension_id_map, interval):
        dimensions = set(dimension_id_map.values())
        for _, dimension_list in dimension_categories:
            for dimension in dimension_list:
                # If a dimension has a corresponding ID column in the DB, then
                # that column will be used during querying and we don't need to
                # provide a sketch size for the original dimension.
                if dimension not in dimension_id_map:
                    dimensions.add(dimension)
        self._sketch_sizes = self.fetch_dimension_metadata(dimensions, interval)

    @property
    def sketch_sizes(self):
        return self._sketch_sizes
