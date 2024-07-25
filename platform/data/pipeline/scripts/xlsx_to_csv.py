#!/usr/bin/env python

from builtins import str
from builtins import range
import csv
import re
import os
import sys

import xlrd

from pylib.base.flags import Flags

NUMERIC_PATTERN = re.compile('([0-9]+)(\.[0-9]*)?$')
PERCENTAGE_PATTERN = re.compile('([0-9]+)(\.[0-9]*)? ?%$')

# Convert numeric and percentage values into their float representation.
# Leave non-numeric values alone.
def clean_value(raw_value):
    if NUMERIC_PATTERN.match(raw_value):
        return float(raw_value)
    if PERCENTAGE_PATTERN.match(raw_value):
        return float(raw_value.replace('%', '')) / 100.0
    return raw_value


def clean_entry(entry):
    # str() cast is necessary because some entries are floats
    cleaned = re.sub('\s+', ' ', str(entry)).replace('\n', '').replace('\r', '').strip()
    return clean_value(cleaned)


def csv_from_excel(excel_file, output_dir):
    base_filename = os.path.splitext(os.path.basename(excel_file))[0].strip()
    if base_filename[0] == '~':
        print(f'Skipping excel temporary file: {excel_file}')
        return

    print(f'Processing {excel_file}')
    workbook = xlrd.open_workbook(excel_file)
    all_worksheets = workbook.sheet_names()
    for worksheet_name in all_worksheets:
        # Export each sheet as a CSV file.
        worksheet = workbook.sheet_by_name(worksheet_name)

        filename = f'{base_filename}_{worksheet_name}.csv'
        full_path = os.path.join(output_dir, filename)

        with open(full_path, 'w') as csv_file:
            wr = csv.writer(csv_file, quoting=csv.QUOTE_ALL)

            # Time entries are in the 0th column
            start_col = 0
            for rownum in range(worksheet.nrows):
                row = []

                # The first column containing data to store
                value_start = 0
                try:
                    result = xlrd.xldate_as_tuple(
                        int(worksheet.row_values(rownum)[start_col]), workbook.datemode
                    )
                    (year, month, day) = result[:3]
                    row.append('%04d-%02d-%02d' % (year, month, day))
                    value_start = 1
                except ValueError:
                    # If no date is found write the row without a formated date
                    # process_indicators.py will look for alternative dates
                    pass

                for entry in worksheet.row_values(rownum)[value_start:]:
                    row.append(clean_entry(entry))

                wr.writerow(row)

    print(f'\tWrote {len(all_worksheets)} CSVs')


def main():
    Flags.PARSER.add_argument(
        '--input_file', type=str, required=True, help='Excel file to convert'
    )
    Flags.PARSER.add_argument(
        '--output_dir',
        type=str,
        default='',
        help='Optional output directory to store csvs',
    )
    Flags.InitArgs()

    input_file = Flags.ARGS.input_file
    output_dir = Flags.ARGS.output_dir or os.path.dirname(input_file)

    csv_from_excel(input_file, output_dir)
    return 0


if __name__ == '__main__':
    sys.exit(main())
