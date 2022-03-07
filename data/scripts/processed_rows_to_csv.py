#!/usr/bin/env python
import csv
import json
import sys

from pylib.base.flags import Flags

from log import LOG
from util.file.ambiguous_file import AmbiguousFile


def setup_flags():
    Flags.PARSER.add_argument(
        '--input', type=str, required=True, help='Path to input json'
    )
    Flags.PARSER.add_argument(
        '--output', type=str, required=True, help='Path to output csv'
    )
    Flags.PARSER.add_argument(
        '--dimensions',
        type=str,
        nargs='*',
        required=False,
        help='List of dimensions to keep. Otherwise all dimensions are included.',
    )

    Flags.InitArgs()


def process_line(line, dimensions):
    row = json.loads(line)

    ret = {}
    for key, val in row['data'].items():
        ret['Field'] = key
        ret['Value'] = val

    ret['Date'] = row['Real_Date']
    if dimensions:
        for dimension in dimensions:
            ret[dimension] = row[dimension]
    else:
        ret.update(row)
    return ret


def main():
    setup_flags()

    with AmbiguousFile(Flags.ARGS.input) as input_file, AmbiguousFile(
        Flags.ARGS.output, write=True
    ) as output_file:

        # Dimensions to keep
        dimensions = set(Flags.ARGS.dimensions) if Flags.ARGS.dimensions else None

        # Grab the first row and build the CSV headers
        firstrow = process_line(next(input_file), dimensions)

        fieldnames = list(firstrow.keys())
        writer = csv.DictWriter(output_file, fieldnames)
        writer.writeheader()
        writer.writerow(firstrow)

        # Process the rest
        count = 1
        for line in input_file:
            writer.writerow(process_line(line, dimensions))

            count += 1
            if count % 50000 == 0:
                LOG.info('Row %s', count)

        LOG.info('Done.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
