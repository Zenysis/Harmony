class DimensionCleaner:
    '''Base implementation for a class that cleans dimension values. To be
    overridden per integration.
    '''

    def __init__(self, dimension_collector_cls, dimension_name_to_row_mapping=None):
        self.dimension_collector = dimension_collector_cls(
            self.clean_hierarchical_dimensions,
            self.clean_non_hierarchical_dimensions,
            dimension_name_to_row_mapping,
        )

        # Dict mapping from dimension_name to cleaning function
        self.non_hierarchical_cleaning_map = {}

    def register_non_hierarchical_cleaner(self, dimension_name, function):
        '''Registers a cleaning function `function` for `dimension_name`.
        '''
        self.non_hierarchical_cleaning_map[dimension_name] = function

    @staticmethod
    def default_cleaning_fn(dimension_val):
        '''Default method to clean dimensions.
        '''
        # Remove non-printable characters and trailing or leading whitespace.
        return ''.join(c for c in dimension_val if str.isprintable(c)).strip()

    def clean_hierarchical_dimensions(self, dimension_values_map):
        '''Cleans hierarchical_dimensions. Cleans all dimensions at once due to
        inter-dimension dependent logic. ie Facility is dependent on Woreda
        value. Override for country specific logic.
        Returns a dict, mapping dimension_name to cleaned value.
        '''
        return {
            dimension_name: self.default_cleaning_fn(
                dimension_values_map[dimension_name]
            )
            for dimension_name in self.dimension_collector.HIERARCHICAL_DIMENSIONS
        }

    def clean_non_hierarchical_fn(self, dimension_name, dimension_val):
        '''Cleans non hiearchical dimensions. Uses registered cleaning functions
        or the default cleaning function.
        '''
        cleaning_fn = self.non_hierarchical_cleaning_map.get(
            dimension_name, self.default_cleaning_fn
        )
        return cleaning_fn(dimension_val)

    def clean_non_hierarchical_dimensions(self, dimension_values_map):
        '''Cleans non-hierarchical dimensions.
        '''
        return {
            dimension_name: self.non_hierarchical_cleaning_map.get(
                dimension_name, self.default_cleaning_fn
            )(dimension_values_map[dimension_name])
            for dimension_name in self.dimension_collector.NON_HIERARCHICAL_DIMENSIONS
        }

    def process_row(self, row_data):
        return self.dimension_collector.collect_dimensions(row_data)
