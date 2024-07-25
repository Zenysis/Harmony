#!/usr/bin/env python
# Shard a CSV file into multiple files based on a given shard size. Compressed input
# and output files are supported (for gz and lz4 compression).
#
# Usage:
#   ./shard_csv.py \
#     --input_file 'path_to_csv.csv' \
#     --output_file_pattern 'output_file_pattern.#.csv' \
#     --shard_size 100000
import os
import sys

from pylib.base.flags import Flags

from log import LOG
from util.file.compression.lz4 import LZ4Reader, LZ4Writer
from util.file.compression.pigz import PigzReader, PigzWriter
from util.file.file_config import FilePattern
from util.file.shard import ShardWriter, fread, fwrite


def get_file_handler(filename, writer=False):
    '''Find what file handler should be used based on the file extension. Supported
    extensions are csv, gz, and lz4.
    '''
    extension = os.path.splitext(filename)[1]
    if extension == '.csv':
        return fwrite if writer else fread
    if extension == '.gz':
        return PigzWriter if writer else PigzReader
    if extension == '.lz4':
        return LZ4Writer if writer else LZ4Reader

    raise ValueError(
        f'Unknown file extension passed: {extension}. Only csv, gz, and lz4 are supported'
    )


def main():
    Flags.PARSER.add_argument(
        '--input_file', type=str, required=True, help='Input CSV to shard'
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Pattern to use for writing the output CSV shards',
    )
    Flags.PARSER.add_argument(
        '--shard_size',
        type=int,
        default=-1,
        help='Maximum number of rows to write per file.',
    )
    Flags.InitArgs()

    file_pattern = FilePattern(Flags.ARGS.output_file_pattern)
    input_file_opener = get_file_handler(Flags.ARGS.input_file)
    output_file_opener = get_file_handler(Flags.ARGS.output_file_pattern, True)

    shard_size = Flags.ARGS.shard_size
    assert shard_size > 0, f'Invalid shard size: {shard_size}'
    log_line_count = shard_size // 10 or 1

    with input_file_opener(Flags.ARGS.input_file) as input_file:
        try:
            header = next(input_file)
        except StopIteration:
            LOG.error('Empty input file received. Cannot continue.')
            return 1

        # When a new output file is opened, we first want to write the CSV header as the
        # first line.
        def on_new_file_opened(output_file):
            output_file.write(header)

        with ShardWriter(
            file_pattern, Flags.ARGS.shard_size, output_file_opener, on_new_file_opened
        ) as output_writer:
            count = 0
            for line in input_file:
                output_writer.write(line)
                count += 1
                if (count % log_line_count) == 0:
                    LOG.info('Rows processed: %s', count)
            LOG.info('Finished writing shards. Total rows processed: %s', count)
    return 0


if __name__ == '__main__':
    sys.exit(main())
