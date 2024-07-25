import json
import gzip


def generate_indicator_data_stream(data_path):
    '''
    Given an indicator data file in json.gz format, returns an interable that allows the caller
    to iterate through the indicator data in the file.

    Yields
    -------
    dict
        The dictionary representation of a single indicator value

    Returns
    -------
    generator
        An iterable of dictionary items with each dictionary representing a single indicator
        value
    '''
    with gzip.open(data_path, "rt") as json_file:
        while True:
            current_line = json_file.readline()

            if len(current_line) == 0:
                break

            yield json.loads(current_line)
