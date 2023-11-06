#!/usr/bin/env python
import glob
import json
import os.path
import re
import shutil
import subprocess
import sys
from typing import List

from pylib.base.flags import Flags

from data.pipeline.util import list_files_in_dir
from log import LOG

REPORTING_RATE_PATTERN_MAP = {
    'yearly': '^%s([12]\d{3})-([12]\d{3})\.csv\.lz4',
    'six_monthly': '^%s([12]\d{3})S.+-([12]\d{3})S.+\.csv\.lz4',
    'weekly': '^%s([12]\d{3})W.+-([12]\d{3})W.+\.csv\.lz4',
    'quarterly': '^%s([12]\d{3})Q.+-([12]\d{3})Q.+\.csv\.lz4',
    'monthly': '^%s([12]\d{3}(0[1-9]|1[0-2]))-([12]\d{3}(0[1-9]|1[0-2]))\.csv\.lz4',
    'daily': '^%s([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))-([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))\.csv\.lz4',
}

MERGED_FILES_DIR = 'merged_files'

PREVIOUS_FILES_DIR = 'previous_files'


def merge_files_bash_command(files_to_merge: List[str], merged_filename: str) -> str:
    '''This function generates the unix command that merges files'''

    return f"cat {' '.join(files_to_merge)} > {merged_filename}"


def merge_new_files(reporting_rate: str, input_dir: str, prefix: str = 'fetched_data_'):
    '''Merge files of the same reporting rate into one file'''

    pattern = re.compile(REPORTING_RATE_PATTERN_MAP[reporting_rate] % prefix)
    files_to_merge = [
        filename
        for filename in list_files_in_dir(input_dir, prefix, '.csv.lz4')
        if pattern.match(filename)
    ]
    LOG.info(f"Found {len(files_to_merge)} {reporting_rate} files to merge")
    if files_to_merge:
        LOG.info(f"Merging files for {reporting_rate} reporting rate")
        merged_files_dir = os.path.join(input_dir, MERGED_FILES_DIR)
        command = merge_files_bash_command(
            files_to_merge, f'{merged_files_dir}/{prefix}{reporting_rate}.csv.lz4'
        )
        subprocess.run(command, shell=True, check=True, capture_output=True)


def move_to_out_dir(
    reporting_rate: str, input_dir: str, out_dir: str, prefix: str = 'fetched_data_'
):
    '''Move merged files into the PIPELINE_OUT directory. Only move files with size greater than 0'''
    filenames = [
        f'{input_dir}/{directory}/{prefix}{reporting_rate}.csv.lz4'
        for directory in [MERGED_FILES_DIR, PREVIOUS_FILES_DIR]
        if os.path.isfile(f'{input_dir}/{directory}/{prefix}{reporting_rate}.csv.lz4')
        and os.path.getsize(f'{input_dir}/{directory}/{prefix}{reporting_rate}.csv.lz4')
        > 0
    ]
    if filenames:
        out_path = f'{out_dir}/{prefix}{reporting_rate}.csv.lz4'
        LOG.info(
            f"Moving files for {reporting_rate} ({filenames}) reporting rate to {out_path}"
        )
        subprocess.run(
            merge_files_bash_command(filenames, out_path),
            shell=True,
            check=True,
            capture_output=True,
        )


def main():
    Flags.PARSER.add_argument(
        '--input_dir',
        type=str,
        required=True,
        help='Location of files to merge.',
    )

    Flags.PARSER.add_argument(
        '--output_dir',
        type=str,
        required=True,
        help='Location to put merged files.',
    )

    Flags.PARSER.add_argument(
        '--prefix',
        type=str,
        required=False,
        default='fetched_data_',
        help='Prefix for files to merge',
    )

    Flags.PARSER.add_argument(
        '--dataset_groups_path',
        type=str,
        required=False,
        default='',
        help="Path to api path",
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

    input_dir = Flags.ARGS.input_dir
    prefix = Flags.ARGS.prefix
    output_dir = Flags.ARGS.output_dir

    if Flags.ARGS.dataset_groups_path:
        for filename in glob.glob(f"{input_dir}/{prefix}*"):
            shutil.copy(filename, f'{input_dir}/merged_files')
        with open(Flags.ARGS.dataset_groups_path) as json_file:
            group_id_key = Flags.ARGS.dataset_group_id_key
            for indicator in {g[group_id_key] for g in json.load(json_file)}:
                move_to_out_dir(indicator, input_dir, output_dir, prefix=prefix)

    LOG.info("Starting the file Merging and moving")
    for reporting_rate in REPORTING_RATE_PATTERN_MAP:
        merge_new_files(reporting_rate, input_dir, prefix=prefix)
        move_to_out_dir(reporting_rate, input_dir, output_dir, prefix=prefix)

    LOG.info("Completed file merging and moving")


if __name__ == "__main__":
    sys.exit(main())
