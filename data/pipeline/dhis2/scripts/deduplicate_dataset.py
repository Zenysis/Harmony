#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import argparse
import json
import os
import subprocess
import sys
from typing import List

from data.pipeline.dhis2.scripts.common import COMPRESSION_MAP, CSV_DATA_FORMAT
from data.pipeline.util import list_files_in_dir
from log import LOG

DATA_PREFIX = "fetched_data_"
RESAMPLE_DATA_PREFIX = "resample_fetched_data_"


def deduplicate_dataset(
    dataset_file: str,
    data_elements: List[str],
    compression: str,
    resample: bool = False,
) -> None:
    '''Grep out only the data elements we want to keep, then recompress the file.'''
    LOG.info("Deduplicating or extracting resample data for %s", dataset_file)
    uncompressed_filename = os.path.splitext(dataset_file)[0]
    if resample:
        uncompressed_filename = uncompressed_filename.replace(
            DATA_PREFIX, RESAMPLE_DATA_PREFIX
        )
    deduplicate_command = (
        f"echo dataElement,period,orgUnit,categoryOptionCombo,value  > {uncompressed_filename} && "
        f"{COMPRESSION_MAP[compression]['cat']} {dataset_file} | "
        f"grep -E '{'|'.join(data_elements)}'  >> {uncompressed_filename} || true"
    )
    compress_command = (
        f"{COMPRESSION_MAP[compression]['compress']} {uncompressed_filename}"
    )
    subprocess.check_output(deduplicate_command, shell=True)
    subprocess.check_output(compress_command, shell=True)
    LOG.info("Deduplicating or extracting resample data finished for %s", dataset_file)


def deduplicate_datasets(
    new_files_path: str,
    dataset_file: str,
    compression: str,
    resample: bool = False,
    clear_unknown: bool = False,
) -> None:
    '''Given a file with dataset names and unique data elements, deduplicate the data in the
    new_files_path.'''

    new_files = list_files_in_dir(new_files_path, DATA_PREFIX)
    LOG.info("Found %d new files. Resample is %s", len(new_files), resample)
    datasets_map = {
        filename[len(DATA_PREFIX) : -len(f"{CSV_DATA_FORMAT}{compression}")]: filename
        for filename in new_files
    }
    with open(dataset_file, 'r') as dataset_json_file:
        all_datasets = json.load(dataset_json_file)

    for dataset, filename in datasets_map.items():
        data_elements = all_datasets.get(dataset)
        file_path = os.path.join(new_files_path, filename)
        if data_elements is None:
            LOG.info(
                "No data elements found for dataset %s. Resample is %s",
                dataset,
                resample,
            )
            if clear_unknown:
                LOG.info(
                    "Clearing unknown dataset %s. This is usually a dataset with only "
                    "resample indicators",
                    dataset,
                )
                subprocess.check_output(f"rm -f {file_path}", shell=True)
            continue
        deduplicate_dataset(file_path, data_elements, compression, resample=resample)


def separate_resample_data(
    new_file_path: str, input_resample_datasets_filepath: str, compression: str
) -> None:
    LOG.info("Separating resample data")
    deduplicate_datasets(
        new_file_path, input_resample_datasets_filepath, compression, resample=True
    )


def main() -> int:
    '''DHIS2 returns data for all data elements in a dataset. But some data elements are in more
    than one dataset. We need to manually deduplicate the datasets after fetching the data.'''

    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--new_file_path', type=str, required=True, help='Dataset file to deduplicate'
    )
    parser.add_argument(
        '--input_datasets_filepath',
        type=str,
        required=True,
        help='File with dataset and unique data elements',
    )
    parser.add_argument(
        '--input_resample_datasets_filepath',
        type=str,
        required=False,
        default=None,
        help='File with dataset and unique resample data elements',
    )
    parser.add_argument(
        '--compression',
        type=str,
        default=".gz",
        required=False,
        help="Compression to use to update data.",
    )
    args = parser.parse_args()

    if args.input_resample_datasets_filepath:
        separate_resample_data(
            args.new_file_path, args.input_resample_datasets_filepath, args.compression
        )

    deduplicate_datasets(
        args.new_file_path,
        args.input_datasets_filepath,
        args.compression,
        clear_unknown=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
