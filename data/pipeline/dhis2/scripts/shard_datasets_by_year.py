#!/usr/bin/env python
# Simple script to shard DHIS2 data files produced by the RawDataBuilder by
# year so they can be processed in parallel.
from builtins import next
from builtins import range
import sys

from contextlib2 import ExitStack
from pylib.base.flags import Flags

from log import LOG
from util.file.compression.lz4 import LZ4Reader, LZ4Writer
from util.file.file_config import FilePattern


def extract_year(line, date_column_idx):
    idx = 0
    for _ in range(date_column_idx):
        idx = line.index(',', idx) + 1

    # HACK(stephen): Avoid date parsing until we have a source that needs it.
    # Just extract the year directly.
    return line[idx : (idx + 4)]


# Read the first line from the file. If the file is empty, return None.
def read_header(input_file):
    try:
        return next(input_file)
    except StopIteration:
        pass
    return None


def main():
    Flags.PARSER.add_argument(
        '--input_files',
        nargs='+',
        type=str,
        required=True,
        help='List of DHIS2 files produced by the '
        'RawDataBuilder to shard based on the year '
        'of each row in the files.',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='File pattern for output files.',
    )
    Flags.PARSER.add_argument(
        '--date_column',
        type=str,
        required=False,
        default='Period',
        help='The date column in the dataset.',
    )
    Flags.InitArgs()

    file_pattern = FilePattern(Flags.ARGS.output_file_pattern)
    date_column = Flags.ARGS.date_column

    output_files = {}
    input_row_count = output_file_count = 0
    with ExitStack() as exit_stack:
        LOG.info('Processing %s files', len(Flags.ARGS.input_files))
        for filename in Flags.ARGS.input_files:
            LOG.info('Starting: %s', filename)

            with LZ4Reader(filename) as input_file:
                header_line = read_header(input_file)
                # Skip processing if the file is empty.
                if not header_line:
                    continue

                date_column_idx = header_line.split(',').index(date_column)
                for line in input_file:
                    input_row_count += 1
                    if (input_row_count % 2000000) == 0:
                        LOG.info('Rows processed: %s', input_row_count)

                    # If this is the first time this year has been seen, create
                    # a new shard and write the CSV header to the top.
                    year = extract_year(line, date_column_idx)
                    if year not in output_files:
                        LOG.info('Creating new shard: %s', year)
                        output_file = exit_stack.enter_context(
                            LZ4Writer(file_pattern.build(year))
                        )
                        output_file.write(header_line)
                        output_files[year] = output_file
                        output_file_count += 1

                    output_files[year].write(line)

    LOG.info('Finished sharding files by year')
    LOG.info('Input rows read: %s', input_row_count)
    LOG.info('Output files created: %s', output_file_count)
    return 0


if __name__ == '__main__':
    sys.exit(main())
