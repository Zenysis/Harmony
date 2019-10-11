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

        # Collect metadata from as many sources as needed
        for row in metadata_file:
            collector.collect_metadata(row)

        # Collect canonical dimensions
        metadata_collector.collect_canonical_dimensions(canonical_data_rows)

        # Get canonical data + metadata for a given row
        canonical_and_meta = collector.get_data_for_row(row_dimension_dict)
    '''

    # TODO(toshi): Implement for non-hierarchical dimensions

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

        # Mapping from clean dimension key to canonical dimension names
        self.clean_to_canonical_mapping = {}
        # Mapping from canonical dimension key to metadata values
        self.canonical_to_metadata_mapping = {}

        self.dimension_name_to_canonical = {
            dimension_name: add_prefix(canonical_prefix, dimension_name)
            for dimension_name in self.all_dimensions
        }

        # Set containing dimension names used in an input row. eg CanonicalZone
        self.row_dimensions_set = set(self.dimension_name_to_canonical.values())

        self.cleaned_prefix = cleaned_prefix
        self.canonical_prefix = canonical_prefix

    def extract_dimensions_from_data(self, row, prefix=''):
        '''Extract all hierarchical and non-hierarchical dimensions from the
        given row.
        '''
        return {
            dimension_name: row.get(add_prefix(prefix, dimension_name), '')
            for dimension_name in self.all_dimensions
        }

    def extract_dimensions_and_metadata(self, row, prefix=''):
        '''Split the dimensions and metadata for a given row into separate
        dicts.
        '''
        dimensions = self.extract_dimensions_from_data(row, prefix)
        metadata = dict(row)
        for key in dimensions.keys():
            key = add_prefix(prefix, key)
            if key in metadata:
                metadata.pop(key)

        return (dimensions, metadata)

    def collect_canonical_dimensions(self, row, attach_meta=True):
        '''Builds a mapping from clean canonical key to canonical dimension
        values and pulls in previously ingested metadata.

        Note that metadata should be collected prior to running this.

        Args:
            attach_meta: boolean representing whether metadata should be
                attached. Set to False if no metadata was ingested.
        '''
        # Data stored are canonical values and metadata
        row_data = self.extract_dimensions_from_data(row, prefix=self.canonical_prefix)

        canonical_key = build_key_from_dimensions(
            row, self.all_dimensions, prefix=self.canonical_prefix
        )

        if attach_meta:
            # NOTE(toshi): using get here since match failures mean no metadata
            row_data.update(self.canonical_to_metadata_mapping.get(canonical_key, {}))

        cleaned_row = self.extract_dimensions_from_data(row, prefix=self.cleaned_prefix)
        self.store_data_for_row(cleaned_row, row_data)

    def store_data_for_row(self, row, data):
        '''Stores data for a particular row.

        Args:
            row: dict mapping dimension name to value
        '''
        key = build_key_from_dimensions(row, self.all_dimensions)
        self.clean_to_canonical_mapping[key] = data

    def collect_metadata(self, input_row):
        '''
        Args:
            input_row: dictionary containing dimension and metadata
        '''
        (dimensions, metadata) = self.extract_dimensions_and_metadata(input_row)

        row_key = build_key_from_dimensions(dimensions, self.all_dimensions)
        if row_key not in self.canonical_to_metadata_mapping:
            self.canonical_to_metadata_mapping[row_key] = {}

        stored_data = self.canonical_to_metadata_mapping[row_key]
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
        key = build_key_from_dimensions(row, self.all_dimensions)
        return self.clean_to_canonical_mapping.get(key, {})

    def canonical_row_has_metadata(self, row):
        '''Determine if the row provided has metadata stored for its canonical
        values.
        Args:
            row: dictionary mapping dimension names to canonical value.
        '''
        key = build_key_from_dimensions(row, self.all_dimensions)
        return bool(self.canonical_to_metadata_mapping.get(key))

    @property
    def clean_row_count(self):
        return len(self.clean_to_canonical_mapping)
