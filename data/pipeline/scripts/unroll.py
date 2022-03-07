#!/usr/bin/env python
import json
import sys

from pylib.base.flags import Flags

from data.pipeline.datatypes.base_row import BaseRow
from util.file.compression.lz4 import LZ4Reader
from util.file.compression.pigz import PigzWriter


def unroll():
    with LZ4Reader(Flags.ARGS.input, 'r') as input_file, PigzWriter(
        Flags.ARGS.output
    ) as output_file:

        for input_row in input_file:
            row = json.loads(input_row)
            baserow = BaseRow(row['key'], row['data'], row['Real_Date'], row['source'])

            for output_row in baserow.to_druid_json_iterator(True):
                output_file.write(output_row)


def setup_flags():
    Flags.PARSER.add_argument(
        '--input', type=str, required=True, help='Path to input json lz4'
    )
    Flags.PARSER.add_argument(
        '--output', type=str, required=True, help='Path to output json gz'
    )

    Flags.InitArgs()


def main():
    setup_flags()

    unroll()


if __name__ == '__main__':
    sys.exit(main())
