#!/usr/bin/env python
# Simple script to shard DHIS2 data files produced by the RawDataBuilder by
# year so they can be processed in parallel.
from builtins import next
from builtins import range
import sys

from dateutil.relativedelta import relativedelta

from datetime import datetime
from contextlib2 import ExitStack

from log import LOG
from data.pipeline.dhis2.raw_data_generator import maybe_get_sharded_dimensions
from data.pipeline.dhis2.date_periods import DHIS2Periods
from pylib.base.flags import Flags
from util.file.compression.lz4 import LZ4Reader, LZ4Writer
from util.file.file_config import FilePattern

DAILY_DATE_FORMAT = '%Y%m%d'

MONTHLY_DATE_FORMAT = '%Y%m'

FULL_DATE_FORMAT = '%Y-%m-%d %H:%M:%S.0'
SOURCE_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


def extract_year(line, date_column_idx):
    idx = 0
    for _ in range(date_column_idx):
        idx = line.index(',', idx) + 1

    # HACK(stephen): Avoid date parsing until we have a source that needs it.
    # Just extract the year directly.
    return line[idx : (idx + 4)]


def extract_date_str(line, date_column_idx, length=19):
    idx = 0
    for _ in range(date_column_idx):
        idx = line.index(',', idx) + 1
    return line[idx : (idx + length)]


# Read the first line from the file. If the file is empty, return None.
def read_header(input_file):
    try:
        return next(input_file)
    except StopIteration:
        pass
    return None


def process_period_ranges(date_periods, reporting_rate, shard_dates_size, diff):
    diff = relativedelta(days=diff)
    LOG.info(date_periods.reverse[reporting_rate])
    output = {}
    for period_group in maybe_get_sharded_dimensions(
        date_periods[reporting_rate], shard_dates_size
    ):
        start, end = period_group[0], period_group[-1]
        for p in period_group:
            reverse_period = date_periods.reverse[reporting_rate][p]
            LOG.info(f'reverse_period {reverse_period} {reporting_rate}')
            if (
                reporting_rate == 'Quarterly'
                or reporting_rate == 'Monthly'
                or reporting_rate == 'Yearly'
                or reporting_rate == 'Weekly'
            ) and isinstance(reverse_period, list):
                for rp in reverse_period:
                    date = datetime.strptime(rp, FULL_DATE_FORMAT) + diff
                    output[date.strftime(SOURCE_DATE_FORMAT)] = f'{start}_{end}'
            else:
                date = datetime.strptime(reverse_period, FULL_DATE_FORMAT) + diff
                output[date.strftime(SOURCE_DATE_FORMAT)] = f'{start}_{end}'
    LOG.info(output)
    return output


def get_period(source_period, period_ranges):
    period = period_ranges.get(source_period)
    if period is None:
        LOG.info(f'Period not found for {source_period}')
        source_datetime = datetime.strptime(source_period, SOURCE_DATE_FORMAT)
        diff = relativedelta(days=1)
        return get_period(
            (source_datetime + diff).strftime(SOURCE_DATE_FORMAT), period_ranges
        )
    return period


def main():
    Flags.PARSER.add_argument(
        '--input_file',
        type=str,
        required=True,
        help='DHIS2 files produced by the '
        'RawDataBuilder to shard based on the date range'
        'of each row in the files.',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='File pattern for output files.',
    )
    Flags.PARSER.add_argument(
        '--reporting_rate',
        type=str,
        required=True,
        help='Reporting rate of the input file',
    )
    Flags.PARSER.add_argument(
        '--date_column',
        type=str,
        required=False,
        default='Period',
        help='The date column in the dataset.',
    )
    Flags.PARSER.add_argument(
        '--shard_dates_size',
        type=int,
        required=True,
        help='Size of the date chuck used when querying the dhsi2 api',
    )
    Flags.PARSER.add_argument(
        '--start_date',
        type=str,
        required=True,
        help='First date period that was queryed in dhis2',
    )
    Flags.PARSER.add_argument(
        '--end_date',
        type=str,
        required=True,
        help='Last date period that was queryed in dhis2',
    )
    Flags.PARSER.add_argument(
        '--date_diff',
        type=int,
        required=False,
        default=0,
        help='Some dates between what dhis2 returns and what we query '
        'are offset, only found so far with the Weekly reporting rate',
    )
    Flags.InitArgs()

    file_pattern = FilePattern(Flags.ARGS.output_file_pattern)
    date_column = Flags.ARGS.date_column
    output_files = {}
    input_row_count = output_file_count = 0
    date_periods = DHIS2Periods(
        datetime.strptime(Flags.ARGS.start_date, DAILY_DATE_FORMAT),
        datetime.strptime(Flags.ARGS.end_date, DAILY_DATE_FORMAT),
    )
    reporting_rate = Flags.ARGS.reporting_rate
    period_ranges = process_period_ranges(
        date_periods, reporting_rate, Flags.ARGS.shard_dates_size, Flags.ARGS.date_diff
    )
    LOG.info(f'--------Starting processing for {reporting_rate}-------------')
    with ExitStack() as exit_stack:
        LOG.info('Starting: %s', Flags.ARGS.input_file)

        with LZ4Reader(Flags.ARGS.input_file) as input_file:
            header_line = read_header(input_file)
            # Skip processing if the file is empty.
            if not header_line:
                return 0

            date_column_idx = header_line.split(',').index(date_column)
            for line in input_file:
                input_row_count += 1
                if (input_row_count % 2000000) == 0:
                    LOG.info('Rows processed: %s', input_row_count)

                # If this is the first time this year has been seen, create
                # a new shard and write the CSV header to the top.
                source_period = extract_date_str(line, date_column_idx)
                period = get_period(source_period, period_ranges)
                if not period:
                    LOG.info(f'\n\n\nRANGES {period_ranges}\n\n\n {line}')
                    LOG.info(f'Period not found: {period} for {source_period}')
                if period not in output_files:
                    LOG.info('Creating new shard: %s', period)
                    output_file = exit_stack.enter_context(
                        LZ4Writer(file_pattern.build(period))
                    )
                    output_file.write(header_line)
                    output_files[period] = output_file
                    output_file_count += 1

                output_files[period].write(line)

    LOG.info('Finished sharding files by year')
    LOG.info('Input rows read: %s', input_row_count)
    LOG.info('Output files created: %s', output_file_count)
    return 0


if __name__ == '__main__':
    sys.exit(main())
