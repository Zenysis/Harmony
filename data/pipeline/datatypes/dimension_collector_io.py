'''Supports the reading and writing of files for the DimensionCollector.
'''
from builtins import next
from util.file.unicode_csv import UnicodeDictReader, UnicodeDictWriter

# The column name used when the non-hierarchical dimensions are written to a file.
DIMENSION_TYPE_COLUMN = 'dimension'


def add_prefix(prefix, text):
    return '%s%s' % (prefix, text)


# TODO(stephen, anyone): There is a lot of weird indirection in the utilities in this
# file. We should make the I/O operations a lot more straightforward.


class DimensionCollectorReader:
    '''Reads through a file outputted by a DimensionCollector.
    '''

    def __init__(self, open_file, prefix, dimensions, is_dimension_collector_source):
        self.prefix = prefix
        self.dimensions = dimensions
        self.reader = UnicodeDictReader(open_file)

    def __iter__(self):
        return self

    def extract_values(self, row: dict) -> dict:
        raise ValueError('Must be implemented by subclass')

    def __next__(self):
        # NOTE(toshi): This will raise a StopIteration when there are no more
        # items left, and should be used with a for loop.
        return self.extract_values(next(self.reader))


class HierarchicalDimensionCollectorReader(DimensionCollectorReader):
    def __init__(self, is_dimension_collector_source, *args, **kwargs):
        super().__init__(is_dimension_collector_source, *args, **kwargs)
        self.is_dimension_collector_source = is_dimension_collector_source
        self.extraction_map = {
            dimension_name: add_prefix(self.prefix, dimension_name)
            for dimension_name in self.dimensions
        }

    def extract_values(self, row: dict) -> dict:
        # If this is a legacy source, then we can just return the row
        if not self.is_dimension_collector_source:
            return row

        return {
            dimension_name: row[mapping_key]
            for dimension_name, mapping_key in self.extraction_map.items()
        }


class NonHierarchicalDimensionCollectorReader(DimensionCollectorReader):
    def extract_values(self, row: dict) -> dict:
        return {row[DIMENSION_TYPE_COLUMN]: row[self.prefix]}


def build_combined_header(dimension_list, input_prefix, output_prefix):
    '''Returns a list where the first half of the list are the elements in
    dimension_list with 'input' prepended, and then 'output'.
    '''
    header = []
    for prefix in (input_prefix, output_prefix):
        for dimension_name in dimension_list:
            header.append(add_prefix(prefix, dimension_name))

    return header


def write_hierarchical_dimensions(
    collector, hierarchical_filename, input_prefix, output_prefix
):
    with open(hierarchical_filename, 'w') as hierarchical_file:
        header = build_combined_header(
            collector.HIERARCHICAL_DIMENSIONS, input_prefix, output_prefix
        )
        hierarchical_writer = UnicodeDictWriter(hierarchical_file, header)
        hierarchical_writer.writeheader()

        for dimension_dict in collector.hierarchical_combinations.values():
            item_dict = {}
            for dimension_name in collector.HIERARCHICAL_DIMENSIONS:
                item_dict.update(
                    {
                        add_prefix(input_prefix, dimension_name): (
                            dimension_dict['input'].get(dimension_name, '')
                        ),
                        add_prefix(output_prefix, dimension_name): (
                            dimension_dict['output'].get(dimension_name, '')
                        ),
                    }
                )

            hierarchical_writer.writerow(item_dict)


def write_hierarchical_dimensions_with_unmatched(
    collector, hierarchical_filename, input_prefix, output_prefix, unmatched_filename
):
    # HACK(moriah): figure out how to do this efficiently without creating an entire
    # new function that is basically doing the same thing as above.
    with open(hierarchical_filename, 'w') as hierarchical_file, open(
        unmatched_filename, 'w'
    ) as unmatched_file:
        header = build_combined_header(
            collector.HIERARCHICAL_DIMENSIONS, input_prefix, output_prefix
        )
        hierarchical_writer = UnicodeDictWriter(hierarchical_file, header)
        hierarchical_writer.writeheader()
        unmatched_writer = UnicodeDictWriter(unmatched_file, header)
        unmatched_writer.writeheader()
        for dimension_dict in collector.hierarchical_combinations.values():
            item_dict = {}
            for dimension_name in collector.HIERARCHICAL_DIMENSIONS:
                input_dimension = dimension_dict['input'].get(dimension_name, '')
                output_dimension = dimension_dict['output'].get(dimension_name, '')

                item_dict.update(
                    {
                        add_prefix(input_prefix, dimension_name): input_dimension,
                        add_prefix(output_prefix, dimension_name): output_dimension,
                    }
                )
                if not output_dimension and input_dimension:
                    # If the output dimension is empty for a non empty input dimension
                    # this means the dimension was unmatched at this dimension level.
                    # Therefore we write it to the unmatched locations file.
                    unmatched_writer.writerow(item_dict)

            hierarchical_writer.writerow(item_dict)


def write_non_hierarchical_dimensions(collector, filename, input_text, output_text):
    with open(filename, 'w') as f:
        header = [DIMENSION_TYPE_COLUMN, input_text, output_text]
        writer = UnicodeDictWriter(f, header)
        writer.writeheader()
        for dimension_name, val_dict in collector.non_hierarchical_items.items():
            for original_val, transformed_val in val_dict.items():
                writer.writerow(
                    {
                        DIMENSION_TYPE_COLUMN: dimension_name,
                        input_text: original_val,
                        output_text: transformed_val,
                    }
                )
