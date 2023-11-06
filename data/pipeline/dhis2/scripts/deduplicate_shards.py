#!/usr/bin/env python
'''
If a DHIS2 data fetch only pulled the most recent N months, run this step to
merge the new data with the record of historical data stored in Minio.
The scripts uses the most recent data values to override any duplication.

Sample usage:
./deduplicate_shards.py \
  --input_file_prefix='fetched_data_' \
  --input_file_suffix='.csv.lz4' \
  --old_input_file_directory="${PIPELINE_TMP_DIR}/historical" \
  --new_input_file_directory="${PIPELINE_TMP_DIR}" \
  --output_file_directory="${PIPELINE_OUT_DIR}"
'''

import os
import sys

from typing import List, Dict, Set
from datetime import datetime
from dateutil.relativedelta import relativedelta
from os import listdir
from os.path import isfile, join
from shutil import copy
from collections import defaultdict
from data.pipeline.dhis2.date_periods import (
    get_period_reporting_rate,
    convert_dhis2_period_to_datetime,
    get_adjacent_date,
    get_dates_in_range,
    convert_datetime_to_dhis2_period,
    MONTHLY_RATE,
)
from log import LOG
from pylib.base.flags import Flags
from util.file.compression.lz4 import LZ4Reader, LZ4Writer


def _date_intersects(date: datetime, other_range: List[datetime]):
    other_start, other_end = other_range
    LOG.info(f'Looking for intersection of {date} in ({other_start}, {other_end})')
    if date >= other_start and date <= other_end:
        LOG.info('intersection found')
        return True
    LOG.info('intersection NOT found')
    return False


def _parse_date_range(filename: str, prefix: str, suffix: str) -> List[str]:
    '''
    Parse date information from stripped file name.
    Should follow pattern <start>-<end> or <start>_<end>.
    '''
    range_str = filename.replace(prefix, '').replace(suffix, '')
    if '_' in range_str:
        return range_str.split('_')
    return range_str.split('-')


def get_ranges_by_reporting_rate(
    file_directory: str, output_file_directory: str, prefix: str, suffix: str
) -> Dict[str, Set[List]]:
    '''
    For each of the new files, get date range of data in that file
    and group the ranges by reporting rate (found in file name).
    '''
    grouped_files = defaultdict(set)

    for file in listdir(file_directory):
        file_path = join(file_directory, file)
        output_file_path = join(output_file_directory, file)
        if isfile(file_path) and file.startswith(prefix) and file.endswith(suffix):
            copy(file_path, output_file_path)

            start_str, end_str = _parse_date_range(file, prefix, suffix)
            reporting_rate = get_period_reporting_rate(start_str)
            start_period, end_period = (
                convert_dhis2_period_to_datetime(start_str, reporting_rate),
                convert_dhis2_period_to_datetime(end_str, reporting_rate),
            )
            if reporting_rate == MONTHLY_RATE:
                # Set end to last day of month
                end_period = end_period + relativedelta(day=31)
            grouped_files[reporting_rate].add((start_period, end_period))
    return grouped_files


def find_and_remove_old_duplicated_data(
    file_directory: str,
    grouped_ranges: Dict[str, set[List[datetime]]],
    prefix: str,
    suffix: str,
    output_file_directory: str,
) -> None:
    '''
    For each historical file, check if its start or end date intersects with any of the
    new files' date ranges. If an intersection is detected, find the range of the overlap, add
    each overlapping periods to the dates_to_delete set, and adjust the range of the
    historical file to not overlap with that new range.
    '''
    for file in listdir(file_directory):
        file_path = join(file_directory, file)
        if isfile(file_path) and file.startswith(prefix) and file.endswith(suffix):
            start_str, end_str = _parse_date_range(file, prefix, suffix)
            reporting_rate = get_period_reporting_rate(start_str)
            start_period, end_period = (
                convert_dhis2_period_to_datetime(start_str, reporting_rate),
                convert_dhis2_period_to_datetime(end_str, reporting_rate),
            )

            dates_to_delete = set()
            # Check all new data for overlaps with `file` date range
            for new_start, new_end in grouped_ranges[reporting_rate]:
                if _date_intersects(start_period, (new_start, new_end)):
                    dates_to_delete.update(
                        set(get_dates_in_range(start_period, new_end, reporting_rate))
                    )
                    start_period = get_adjacent_date(new_end, reporting_rate, diff=1)
                if _date_intersects(end_period, (new_start, new_end)):
                    dates_to_delete.update(
                        set(get_dates_in_range(new_start, end_period, reporting_rate))
                    )
                    end_period = get_adjacent_date(new_start, reporting_rate, diff=-1)
            if start_period < end_period:
                output_start_str = convert_datetime_to_dhis2_period(
                    start_period, reporting_rate
                )
                output_end_str = convert_datetime_to_dhis2_period(
                    end_period, reporting_rate
                )
                output_file_name = (
                    prefix + f'{output_start_str}-{output_end_str}' + suffix
                )
                output_file_path = join(output_file_directory, output_file_name)
                delete_rows_from_file(file_path, output_file_path, dates_to_delete)


def delete_rows_from_file(
    input_file_path: str, output_file_path: str, dates_to_delete: List[str]
) -> None:
    '''Remove all rows from the file where the date is in the dates_to_delete'''

    # We need to make sure the date string is representitive of the entire cell and is not
    # a substring of a cell ie removing 2012W1 should not remove rows 2012W11 & 2012W12
    if not dates_to_delete:
        LOG.info(
            f'No overlap found for {input_file_path}: copying to {output_file_path}'
        )
        copy(input_file_path, output_file_path)
        return 0
    with LZ4Reader(input_file_path) as input_file, LZ4Writer(
        output_file_path
    ) as output_file:
        LOG.info(
            f'Starting delete_rows_from_file for file: {input_file_path} into {output_file_path}'
        )
        line_count, removed_count, kept_count = 0, 0, 0
        for line in input_file:
            date_exists = False
            line_count += 1
            for date in dates_to_delete:
                if date in line:
                    date_exists = True
            if not date_exists:
                kept_count += 1
                output_file.write(line)
            else:
                removed_count += 1
    LOG.info(
        f'DELETED {removed_count} from {input_file_path} kept: {kept_count} out of {line_count} total lines'
    )
    if kept_count < 2:
        # We are just writing the header and therefore should not keep the file
        os.remove(output_file_path)


def main():
    Flags.PARSER.add_argument(
        '--old_input_file_directory',
        type=str,
        required=True,
        help='Location of historical DHIS2 shards pulled from minio',
    )
    Flags.PARSER.add_argument(
        '--new_input_file_directory',
        type=str,
        required=True,
        help='Location of newly-fetched DHIS2 data.',
    )
    Flags.PARSER.add_argument(
        '--output_file_directory',
        type=str,
        required=True,
        help='Directory to copy deduplicated files to.',
    )
    Flags.PARSER.add_argument(
        '--input_file_prefix',
        type=str,
        required=True,
        help='Shared naming convention (prefix) between input files.'
        'Used to select files to deduplicate.',
    )
    Flags.PARSER.add_argument(
        '--input_file_suffix',
        type=str,
        required=True,
        help='Input file type. Used to select files to deduplicate.',
    )
    Flags.InitArgs()
    input_file_prefix = Flags.ARGS.input_file_prefix
    input_file_suffix = Flags.ARGS.input_file_suffix
    new_input_file_directory = Flags.ARGS.new_input_file_directory
    old_input_file_directory = Flags.ARGS.old_input_file_directory
    output_file_directory = Flags.ARGS.output_file_directory

    # For each of the recent fetched_data files, extract the period range of its data
    grouped_ranges = get_ranges_by_reporting_rate(
        new_input_file_directory,
        output_file_directory,
        input_file_prefix,
        input_file_suffix,
    )
    # For each of the historical files, check if its data intersects with one of the
    # recent fetched_data files ranges (ie data from the most recent pull).
    # Deduplicate all intersections and write to output_file_directory.
    find_and_remove_old_duplicated_data(
        old_input_file_directory,
        grouped_ranges,
        input_file_prefix,
        input_file_suffix,
        output_file_directory,
    )

    return 0


if __name__ == '__main__':
    sys.exit(main())
