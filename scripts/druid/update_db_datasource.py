#!/usr/bin/env python
import sys

from pylib.base.flags import Flags

from db.druid.update_db_datasource import update_db_datasource
from util.local_script_wrapper import local_main_wrapper


def setup_arguments() -> None:
    Flags.PARSER.add_argument(
        '-d', '--datasource', type=str, required=False, help='Druid datasource to add'
    )
    Flags.PARSER.add_argument(
        '-a',
        '--all',
        action='store_true',
        default=False,
        required=False,
        help='Whether to add all existent druid datasources',
    )
    Flags.PARSER.add_argument(
        '--skip_grouped_sketch_sizes',
        action='store_true',
        required=False,
        help='Whether to optimize the sketch sizes for high cardinality dimensions by '
        'calculating the sketch sizes needed for multiple dimensions at once',
    )


def main() -> int:
    update_db_datasource(
        None if Flags.ARGS.all else (Flags.ARGS.datasource or 'LATEST_DATASOURCE'),
        Flags.ARGS.skip_grouped_sketch_sizes,
    )
    return 0


if __name__ == '__main__':
    sys.exit(local_main_wrapper(main, setup_arguments))
