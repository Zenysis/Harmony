from builtins import object
from data.pipeline.datatypes.dimension_collector_io import add_prefix
from data.pipeline.datatypes.util import build_key_from_dimensions


class FullRowDimensionDataCollector(object):
    '''Class that collects canonical dimension values and metadata.

    Metadata should be ingested before canonical dimension values.
    Example usage:
        # Initialize collector
        collector = FullRowDimensionDataCollector(
            canonical_prefix, cleaned_prefix,
            hierarchical_dimensions=dimension_list)

        # Collect metadata from as many location sources as needed
        # In this case, row refers to a row in a mapping file
        for row in metadata_file:
            collector.collect_metadata(row)

        # Collect canonical dimensions
        metadata_collector.collect_hierarchical_canonical_dimensions(
            hierarchical_canonical_data_rows
        )
        metadata_collector.collect_non_hierarchical_canonical_dimensions(
            non_hierarchical_canonical_data_rows
        )

        # Get canonical data + metadata for a given row
        # In this case, row refers to data from the pipeline
        canonical_and_meta = collector.get_data_for_row(row_dimension_dict)
    '''

    # pylint: disable=R0902
    def __init__(
        self,
        canonical_prefix,
        cleaned_prefix,
        hierarchical_dimensions=None,
        non_hierarchical_dimensions=None,
    ):
        self.hierarchical_dimensions = hierarchical_dimensions or []
        self.non_hierarchical_dimensions = non_hierarchical_dimensions or []
        self.all_dimensions = (
            self.hierarchical_dimensions + self.non_hierarchical_dimensions
        )

        # Mapping from clean hierarchical dimension key to canonical hierarchical dimension names
        # pylint: disable=invalid-name
        self.hierarchical_clean_to_canonical_mapping = {}
        # Mapping from hierarchical canonical dimension key to hierarchical metadata values
        # pylint: disable=invalid-name
        self.hierarchical_canonical_to_metadata_mapping = {}
        # Mapping from non-hierarchical dimension name to dicts mapping clean to canonical
        # dimension values. See collect_non_hierarchical_canonical_dimensions for more info
        # pylint: disable=invalid-name
        self.non_hierarchical_clean_to_canonical_mapping = {
            dimension: {} for dimension in self.non_hierarchical_dimensions
        }

        self.dimension_name_to_canonical = {
            dimension_name: add_prefix(canonical_prefix, dimension_name)
            for dimension_name in self.all_dimensions
        }

        # Set containing dimension names used in an input row. eg CanonicalZone
        self.row_dimensions_set = set(self.dimension_name_to_canonical.values())

        self.cleaned_prefix = cleaned_prefix
        self.canonical_prefix = canonical_prefix

    # pylint: disable=invalid-name
    def extract_hierarchical_dimensions_from_data(self, row, prefix=''):
        '''Extract all hierarchical dimensions from the given row.
        '''
        return {
            dimension_name: row.get(add_prefix(prefix, dimension_name), '')
            for dimension_name in self.hierarchical_dimensions
        }

    def extract_dimensions_and_metadata(self, row, prefix=''):
        '''Split the dimensions and metadata for a given row into separate
        dicts.
        '''
        dimensions = self.extract_hierarchical_dimensions_from_data(row, prefix)
        metadata = dict(row)
        for key in dimensions.keys():
            key = add_prefix(prefix, key)
            if key in metadata:
                metadata.pop(key)

        return (dimensions, metadata)

    # pylint: disable=invalid-name
    def collect_hierarchical_canonical_dimensions(self, row, attach_meta=True):
        '''Builds a mapping from clean canonical key to canonical dimension
        values and pulls in previously ingested metadata.

        Note that metadata should be collected prior to running this.

        Args:
            attach_meta: boolean representing whether metadata should be
                attached. Set to False if no metadata was ingested.
        '''
        # Data stored are canonical values and metadata
        row_data = self.extract_hierarchical_dimensions_from_data(
            row, prefix=self.canonical_prefix
        )

        canonical_key = build_key_from_dimensions(
            row, self.hierarchical_dimensions, prefix=self.canonical_prefix
        )

        if attach_meta:
            # NOTE(toshi): using get here since match failures mean no metadata
            row_data.update(
                self.hierarchical_canonical_to_metadata_mapping.get(canonical_key, {})
            )

        cleaned_row = self.extract_hierarchical_dimensions_from_data(
            row, prefix=self.cleaned_prefix
        )
        self.store_data_for_row(cleaned_row, row_data)

    # pylint: disable=invalid-name
    def collect_non_hierarchical_canonical_dimensions(self, row):
        '''Builds a mapping for each dimension from clean non-hierarchical dimensions to canonical
        non-hierarchical dimensions.

            example entry in non_hierarchical_clean_to_canonical_mapping:
                {
                    'subrecipient': {
                        'Childline South Africa': 'Childline SA',
                    },
                }

            Args:
                row: row from the non-hierarchical mapping file, which has keys: 'dimension',
                cleaned_prefix, canonical_prefix.

        NOTE(sophie): unlike for hierarchical dimensions, metadata is not yet collected
        '''
        dimension = row['dimension']
        # Only non-hierarchical dimensions should be included in the dimension column
        dimension_map = self.non_hierarchical_clean_to_canonical_mapping[dimension]
        clean_dimension = row[self.cleaned_prefix]
        canonical_dimension = row[self.canonical_prefix]
        dimension_map[clean_dimension] = canonical_dimension

    def store_data_for_row(self, row, data):
        '''Stores data for a particular row.

        Args:
            row: dict mapping dimension name to value
        '''
        key = build_key_from_dimensions(row, self.hierarchical_dimensions)
        self.hierarchical_clean_to_canonical_mapping[key] = data

    def collect_metadata(self, input_row):
        '''
        Args:
            input_row: dictionary containing dimension and metadata

        TODO(sophie, all): add metadata collection for non-hierarchical dimensions
        '''
        (dimensions, metadata) = self.extract_dimensions_and_metadata(input_row)

        row_key = build_key_from_dimensions(dimensions, self.hierarchical_dimensions)
        if row_key not in self.hierarchical_canonical_to_metadata_mapping:
            self.hierarchical_canonical_to_metadata_mapping[row_key] = {}

        stored_data = self.hierarchical_canonical_to_metadata_mapping[row_key]
        for metadata_key, val in metadata.items():
            assert (
                metadata_key not in stored_data
            ), 'Attempting to overwrite data for %s for key %s' % (
                metadata_key,
                row_key,
            )
            stored_data[metadata_key] = val

    def get_data_for_row(self, row):
        '''Takes in row data with cleaned dimension values, and returns relevant
        canonical values and metadata.
        '''
        key = build_key_from_dimensions(row, self.hierarchical_dimensions)
        dimension_data = self.hierarchical_clean_to_canonical_mapping.get(key, {})
        if self.non_hierarchical_dimensions:
            # only copy dimension data if there are non-hierarchical dimensions
            dimension_data = dict(dimension_data)
            for dimension in self.non_hierarchical_dimensions:
                dimension_map = self.non_hierarchical_clean_to_canonical_mapping[
                    dimension
                ]
                if dimension in row:
                    dimension_data[dimension] = dimension_map.get(row[dimension], '')

        return dimension_data

    def canonical_row_has_metadata(self, row):
        '''Determine if the row provided has metadata stored for its canonical
        values.
        Args:
            row: dictionary mapping dimension names to canonical value.
        '''
        key = build_key_from_dimensions(row, self.hierarchical_dimensions)
        return bool(self.hierarchical_canonical_to_metadata_mapping.get(key))

    @property
    def clean_row_count(self):
        return len(self.hierarchical_clean_to_canonical_mapping)
