from builtins import object
from collections import OrderedDict
from log import LOG
from util.file.unicode_csv import UnicodeDictReader, UnicodeDictWriter


class HierarchicalDimensionMetadataGenerator(object):
    def __init__(self, dimension_list: list, dimension_id_map: dict):
        '''
        Args:
            dimension_list: list of tuples of (dimension_name, dimension_rows),
                increasing in granularity, ie from region to facility.

        '''
        self.metadata_map = {}
        self.dimension_map = {}
        self.dimension_to_metadata_map = {}
        self.dimension_list = dimension_list
        self.dimension_id_map = dimension_id_map
        self._closed = False

    def _build_dimension_key(self, dimensions: dict):
        return tuple(
            [dimensions.get(dimension, '') for dimension in self.dimension_list]
        )

    def _check_writable(self):
        assert (
            not self._closed
        ), 'Attempting to modify stored metadata after `finalize` has been called.'

    def finalize(self):
        '''Merge metadata from less granular dimensions to the higher granular
        dimensions that live within that hierarchy. Assign a dimension ID.

        Return:
            rows: List of merged metadata rows.

        Example:
            dimension_list: [A, B, C]
            metadata values (dimensions -> metadata):
                { A: 'hello', B: 'world' } -> { B_lat: 11.1, B_lon: 21.3 }
                { A: 'hello' } -> { A_lat: '10.1', A_lon: '20.2' }

            Finalizing will produce:
                { A: 'hello', B: 'world' } ->
                    { A_lat: '10.1', A_lon: '20.2', B_lat: 11.1, B_lon: 21.3 }
                { A: 'hello' } -> { A_lat: '10.1', A_lon: '20.2' }
            Dimension A's metadata is merged into the row because A is less
            granular than B.
        '''
        self._check_writable()
        self._closed = True

        # Store the keys found per level so that we can produce a stable output.
        # By storing the keys at each level, we can sort the keys and operate
        # on them in the same order. This produces a more pleasing output and
        # is stable across multiple runs (of the same script).
        keys_per_level = {dimension: [] for dimension in self.dimension_list}

        reversed_dimension_list = list(enumerate(self.dimension_list))
        reversed_dimension_list.reverse()
        for key in self.metadata_map.keys():
            # The key is a tuple. We can find what level the key represents by
            # searching from the end of the tuple to find the first non-empty
            # value. The first non-empty value (from the end) is the level.
            for i, dimension in reversed_dimension_list:
                if key[i]:
                    keys_per_level[dimension].append(key)
                    break

        output = OrderedDict()
        merged_metadata = {}
        dimension_id_counter = 1
        for i, dimension in enumerate(self.dimension_list):
            keys = sorted(keys_per_level[dimension])
            for key in keys:
                dimensions = self.dimension_map[key]
                parent_dimensions = dict(dimensions)
                parent_dimensions.pop(dimension)
                parent_key = self._build_dimension_key(parent_dimensions)

                metadata = {self.dimension_id_map[dimension]: dimension_id_counter}
                dimension_id_counter += 1
                metadata.update(merged_metadata.get(parent_key, {}))
                metadata.update(self.metadata_map[key])
                # Store the merged metadata separately from the full output row
                # (dimensions + metadata) so that we don't have to worry about
                # overwriting dimensions when merging in parent data.
                merged_metadata[key] = dict(metadata)

                metadata.update(dimensions)
                output[key] = metadata
        return list(output.values())

    def generate_header(self):
        dimension_ids = []
        metadata = []
        for dimension_name in self.dimension_list:
            dimension_ids.append(self.dimension_id_map[dimension_name])
            for metadata_name in self.dimension_to_metadata_map[dimension_name]:
                metadata.append(metadata_name)
        return self.dimension_list + dimension_ids + metadata

    def write_metadata(self, output_filename: str):
        '''Finalize the metadata rows and write them to the output csv.
        '''
        LOG.info('Starting metadata output.')
        rows = self.finalize()
        header = self.generate_header()
        with open(output_filename, 'w') as output_file:
            writer = UnicodeDictWriter(output_file, header)
            writer.writeheader()
            writer.writerows(rows)
        LOG.info('Finished writing metadata.')
        LOG.info('Output rows written: %s', len(rows))

    def store_metadata(
        self, dimensions: dict, metadata: dict, allow_overwrite: bool = False
    ):
        '''Store metadata for the provided canonical dimensions.

        Args:
            dimensions: A dictionary mapping dimension key to canonical value.
            metadata: A dictionary mapping metadata key to metadata value.
            allow_overwrite: If more than one row reports metadata for the same
                set of canonical dimensions, allow the latest row to overwrite
                metadata reported by the earlier row.
        '''
        self._check_writable()
        key = self._build_dimension_key(dimensions)
        self.dimension_map[key] = dimensions
        if key not in self.metadata_map:
            self.metadata_map[key] = dict(metadata)
            return

        # Detect when we will overwrite metadata that was already stored for
        # this dimension.
        stored_metadata = self.metadata_map[key]
        for metadata_column, value in metadata.items():
            if (
                not allow_overwrite
                and metadata_column in stored_metadata
                and stored_metadata[metadata_column] != value
            ):
                LOG.info(
                    'Refusing to add metadata for metadata '
                    'column: %s. Data already exists. Dimensions: %s\t'
                    'New value: %s\tStored value: %s',
                    metadata_column,
                    dimensions,
                    value,
                    stored_metadata[metadata_column],
                )
                continue
            stored_metadata[metadata_column] = value

    def update_metadata_columns(self, dimension_level, metadata_columns):
        '''Signal that the metadata columns provided will exist at the specified
        dimension level.
        '''
        if dimension_level not in self.dimension_to_metadata_map:
            self.dimension_to_metadata_map[dimension_level] = []

        # NOTE(stephen): Intentionally not using a set so that we can preserve
        # the order of columns as they are ingested.
        columns_for_level = self.dimension_to_metadata_map[dimension_level]
        for column in metadata_columns:
            if column not in columns_for_level:
                columns_for_level.append(column)

    def process_file(
        self,
        metadata_filename,
        dimension_level,
        canonical_collector=None,
        allow_overwrite=False,
        metadata_columns=None,
    ):
        '''Process a flat CSV with headers that are either dimensions or
        metadata columns.

        Args:
            dimension_level: The Hierarchical dimension that this file reports
                metadata for.
            canonical_collector: An optional instance of
                FullRowDimensionDataCollector that can map the dimensions found
                in the input row to the true canonical dimensions the metadata
                should be stored under. If not supplied, the row is assumed to
                already store canonical dimension values.
            allow_overwrite: If more than one row reports metadata for the same
                set of canonical dimensions, allow the latest row to overwrite
                metadata reported by the earlier row.
            metadata_columns: Optional. The columns in the metadata file that
                should be stored as metadata for the given dimensions. If not
                provided, all non-dimension columns will be stored as metadata.
        '''
        with open(metadata_filename) as metadata_file:
            reader = UnicodeDictReader(metadata_file)
            metadata_columns = (
                metadata_columns
                if metadata_columns
                else [
                    column
                    for column in reader.fieldnames
                    if column not in self.dimension_list
                ]
            )
            self.update_metadata_columns(dimension_level, metadata_columns)

            for row in reader:
                # Extract the dimensions from the row. If a canonical collector
                # was provided, use the collector to match the non-canonical
                # dimensions stored in the row to their canonical versions.
                # Otherwise, the dimensions stored should be canonical and we
                # can extract them directly.
                dimensions = None
                if canonical_collector:
                    dimensions = canonical_collector.get_data_for_row(row)
                else:
                    dimensions = {
                        dimension: row.get(dimension, '')
                        for dimension in self.dimension_list
                    }

                if not dimensions.get(dimension_level):
                    LOG.info(
                        'Refusing to add metadata for row. Canonical '
                        'value does not exist at required level. '
                        'Dimension level: %s\tDimensions: %s\t'
                        'Input row: %s',
                        dimension_level,
                        dimensions,
                        row,
                    )
                    continue

                metadata = {
                    metadata_column: row.get(metadata_column, '')
                    for metadata_column in metadata_columns
                }
                self.store_metadata(dimensions, metadata, allow_overwrite)
