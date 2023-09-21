#!/usr/bin/env python
import datetime
import os
import sys
from typing import Optional

import pandas as pd
from pylib.base.flags import Flags

from util.file.ambiguous_file import AmbiguousFile


def compare(previous: str, current: str) -> pd.DataFrame:
    '''This function compares two csv and returns a dataframe with columns that are only
    in the new (current) csv that are not in the old (previous) csv.

    Args
    ----
        previous (str): path to csv file of the previous pipeline run
        current (str): path to csv of the current pipeline run

    Returns
    -------
        DataFrame with columns in current that are not in previous
    '''
    # TODO (Kenneth): Verify csv format report on error.
    with AmbiguousFile(previous) as previous_file, AmbiguousFile(
        current
    ) as current_file:
        left = pd.read_csv(previous_file)
        right = pd.read_csv(current_file)

    merge = pd.merge(left, right, how="outer", indicator="exists")
    diff = merge.loc[merge["exists"] == "right_only"]
    diff.drop(columns="exists", inplace=True)
    return diff


def get_previous_date(date: str, number_of_days: int = 1) -> str:
    '''This function will return the date of the day a `number_of_days` back from `date`

    Args
    ----
        date (str): Date string to calculate days back from in format "%Y%m%d"
        number_of_days (int): Number of days to calculate back from `date`

    Returns
    -------
        String: Calculated date in the format "%Y%m%d"
    '''
    date = datetime.datetime.strptime(date, "%Y%m%d")
    yesterday = date - datetime.timedelta(number_of_days)
    return yesterday.strftime("%Y%m%d")


def get_most_recent_previous_pipeline_run(data_path: str) -> Optional[str]:
    '''This function will get the path to the previous pipeline given the path to the
    current pipeline run by looking for the nearest previous date

    Args
    ----
        data_path (str): Path to current pipeline run

    Returns
    -------
        String: Path to the previous pipeline run
    '''
    pipeline_dir, filename = os.path.split(data_path)
    parent_dir, pipeline_date = os.path.split(pipeline_dir)
    dates = sorted(os.listdir(parent_dir))
    pipeline_date_index = dates.index(pipeline_date)
    if pipeline_date_index > 0:
        previous_date = dates[pipeline_date_index - 1]
        previous_path = os.path.join(parent_dir, previous_date, filename)
        if os.path.exists(previous_path):
            return previous_path
    return None


def get_previous_path(data_path: str) -> str:
    '''This function will get the path to the previous pipeline given the path to the
    current pipeline run by checking if there is `prev` directory or a previous a date.

    Args
    ----
        data_path (str): Path to current pipeline run

    Returns
    -------
        String: Path to the previous pipeline run
    '''
    pipeline_dir, filename = os.path.split(data_path)
    prev_folder = os.path.join(pipeline_dir, "prev")
    if os.path.exists(prev_folder):
        return os.path.join(prev_folder, filename)
    return get_most_recent_previous_pipeline_run(data_path)


def create_report(
    data_path: str, output_report: str, output_sample: str, sample_size: int = 100
):
    '''This function compares current data with previous data and writes the report and
    sample data to the disk

    Args
    ----
        data_path (str): Path to current data to be compared
        output_report (str): Path to where the output report will be written
        output_sample (str): Path to where the output sample will be written
        sample_size (int): Size of sample to be written
    '''
    previous = get_previous_path(data_path)
    if not previous:
        return
    diff = compare(previous, data_path)
    diff.describe().to_html(buf=output_report)
    sample_size = min(sample_size, len(diff))
    if not diff.empty:
        diff.sample(sample_size).sort_index().to_csv(
            path_or_buf=output_sample, index=False
        )
    else:
        diff.to_csv(path_or_buf=output_sample, index=False)


def main():
    Flags.PARSER.add_argument(
        "--data_path",
        type=str,
        required=True,
        help="Path to the file that has the current data we are going to compare",
    )
    Flags.PARSER.add_argument(
        "--output_report",
        type=str,
        required=True,
        help="Path to the html report summary",
    )
    Flags.PARSER.add_argument(
        "--output_sample",
        type=str,
        required=True,
        help="Path to write the sample diff csv",
    )

    Flags.PARSER.add_argument(
        "--sample_size",
        type=int,
        required=False,
        default=100,
        help="Number of rows in sample to export. Defaults to 100",
    )

    Flags.InitArgs()
    create_report(
        Flags.ARGS.data_path,
        Flags.ARGS.output_report,
        Flags.ARGS.output_sample,
        sample_size=Flags.ARGS.sample_size,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
