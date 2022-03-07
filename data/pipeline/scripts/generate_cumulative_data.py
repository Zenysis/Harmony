#!/usr/bin/env python
import csv
import sys

from datetime import datetime, timedelta
from io import StringIO
from operator import itemgetter
from typing import Dict, List, Optional, Tuple

from pylib.base.flags import Flags

from config.system import STANDARD_DATA_DATE_FORMAT
from log import LOG
from util.file.ambiguous_file import AmbiguousFile

TODAY = datetime.today()

# NOTE(stephen): Performance improvement - caching date conversions is a noticeable
# speedup in the pipeline.
_DATE_CACHE: Dict[str, Optional[datetime]] = {}


def parse_date(date_str: str) -> Optional[datetime]:
    if date_str not in _DATE_CACHE:
        try:
            full_date = datetime.strptime(date_str, STANDARD_DATA_DATE_FORMAT)
            _DATE_CACHE[date_str] = full_date
        except:
            LOG.warning('Bad date string: %s', date_str)
            _DATE_CACHE[date_str] = None
    return _DATE_CACHE[date_str]


class CumulativeCSVWriter:
    def __init__(self, output_file, columns, date_column, start_date, end_date):
        self.output_file = output_file
        self.columns = [c for c in columns if c != date_column]
        self.date_clumn = date_column

        num_days = (end_date - start_date).days + 1

        # List containing dates and their string representation.
        # NOTE(stephen): Storing the strings at the same time for performance.
        self.date_range: List[Tuple[datetime, str]] = []
        for i in range(num_days):
            new_date = start_date + timedelta(days=i)
            self.date_range.append(
                (new_date, new_date.strftime(STANDARD_DATA_DATE_FORMAT))
            )

        # To avoid serializing the same CSV row over and over again, we use have the
        # DictWriter use an in-memory file. This gives us access to the serialized value
        # that the csv library would write.
        self.csv_row_collector = StringIO()

        # We will have the DictWriter write all columns of the row *except* the date
        # column. This will allow us to serialize the row as a CSV and then add the
        # date value to the end by concatenating to the string.
        # NOTE(stephen): Including a lineterminator even though we strip it off every
        # time. If we set `lineterminator=''` then the csv library *won't* quote fields
        # that contain a newline character leading to errors.
        self.csv_writer = csv.DictWriter(
            self.csv_row_collector,
            fieldnames=[c for c in columns if c != date_column],
            extrasaction='ignore',
            lineterminator='\n',
        )

        # Write the header to the in-memory file and then to the true output file.
        self.csv_writer.writeheader()
        self.output_file.write(
            f'{self.csv_row_collector.getvalue()[:-1]},"{date_column}"\n'
        )

    def write_rows(self, rows_with_dates: List[Tuple[datetime, dict]]):
        '''Write each row to the output file for all dates in the cumulative range. If
        the row's start date is after the cumulative range start date, use the row's
        start date as the beginning of the range.
        '''
        # Sort the rows so that they are in ascending order by date.
        # NOTE(stephen): This mutates the original list, but that should be ok given the
        # usage in this file. It seemed nicer to make it explicit that this method
        # creates the sorted rows instead of receiving them in a specific format. Also,
        # prefering in-place sort since the input file could have been really large.
        rows_with_dates.sort(key=itemgetter(0))

        cur_date = None
        cur_dates: List[str] = []
        for row_date, row in rows_with_dates:
            if row_date != cur_date:
                cur_date = row_date
                cur_dates = [
                    date_str
                    for date_val, date_str in self.date_range
                    if date_val >= cur_date
                ]
            self.write_row(row, cur_dates)

    def write_row(self, row: dict, dates: List[str]):
        '''Write the input row for each date listed.'''

        # Clear the previous row that was serialized.
        self.csv_row_collector.truncate(0)
        self.csv_row_collector.seek(0)
        self.csv_writer.writerow(row)

        # Build the csv row string without the date column.
        csv_row_base = self.csv_row_collector.getvalue()[:-1]
        for date_str in dates:
            self.output_file.write(f'{csv_row_base},{date_str}\n')


def main():
    Flags.PARSER.add_argument(
        '--output_file',
        type=str,
        required=True,
        help='Output csv file to store the cumulative results in.',
    )
    Flags.PARSER.add_argument(
        '--input_file',
        type=str,
        required=True,
        help='File to read in the line list data of cases',
    )
    Flags.PARSER.add_argument(
        '--date_column',
        type=str,
        required=False,
        default='date',
        help='File to read in the line list data',
    )
    Flags.PARSER.add_argument(
        '--start_date',
        type=str,
        required=False,
        help='Optional start date if not the earliest date present from input data',
    )
    Flags.InitArgs()
    LOG.info('Beginning cumulative data generation')

    date_col = Flags.ARGS.date_column
    start_date = Flags.ARGS.start_date
    with AmbiguousFile(Flags.ARGS.input_file, '.csv') as input_file, AmbiguousFile(
        Flags.ARGS.output_file, '.csv', True
    ) as output_file:
        reader = csv.DictReader(input_file)
        LOG.info('Starting row read')
        rows_with_dates: List[Tuple[datetime, dict]] = []
        invalid_rows = []

        detect_start_date = not start_date
        if detect_start_date:
            start_date = datetime.max

        for row in reader:
            row_date = parse_date(row[date_col])
            if not row_date:
                invalid_rows.append(row)
                continue

            rows_with_dates.append((row_date, row))
            if detect_start_date and row_date < start_date:
                start_date = row_date

        LOG.info('Finished reading input rows')
        LOG.info('Valid rows: %s', len(rows_with_dates))
        LOG.info('Invalid rows: %s', len(invalid_rows))

        LOG.info('Generating and writing cumulative rows')
        writer = CumulativeCSVWriter(
            output_file, reader.fieldnames, date_col, start_date, TODAY
        )
        writer.write_rows(rows_with_dates)

    LOG.info('Finished processsing cumulative data')
    return 0


if __name__ == '__main__':
    sys.exit(main())
