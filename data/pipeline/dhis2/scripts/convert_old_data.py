#!/usr/bin/env python

# mypy: disallow_untyped_defs=True
'''This script converts csv files fetched from DHIS2's `analytics/rawData` endpoint
 and converts them to a format similar to that returned by the `dataValueSet` endpoint.

 The headers for the old format: Data,Category option combo,Organisation unit,,Period start date,
 Period end date,Value
 The headers for the new format: dataElement, period, orgUnit, categoryOptionCombo, value

 The empty column name in the old format is for Period.

 The data is also stored by dataset which is consistent with how data from the `dataValueSet`
    endpoint is stored.
 '''
import argparse
import csv
import json
import os
import subprocess
import sys
from typing import Dict, List, Any

from data.pipeline.dhis2.scripts.common import COMPRESSION_MAP, CSV_DATA_FORMAT
from data.pipeline.util import list_files_in_dir
from log import LOG
from util.file.ambiguous_file import AmbiguousFile

FIELDS_MAP = {
    'Data': 'dataElement',
    '': 'period',
    'Organisation unit': 'orgUnit',
    'Category option combo': 'categoryOptionCombo',
    'Value': 'value',
}

# Intentionally naming this 11 characters to match DHIS2 UID rule
NO_DATASET_ID = "xNODATASETx"


class SafelyOpenFiles:
    '''
    This class will help us keep a lot of files safely open until we are done with them.
    '''

    def __init__(self, files: Dict):
        self._files = files

    def __enter__(self) -> Dict:
        return self._files

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        self._close_files()

    def _close_files(self) -> None:
        for _file in self._files.values():
            open_file = _file.get("_file")
            if open_file:
                open_file.close()


def is_header(row: dict) -> bool:
    '''We know that a row is a header when all the values are equal to the keys.'''
    return all(key == value for key, value in row.items())


def read_datasets(dataset_file: str) -> Dict[str, List[str]]:
    '''Read the dataset file and return a dictionary of datasets and data elements'''
    with open(dataset_file, 'r') as json_file:
        return json.load(json_file)


def flatten_datasets(dataset_file: str) -> Dict[str, str]:
    '''Flatten the dataset file. We get a dictionary of datasets and convert into a dictionary of
    data elements as keys'''
    dataset_dict = read_datasets(dataset_file)
    data_elements_dict = {}
    for dataset, data_elements in dataset_dict.items():
        for data_element in data_elements:
            data_elements_dict[data_element] = dataset
    return data_elements_dict


def get_dataset_file(
    dataset_files: dict,
    dataset: str,
    new_data_path: str,
    reporting_rate: str,
    prefix: str,
) -> Dict:
    '''Since we always have multiple files open at a time, this function returns the csv writer for
    a dataset. If the file is not open, it opens it and returns the writer.'''
    dataset_file = dataset_files.get(dataset)
    if not dataset_file:
        path = os.path.join(
            new_data_path, f"{prefix}{dataset}.{reporting_rate}{CSV_DATA_FORMAT}"
        )
        # pylint: disable=consider-using-with
        to_file = open(path, 'a')
        writer = csv.DictWriter(to_file, fieldnames=list(FIELDS_MAP.values()))
        writer.writeheader()
        dataset_file = {"path": path, "writer": writer, "_file": to_file}
        dataset_files[dataset] = dataset_file
    return dataset_file


def compress_files(filenames: List[str], compression: str) -> None:
    compression_dict = COMPRESSION_MAP[compression]
    for dataset_file in filenames:
        command = f"{compression_dict['compress']} {dataset_file}"
        subprocess.check_output(command, shell=True)


def merge_files(
    datasets: List[str],
    process_path: str,
    output_path: str,
    prefix: str,
    compression: str,
) -> None:
    for dataset in datasets:
        process_file_pattern = os.path.join(
            process_path, f"{prefix}{dataset}.*{CSV_DATA_FORMAT}{compression}"
        )
        output_file_path = os.path.join(
            output_path, f"{prefix}{dataset}{CSV_DATA_FORMAT}{compression}"
        )
        LOG.info("Merging %s into %s", process_file_pattern, output_file_path)
        merge_command = f"cat {process_file_pattern} > {output_file_path}"
        try:
            subprocess.run(merge_command, shell=True, check=True)
        except subprocess.CalledProcessError as e:
            LOG.error(e)
            # We should remove the cat output if the merge command failed. This is going to be
            # because the file did not exist.
            subprocess.run(f"rm -rf {output_file_path}", shell=True, check=True)


def convert_file(
    filename: str, new_data_path: str, dataset_file: str, prefix: str, compression: str
) -> None:
    reporting_rate = os.path.basename(filename)[
        len(f"{prefix}") : -len(f"{CSV_DATA_FORMAT}{os.path.splitext(filename)[1]}")
    ]
    LOG.info("Converting %s", filename)
    missing_datasets = set()
    with SafelyOpenFiles({}) as dataset_files:
        flat_datasets = flatten_datasets(dataset_file)
        with AmbiguousFile(filename) as old_csv_file:
            reader = csv.DictReader(old_csv_file)
            for row in reader:
                if is_header(row):
                    continue
                data = row['Data']
                dataset = flat_datasets.get(data)
                if not dataset:
                    missing_datasets.add(data)
                    dataset = NO_DATASET_ID
                writer = get_dataset_file(
                    dataset_files, dataset, new_data_path, reporting_rate, prefix
                )["writer"]
                writer.writerow({value: row[key] for key, value in FIELDS_MAP.items()})

    compress_files([_file["path"] for _file in dataset_files.values()], compression)
    LOG.warning("These dataElements don't belong to any datasets: %s", missing_datasets)
    LOG.info("Done converting %s", filename)


def convert_files(
    old_data_path: str,
    new_data_path: str,
    dataset_file: str,
    prefix: str,
    compression: str,
) -> None:
    filenames = [
        os.path.join(old_data_path, fn)
        for fn in list_files_in_dir(old_data_path, prefix=prefix)
    ]
    LOG.info("Found %s old format files to convert", len(filenames))
    process_path = os.path.join(old_data_path, "temp")
    os.makedirs(process_path, exist_ok=True)
    for filename in filenames:
        convert_file(filename, process_path, dataset_file, prefix, compression)
    merge_files(
        list(read_datasets(dataset_file).keys()) + [NO_DATASET_ID],
        process_path,
        new_data_path,
        prefix,
        compression,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Convert old DHIS2 data to the new format'
    )
    parser.add_argument(
        '--old_data_path',
        type=str,
        help='Path to the old data',
    )
    parser.add_argument(
        '--new_data_path',
        type=str,
        help='Path to the new data',
    )
    parser.add_argument(
        '--dataset_file',
        type=str,
        help='Path to the dataset file',
    )
    parser.add_argument(
        '--prefix',
        type=str,
        required=False,
        default='fetched_data_',
        help='Prefix of the data filename',
    )
    parser.add_argument(
        '--compression',
        type=str,
        required=False,
        default='.gz',
        help='Compression for the output data',
    )

    args = parser.parse_args()
    convert_files(
        args.old_data_path,
        args.new_data_path,
        args.dataset_file,
        args.prefix,
        args.compression,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
