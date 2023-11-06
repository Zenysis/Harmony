#!/usr/bin/env python
import argparse
import json
import os
import subprocess
import sys
from typing import Dict

from data.pipeline.dhis2.scripts.update_dhis2_data import update_dhis2_data
from data.pipeline.util import list_files_in_dir
from log import LOG


def data_element_map(datasets_file):
    data_elements = {}
    with open(datasets_file, 'r') as f:
        datasets = json.load(f)
        for dataset, des in datasets.items():
            for de in des:
                data_elements[de] = dataset
    return data_elements


def get_data_elements_from_raw_datasets(dataset: Dict):
    return [de['dataElement']['id'] for de in dataset['dataSetElements']]


def all_datasets(raw_dhis_file):
    with open(raw_dhis_file, 'r') as f:
        raw_dhis = json.load(f)
        return raw_dhis['dataSets']


def clean_unreadable_datasets(raw_dhis_file, datasets_file, output_path, input_path):
    data_elements = data_element_map(datasets_file)
    datasets = all_datasets(raw_dhis_file)
    seen = set()
    for dataset in datasets:
        if not dataset['access']['data']['read']:
            d_data_elements = get_data_elements_from_raw_datasets(dataset)
            old_file_path = os.path.join(
                input_path, f"fetched_data_{dataset['id']}.csv.gz"
            )
            if not os.path.exists(old_file_path):
                LOG.info("File %s does not exist", old_file_path)
                continue
            for de in d_data_elements:
                dest_dataset = data_elements.get(de)
                if dest_dataset and de not in seen:
                    seen.add(de)
                    LOG.info(
                        "Moving data element %s from dataset %s to dataset %s",
                        de,
                        dataset['id'],
                        dest_dataset,
                    )
                    new_file_path = os.path.join(
                        output_path, f"fetched_data_{dest_dataset}.csv"
                    )
                    if not os.path.exists(new_file_path):
                        subprocess.check_output(
                            f"echo 'dataElement,period,orgUnit,categoryOptionCombo,value' > {new_file_path}",
                            shell=True,
                        )
                    subprocess.check_output(
                        f"gunzip -c {old_file_path} | {{ grep -q {de} || :;}} >> {new_file_path}",
                        shell=True,
                    )
            subprocess.check_output(f"rm {old_file_path}", shell=True)


def merge_moved_datasets(old_data_path, new_data_path, output_path):
    for filename in list_files_in_dir(old_data_path, prefix="fetched_data_"):
        LOG.info("Merging files with %s", filename)
        old_file_path = os.path.join(old_data_path, filename)
        subprocess.check_output(f"gzip -f {old_file_path}", shell=True)

        update_dhis2_data(old_data_path, new_data_path, output_path, f"{filename}.gz")


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean unreadable datasets")
    parser.add_argument(
        "--raw_dhis_file",
        type=str,
        help="Path to the raw dhis file",
    )
    parser.add_argument(
        "--datasets_file",
        type=str,
        help="Path to the datasets file",
    )
    parser.add_argument(
        "--input_data_path",
        type=str,
        help="Path to the data",
    )
    parser.add_argument(
        "--output_data_path",
        type=str,
        help="Path to the data",
    )

    args = parser.parse_args()
    clean_unreadable_datasets(
        args.raw_dhis_file,
        args.datasets_file,
        args.output_data_path,
        args.input_data_path,
    )
    merge_moved_datasets(
        args.output_data_path, args.input_data_path, args.input_data_path
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
