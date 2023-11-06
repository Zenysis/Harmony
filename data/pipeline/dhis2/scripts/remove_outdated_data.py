#!/usr/bin/env python

import importlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from typing import Sequence, Tuple

from pylib.base.flags import Flags

from data.pipeline.dhis2.data_date_ranges import (
    generate_weekly_periods,
    generate_quarterly_periods,
    generate_six_monthly_periods,
    generate_monthly_periods,
    generate_daily_periods,
    generate_yearly_periods,
)
from data.pipeline.dhis2.date_periods import DHIS2Periods
from data.pipeline.util import list_files_in_dir
from log import LOG


CLEANING_LOGING_MESSAGE = "Cleaning out %s"


def validate_format(date_str: str, date_format: str):
    '''Given a date string and a date format, this function validates that the
    date-string is a valid date.

    args
    ------
    date_str: A string with date information
    date_format: A string a format specifier in which to validate the date.
    '''
    try:
        datetime.strptime(date_str, date_format)
        return True
    except ValueError:
        return False


def get_periods_from_filename(
    filename: str, suffix: str, prefix: str
) -> Tuple[str, str]:
    '''Given a filename, this function returns the start and end periods of the data in the file.'''

    range_str = filename.replace(suffix, "").replace(prefix, "")
    if "-" in range_str:
        start_period, end_period = range_str.split("-")
        return start_period, end_period
    return "", ""


def remove_duplicate_data_everywhere(directory, periods, prefix, suffix, lz4_errors):
    '''This function removes duplicate data from all the matching files in a directory
    for the selected periods.
    '''
    period_names = ['weekly', 'quarterly', 'six_monthly', 'monthly', 'daily', 'yearly']
    for period_name in period_names:
        old_dir_filename = os.path.join(
            directory,
            'previous_files',
            f'{prefix}{period_name}{suffix}',
        )
        remove_outdated_data_from_file(old_dir_filename, periods, lz4_errors=lz4_errors)


def remove_outdated_data_for_period(
    directory: str, dhis2_periods: DHIS2Periods, lz4_errors: str = 'raise'
):
    '''
    This function takes a folder with newly downloaded data and previously downloaded data.
    This then removes all the previously downloaded data within the same period as newly
    downloaded data.

    args
    ------
    directory: The path where the data is.
    dhis2_periods: A DHIS2Periods object that contains the periods of the data.
    lz4_errors: A string that specifies how to handle lz4 errors. Either 'Raise' or 'Ignore'.
    '''
    unmapped_filenames = []
    suffix = Flags.ARGS.suffix
    prefix = Flags.ARGS.prefix

    # pylint: disable=anomalous-backslash-in-string
    shard_by_indicator_pattern = re.compile(
        '([a-zA-Z\s_.\-():])+(\.[a-zA-Z0-9]{11})(\.csv\.lz4)$'
    )
    for filename in list_files_in_dir(directory, prefix, suffix):
        start_period, end_period = get_periods_from_filename(filename, suffix, prefix)
        if start_period and end_period:
            if 'W' in start_period:
                periods = list(
                    map(
                        lambda p: f',{p},',
                        generate_weekly_periods(start_period, end_period),
                    )
                )
                LOG.debug(CLEANING_LOGING_MESSAGE, periods)
                remove_duplicate_data_everywhere(
                    directory, periods, prefix, suffix, lz4_errors
                )

            elif 'Q' in start_period:
                periods = list(
                    map(
                        lambda p: f',{p},',
                        generate_quarterly_periods(start_period, end_period),
                    )
                )
                LOG.debug(CLEANING_LOGING_MESSAGE, periods)
                remove_duplicate_data_everywhere(
                    directory, periods, prefix, suffix, lz4_errors
                )
            elif 'S' in start_period:
                periods = list(
                    map(
                        lambda p: f',{p},',
                        generate_six_monthly_periods(start_period, end_period),
                    )
                )
                LOG.debug(CLEANING_LOGING_MESSAGE, periods)
                remove_duplicate_data_everywhere(
                    directory, periods, prefix, suffix, lz4_errors
                )

            elif validate_format(start_period, "%Y"):
                periods = list(
                    map(
                        lambda p: f',{p},',
                        generate_yearly_periods(start_period, end_period),
                    )
                )
                LOG.debug(CLEANING_LOGING_MESSAGE, periods)
                remove_duplicate_data_everywhere(
                    directory, periods, prefix, suffix, lz4_errors
                )
            elif validate_format(start_period, '%Y%m'):
                periods = list(
                    map(
                        lambda p: f',{p},',
                        generate_monthly_periods(start_period, end_period),
                    )
                )
                LOG.debug(CLEANING_LOGING_MESSAGE, periods)
                remove_duplicate_data_everywhere(
                    directory, periods, prefix, suffix, lz4_errors
                )
            elif validate_format(start_period, '%Y%m%d'):
                periods = list(
                    map(
                        lambda p: f',{p},',
                        generate_daily_periods(start_period, end_period),
                    )
                )
                LOG.debug(CLEANING_LOGING_MESSAGE, periods)
                remove_duplicate_data_everywhere(
                    directory, periods, prefix, suffix, lz4_errors
                )
        elif shard_by_indicator_pattern.match(filename):
            dataset_groups_path = Flags.ARGS.dataset_groups_path
            assert dataset_groups_path, "Path to dataset groups json must be added"
            group_id_key = Flags.ARGS.dataset_group_id_key
            with open(dataset_groups_path) as json_file:
                groups = {
                    g[group_id_key]: g["reporting_rate"] for g in json.load(json_file)
                }
                group_id = filename.replace(prefix, "").replace(suffix, "")
                periods = list(
                    map(
                        lambda p: f',{p},',
                        getattr(dhis2_periods, groups[group_id], []),
                    )
                )
                LOG.debug("Cleaning out %s in %s", periods, filename)
                old_dir_filename = os.path.join(
                    directory,
                    'previous_files',
                    f'{prefix}{group_id}{suffix}',
                )
                remove_outdated_data_from_file(
                    old_dir_filename, periods, lz4_errors=lz4_errors
                )
        else:
            unmapped_filenames.append(filename)
    LOG.info("Unmapped periods %s", unmapped_filenames)


def remove_outdated_data_for_indicators(
    directory: str, fetch_only: Sequence[str], lz4_errors: str = 'raise'
):
    '''This function will take a list of indicators and replace their data from the historically
    fetched data.

    Args
    -----
    directory: directory where the files are stored
    fetch_only: list of indicators to replace
    lz4_errors: how to handle lz4 errors. Options are 'raise', 'ignore'
    '''
    previous_files_dir = os.path.join(directory, 'previous_files')
    for filename in list_files_in_dir(
        previous_files_dir, Flags.ARGS.prefix, Flags.ARGS.suffix
    ):
        remove_outdated_data_from_file(
            os.path.join(previous_files_dir, filename),
            fetch_only,
            lz4_errors=lz4_errors,
        )


def remove_outdated_data_from_file(
    filename: str, keys: Sequence[str], lz4_errors: str = 'raise'
):
    '''
    This function removes outdated data from a file for data within certain periods

    args
    -----
    filename: file from which to remove data
    keys: periods or indicators to remove from file.
    lz4_errors: how to handle lz4 errors. Options are 'raise', 'ignore'
    '''

    # Check if the file exists. If it doesn't then we don't need to do anything.
    if not os.path.exists(filename):
        LOG.info("%s does not exist.", filename)
        return
    # First make sure that the file has some content in it otherwise lz4cat will fail
    if os.path.getsize(filename) <= 50:
        return
    command = ""
    new_filename = f'{filename.replace(".lz4", "").replace(".csv", "_cleaned.csv")}'
    for key in set(keys):
        command = f"{command} | grep -v '{key}'"

    command = f'lz4cat {filename} {command} > {new_filename}'
    try:
        subprocess.run(command, shell=True, check=True, capture_output=True)
        subprocess.run(f"rm -f {filename}", shell=True, check=True, capture_output=True)
        subprocess.run(
            f'lz4 {new_filename} {filename} -f',
            shell=True,
            check=True,
            capture_output=True,
        )
        subprocess.run(
            f"rm -f {new_filename}", shell=True, check=True, capture_output=True
        )
    except subprocess.CalledProcessError as err:
        LOG.error("%s %s", err, err.stderr.decode('utf8'))
        if lz4_errors == 'raise':
            raise err


def main():
    Flags.PARSER.add_argument(
        '--input_directory', type=str, required=True, help='The directory to work from'
    )

    Flags.PARSER.add_argument(
        '--prefix',
        type=str,
        required=False,
        default='fetched_data_',
        help="filename prefix",
    )

    Flags.PARSER.add_argument(
        '--suffix',
        type=str,
        required=False,
        default='.csv.lz4',
        help="filename extension",
    )

    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help="Path to api path",
    )

    Flags.PARSER.add_argument(
        '--dataset_groups_path',
        type=str,
        required=False,
        default='',
        help="Path to api path",
    )

    Flags.PARSER.add_argument(
        '--lz4_errors',
        type=str,
        required=False,
        default='raise',
        help="How to handle lz4 errors. Options are 'raise' or 'ignore'",
    )

    Flags.PARSER.add_argument(
        '--dataset_group_id_key',
        type=str,
        required=False,
        default='groupId',
        help="Which dictionary key to use from the --dataset_groups_path file to "
        "get the dataset id",
    )

    Flags.InitArgs()

    api_config_filepath = Flags.ARGS.api_config_filepath
    module_name = os.path.basename(api_config_filepath).replace('-', '_')
    spec = importlib.util.spec_from_loader(
        module_name,
        importlib.machinery.SourceFileLoader(module_name, api_config_filepath),
    )
    dhis2_api_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dhis2_api_module)

    fetch_only = getattr(dhis2_api_module, 'FETCH_ONLY', [])

    if fetch_only:
        remove_outdated_data_for_indicators(
            Flags.ARGS.input_directory, fetch_only, lz4_errors=Flags.ARGS.lz4_errors
        )
    else:
        remove_outdated_data_for_period(
            Flags.ARGS.input_directory,
            getattr(dhis2_api_module, 'DHIS2_PERIODS'),
            lz4_errors=Flags.ARGS.lz4_errors,
        )


if __name__ == "__main__":
    sys.exit(main())
