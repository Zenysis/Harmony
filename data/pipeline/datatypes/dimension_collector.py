from builtins import object
import csv
from collections import defaultdict

from data.pipeline.datatypes.util import build_key_from_dimensions


def filter_dimensions(row_data, key_list):
    return {dimension_name: row_data[dimension_name] for dimension_name in key_list}


class DimensionCollector(object):
    '''Class that collects dimensions of a base row and performs some basic
    functionality such as collecting it, reading, writing, and filling in
    canonical names.

    We will differentiate between hierarchical and non-hierarchical dimensions.
    '''

    HIERARCHICAL_DIMENSIONS = []
    NON_HIERARCHICAL_DIMENSIONS = []

    def __init__(
        self,
        hierarchical_transform_fn,
        non_hierarchical_transform_fn,
        dimension_name_to_row_mapping=None,
    ):
        '''
        Args:
            dimension_to_entry_mapping: dict mapping dimension_name to name in
                data source. If not in mapping, we assume the name is the same
                as dimension_name.

        For any other custom dimensions that may require special treatment, they
        should be added here. ie. Sex Workers
        '''
        self.validate_dimensions()

        self.all_dimensions = (
            self.HIERARCHICAL_DIMENSIONS + self.NON_HIERARCHICAL_DIMENSIONS
        )

        # Transformational functions
        self.hierarchical_transform_fn = hierarchical_transform_fn
        self.non_hierarchical_transform_fn = non_hierarchical_transform_fn
        self.dimension_name_to_row_mapping = dimension_name_to_row_mapping or {}

        self.reset_fields()

    def reset_fields(self):
        '''Reset internal fields to a fresh state.
        '''
        # Mapping from unique row key to input and output dimensions values. ie:
        # key: {
        #   'input': {
        #     dimension_name: input_dimension_val
        #   }
        # }
        self.transformed_values = {}

        # Dict to keep track of unique hierarchical combinations. Maps
        # hierarchical key to unique row key in self.transformed_values
        self.hierarchical_combinations = {}

        # Dict mapping dimension name to a dictionary of the form
        # {input_val: output_val}
        self.non_hierarchical_items = defaultdict(dict)

    def validate_dimensions(self):
        '''Assert that there is no overlap between hierarchical and non-
        hierarchical dimensions.
        '''
        hierarchical_dimension_set = set(self.HIERARCHICAL_DIMENSIONS)
        for dimension_name in self.NON_HIERARCHICAL_DIMENSIONS:
            assert dimension_name not in hierarchical_dimension_set, (
                'dimension: %s appears in both hierarchical and non-'
                'hierarchical dimension lists' % dimension_name
            )

    def extract_dimensions_from_data(self, row):
        '''Extract all hierarchical and non-hierarchical dimensions from the
        given row.
        '''
        # If a valid mapping is not found, the name of the dimension is used.
        return {
            dimension_name: row.get(
                self.dimension_name_to_row_mapping.get(dimension_name, dimension_name),
                '',
            )
            for dimension_name in self.all_dimensions
        }

    # pylint: disable=C0103
    def cache_dimensions(
        self,
        row_data,
        row_key,
        output_hierarchical_dimensions,
        output_non_hierarchical_dimensions,
    ):
        '''Cache hierarchical and non-hierarchical dimension values.
        '''
        # Optionally cache hierarchical dimensions
        hierarchical_key = build_key_from_dimensions(
            row_data, self.HIERARCHICAL_DIMENSIONS
        )
        if hierarchical_key not in self.hierarchical_combinations:
            # Compose input and output dimension values
            input_hierarchical_dimensions = {
                dimension_name: row_data[dimension_name]
                for dimension_name in self.HIERARCHICAL_DIMENSIONS
            }
            self.hierarchical_combinations[hierarchical_key] = {
                'input': input_hierarchical_dimensions,
                'output': output_hierarchical_dimensions,
            }

        # Optionally cache non-hierarchical dimensions
        for non_hier_dimension, output_value in iter(
            output_non_hierarchical_dimensions.items()
        ):
            dimension_items = self.non_hierarchical_items[non_hier_dimension]
            input_value = row_data[non_hier_dimension]

            if input_value not in dimension_items:
                dimension_items[input_value] = output_value

    def collect_dimensions(self, input_row):
        '''Collect dimension info from dictionary of data and returns a dict of
        output data.
        '''
        row_data = self.extract_dimensions_from_data(input_row)
        key = build_key_from_dimensions(row_data, self.all_dimensions)

        # Check to see if we've already processed this key
        if key not in self.transformed_values:
            # Transform dimensions
            hierarchical_data = filter_dimensions(
                row_data, self.HIERARCHICAL_DIMENSIONS
            )
            output_hierarchical_dimensions = self.hierarchical_transform_fn(
                hierarchical_data
            )

            non_hierarchical_data = filter_dimensions(
                row_data, self.NON_HIERARCHICAL_DIMENSIONS
            )
            # pylint: disable=C0103
            output_non_hierarchical_dimensions = self.non_hierarchical_transform_fn(
                non_hierarchical_data
            )

            # Store output row data
            transformed_values = dict(output_hierarchical_dimensions)
            transformed_values.update(output_non_hierarchical_dimensions)

            self.transformed_values[key] = {
                'input': row_data,
                'output': transformed_values,
            }

            # Cache hierarchical and non-hierarchical lists
            self.cache_dimensions(
                row_data,
                key,
                output_hierarchical_dimensions,
                output_non_hierarchical_dimensions,
            )

        return self.transformed_values[key]['output']

    @property
    def hierarchical_dimension_count(self):
        return len(self.hierarchical_combinations)
