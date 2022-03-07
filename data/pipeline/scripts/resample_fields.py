#!/usr/bin/env python
import sys
import json

from datetime import datetime
from pylib.base.flags import Flags

from config.druid import DIMENSIONS
from config.druid_base import FIELD_NAME
from config.system import STANDARD_DATA_DATE_FORMAT
from data.pipeline.datatypes.base_row import BaseRow
from data.pipeline.resampler import Resampler
from log import LOG
from util.file.compression.pigz import PigzReader, PigzWriter
from util.file.file_config import FilePattern
from util.file.shard import ShardReader, ShardWriter

# NOTE(stephen): Sorting the Druid dimensions to ensure the order is stable across runs.
DEFAULT_DIMENSIONS = [
    d for d in sorted(DIMENSIONS) if d not in (FIELD_NAME, BaseRow.DATE_FIELD)
]


ALTERNATE_LOCATION_ENDINGS = {
    'Copperbelt Province_Mpongwe District_Mpongwe Mission Hospital': datetime.strptime(
        '2019-12-31', STANDARD_DATA_DATE_FORMAT
    ),
    'North Western Province_Kasempa District_Mukinge Mission Hospital': datetime.strptime(
        '2017-12-31', STANDARD_DATA_DATE_FORMAT
    ),
}


def decide_end_date(row, base_end_date, alternate_location_endings):
    # In  some facilities in dhis2 disappear.
    # because we are resmapling this district has data for population past where it should
    # in our platform.
    location = '%s_%s_%s' % (
        row['ProvinceName'],
        row['DistrictName'],
        row['FacilityName'],
    )
    if location in alternate_location_endings:
        print('Picking alternate ending for row: ', row)
    alternate_end_date = alternate_location_endings.get(location, base_end_date)
    return alternate_end_date if alternate_end_date < base_end_date else base_end_date


def main():
    # NOTE(abby): Allow passing in either a file with fields or a field list directly.
    fields_parser_group = Flags.PARSER.add_mutually_exclusive_group(required=True)
    fields_parser_group.add_argument(
        '--fields_file',
        type=str,
        help='File containing list of fields to be resampled.',
    )
    fields_parser_group.add_argument(
        '--fields',
        type=str,
        nargs='*',
        help='List of fields to be resampled.',
    )

    Flags.PARSER.add_argument(
        '--dimensions',
        type=str,
        nargs='*',
        default=DEFAULT_DIMENSIONS,
        help='List of dimensions that represent a key. Defaults to all Druid dimensions',
    )
    Flags.PARSER.add_argument(
        '--date_field', type=str, required=True, help='The date column'
    )
    Flags.PARSER.add_argument(
        '--date_format',
        type=str,
        required=False,
        default=STANDARD_DATA_DATE_FORMAT,
        help='The date format',
    )
    Flags.PARSER.add_argument(
        '--last_date',
        type=str,
        required=False,
        default=datetime.today().strftime('%Y-%m-%d'),
        help='last date you want the data filled to',
    )
    Flags.PARSER.add_argument(
        '--shard_size',
        type=int,
        default=-1,
        help='Maximum number of rows to write per file. '
        'Value -1 disables sharding. See '
        'fill_dimension_data.py for good example '
        'values.',
    )
    Flags.PARSER.add_argument(
        '--input_file_pattern',
        type=str,
        required=True,
        help='Pattern to use for reading input JSON rows',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Pattern to use for writing the output JSON ' 'to be consumed by druid',
    )
    Flags.PARSER.add_argument(
        '--location_resample_end_dates',
        type=str,
        required=False,
        default='',
        help='File path to the closure/end dates for specific locations',
    )

    Flags.InitArgs()
    LOG.info('Starting resampling')

    date_field = Flags.ARGS.date_field
    date_format = Flags.ARGS.date_format
    dimensions = Flags.ARGS.dimensions
    last_date = Flags.ARGS.last_date

    # NOTE(abby): `fields_file` and `fields` are mutually exclusive, get the fields
    # from whichever was used.
    if Flags.ARGS.fields_file is not None:
        with open(Flags.ARGS.fields_file) as fields_file:
            fields = set(f.strip() for f in fields_file)
    else:
        fields = set(Flags.ARGS.fields)

    input_file_pattern = FilePattern(Flags.ARGS.input_file_pattern)
    output_file_pattern = FilePattern(Flags.ARGS.output_file_pattern)
    with ShardReader(input_file_pattern, PigzReader) as input_file, ShardWriter(
        output_file_pattern, Flags.ARGS.shard_size, PigzWriter
    ) as output_writer:
        resampler = Resampler(fields, date_field, date_format, dimensions, last_date)
        resampler.read_lines(input_file)
        LOG.info('Finished reading input lines')
        alt_end_fn = lambda y, x: x
        location_resample_end_dates = Flags.ARGS.location_resample_end_dates
        if location_resample_end_dates:
            with open(location_resample_end_dates) as end_dates:
                alternate_end_dates = json.load(end_dates)
                alt_end_fn = lambda row, base_end_date: decide_end_date(
                    row, base_end_date, alternate_end_dates
                )

        for output in resampler.build_output_rows(newline=True):
            output_writer.write(output)

    LOG.info('Finished resampling')
    return 0


if __name__ == '__main__':
    sys.exit(main())
