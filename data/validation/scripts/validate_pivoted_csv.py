#!/usr/bin/env python
import csv
import sys

from pylib.base.flags import Flags

from config.aggregation import DIMENSIONS
from config.database import DATASOURCE
from data.validation.metrics.csv_validator import PivotedCSVValidator
from log import LOG


def _extract_dimensions(input_file):
    '''Extract the dimension column names from the given input CSV's header.'''
    output = []
    with open(input_file) as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        for column in headers:
            if column in DIMENSIONS:
                output.append(column)
    return output


def main():
    Flags.PARSER.add_argument(
        '--input_file',
        type=str,
        required=True,
        help='CSV containing values to validate',
    )
    Flags.PARSER.add_argument(
        '--datasource',
        type=str,
        default=DATASOURCE.name,
        help='Datasource to validate against',
    )
    Flags.PARSER.add_argument(
        '--output_file',
        type=str,
        required=True,
        help='Output CSV to write validation results',
    )
    Flags.InitArgs()
    input_file = Flags.ARGS.input_file
    dimensions = _extract_dimensions(input_file)

    LOG.info('Starting validation over dimensions: %s', dimensions)
    validator = PivotedCSVValidator(Flags.ARGS.datasource, dimensions)
    validator.parse_and_run(input_file, Flags.ARGS.output_file)
    return validator.passed_validation


if __name__ == '__main__':
    sys.exit(main())
