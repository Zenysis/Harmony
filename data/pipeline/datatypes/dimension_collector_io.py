'''Supports the reading and writing of files for the DimensionCollector.
'''
from builtins import next, object
from util.file.unicode_csv import UnicodeDictReader, UnicodeDictWriter


def add_prefix(prefix, text):
    return '%s%s' % (prefix, text)


class DimensionCollectorReader(object):
    '''Reads through a file outputted by a DimensionCollector.
    '''

    def __init__(self, open_file, prefix, dimensions, is_dimension_collector_source):
        self.prefix = prefix
        self.dimensions = dimensions
        self.reader = UnicodeDictReader(open_file)
        self.extraction_map = (
            self.build_extraction_map() if is_dimension_collector_source else None
        )

    def __iter__(self):
        return self

    def build_extraction_map(self):
        return {
            dimension_name: add_prefix(self.prefix, dimension_name)
            for dimension_name in self.dimensions
        }

    def __next__(self):
        # NOTE(toshi): This will raise a StopIteration when there are no more
        # items left, and should be used with a for loop.
        next_line = next(self.reader)

        # If this is a legacy source, then we can just return the row
        if not self.extraction_map:
            return next_line

        extracted_values = {}
        for dimension_name, mapping_key in self.extraction_map.items():
            extracted_values[dimension_name] = next_line[mapping_key]
        return extracted_values


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

        for dimension_dict in iter(collector.hierarchical_combinations.values()):
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


def write_non_hierarchical_dimensions(
    filename, non_hierarchical_items, dimension_text, input_text, output_text
):
    with open(filename, 'w') as f:
        header = [dimension_text, input_text, output_text]
        writer = UnicodeDictWriter(f, header)
        writer.writeheader()
        for dimension_name, val_dict in iter(non_hierarchical_items.items()):
            for input_val, output_val in val_dict.items():
                writer.writerow(
                    {
                        dimension_text: dimension_name,
                        input_text: input_val,
                        output_text: output_val,
                    }
                )
