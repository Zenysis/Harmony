#!/usr/bin/env python
# Standardized Druid output row writer to use in the
# 90_shared/10_fill_dimensions process pipeline step.
import csv
import sys

from pylib.base.flags import Flags

from config.datatypes import BaseRowType, DimensionFactoryType
from data.pipeline.io.druid_writer import DruidWriter, ErrorHandler
from util.file.compression.lz4 import LZ4Reader
from util.file.compression.pigz import PigzWriter
from util.file.file_config import FilePattern
from util.file.shard import ShardWriter


def main():
    Flags.PARSER.add_argument(
        '--location_mapping_file',
        type=str,
        required=True,
        help='Canonical location mappings for the ' 'current source',
    )
    Flags.PARSER.add_argument(
        '--non_hierarchical_mapping_file',
        type=str,
        required=bool(DimensionFactoryType.non_hierarchical_dimensions),
        help='Canonical non-hierarchical dimension mapping, only required if the deployment'
        'uses non-hierarchical dimensions',
    )
    Flags.PARSER.add_argument(
        '--metadata_file',
        type=str,
        required=True,
        help='Location of metadata mapping file',
    )
    Flags.PARSER.add_argument(
        '--input_file',
        type=str,
        required=True,
        help='Source data file needing canonical ' 'locations and geocoding',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Pattern to use for writing the output JSON ' 'to be consumed by druid',
    )
    Flags.PARSER.add_argument(
        '--shard_size',
        type=int,
        default=-1,
        help='Maximum number of rows to write per file. '
        'Value -1 disables sharding. Good default '
        'values when using the standard parser are '
        '3000000. When using the experimental '
        'parser, a good default is 150000.',
    )
    Flags.PARSER.add_argument(
        '--use_experimental_parser',
        default=False,
        action='store_true',
        help='Use the experimental parser for input row '
        'parsing and output row writing. '
        'Significant performance improvements but '
        'parser has not been tested outside ET '
        'pipeline.',
    )
    Flags.PARSER.add_argument(
        '--ignore_missing_date',
        default=False,
        action='store_true',
        help='If a row is found that has no date value, '
        'skip it and move on. If unset, raise an '
        'error.',
    )
    Flags.PARSER.add_argument(
        '--ignore_empty_data',
        default=False,
        action='store_true',
        help='If a row is found that has no data values '
        'stored, skip it and move on. If unset, '
        'raise an error.',
    )
    Flags.PARSER.add_argument(
        '--metadata_digest_file',
        type=str,
        required=False,
        default='metadata_digest_file.csv',
        help='output file for metadata digest.',
    )
    Flags.PARSER.add_argument(
        '--ignore_missing_canonical_match',
        default=False,
        action='store_true',
        help='If a row\'s dimensions do not have an '
        'entry in the location_mapping_file, skip '
        'the row. If unset, raise an error. '
        'Note: this does not mean that all rows '
        'with *failed* matches will be skipped. '
        'This only means dimensions that do not '
        'have an entry in location_mapping_file '
        'will be skipped.',
    )
    Flags.InitArgs()

    file_pattern = FilePattern(Flags.ARGS.output_file_pattern)
    with LZ4Reader(Flags.ARGS.input_file) as input_file, ShardWriter(
        file_pattern, Flags.ARGS.shard_size, PigzWriter
    ) as output_writer, open(
        Flags.ARGS.metadata_digest_file, 'w'
    ) as metadata_digest_file:
        metadata_collector = DimensionFactoryType.create_metadata_collector(
            Flags.ARGS.metadata_file,
            Flags.ARGS.location_mapping_file,
            Flags.ARGS.non_hierarchical_mapping_file,
        )
        error_handler = ErrorHandler(
            allow_missing_date=Flags.ARGS.ignore_missing_date,
            allow_empty_data=Flags.ARGS.ignore_empty_data,
            allow_missing_canonical_match=Flags.ARGS.ignore_missing_canonical_match,
        )
        DruidWriter.run(
            BaseRowType,
            metadata_collector,
            input_file,
            output_writer,
            Flags.ARGS.use_experimental_parser,
            error_handler,
            csv.DictWriter(
                metadata_digest_file,
                fieldnames=['indicator_id', 'count', 'start_date', 'end_date'],
            ),
        )
    return 0


if __name__ == '__main__':
    sys.exit(main())
