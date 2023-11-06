#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import os
import subprocess
import sys
from typing import Set, List, Union, Optional

import dask.dataframe as dd
import pandas as pd

from pylib.base.flags import Flags

from data.pipeline.util import list_files_in_dir
from log import LOG

FILE_PREFIX = ("fetched_data_", "resample_fetched_data_")

MERGE_COLUMNS = ["dataElement", "period", "orgUnit", "categoryOptionCombo"]
COLUMNS_TO_DROP = ["value_x", "value_y", "_merge"]

DATA_ELEMENTS_DATA_TYPES = {
    "dataElement": "category",
    "period": "category",
    "orgUnit": "category",
    "categoryOptionCombo": "category",
    "value": "float64",
}

EVENTS_DATA_TYPES = {
    "id": "string[pyarrow]",
    "eventDate": "string[pyarrow]",
    "orgUnit": "string[pyarrow]",
    "program": "string[pyarrow]",
    "dataValues": "string[pyarrow]",
}

ENROLLMENTS_DATA_TYPES = {
    "id": "string[pyarrow]",
    "enrollmentDate": "string[pyarrow]",
    "orgUnit": "string[pyarrow]",
    "program": "string[pyarrow]",
}

DASK_COMPRESSION = {'.gz': 'gzip', '.bz2': 'bz2', '.xz': 'xz'}

DASK_BLOCK_SIZE = "100MB"


def get_data_types(filename: str) -> dict:
    '''This function returns the data types for the columns in the file'''
    if "events" in filename:
        return ENROLLMENTS_DATA_TYPES
    if "enrollments" in filename:
        return EVENTS_DATA_TYPES
    return DATA_ELEMENTS_DATA_TYPES


def unchanged_files(old_path: str, new_path: str) -> Set[str]:
    '''This function returns a list of files that are in the old_path but not in new_path'''

    old_files = list_files_in_dir(old_path, prefix=FILE_PREFIX)
    new_files = list_files_in_dir(new_path, prefix=FILE_PREFIX)
    return set(old_files) - set(new_files)


def move_unchanged_files(old_path: str, new_path: str, output_path: str) -> None:
    '''This function moves unchanged files from old_path to output_path'''

    def move_file(_old_file_path: str, _new_file_path: str) -> None:
        LOG.info("Moving %s to %s", old_file_path, new_file_path)
        os.rename(old_file_path, new_file_path)

    unchanged = unchanged_files(old_path, new_path)
    for filename in unchanged:
        old_file_path = os.path.join(old_path, filename)
        new_file_path = os.path.join(output_path, filename)
        move_file(old_file_path, new_file_path)


def uncompress_file(file_path: str) -> str:
    command_map = {".lz4": "unlz4 -f {file_path}", ".gz": "gunzip -fk {file_path}"}
    file_name, compression = os.path.splitext(file_path)
    subprocess.check_output(
        command_map[compression].format(file_path=file_path), shell=True
    )

    # Remove the header from the file in case many files were merged during compression
    header = subprocess.check_output(
        ["head", "-n", "1", file_name], universal_newlines=True
    ).strip()
    tmp_file_name = f"{file_name}.tmp"
    subprocess.check_output(f"mv {file_name} {tmp_file_name}", shell=True)
    subprocess.check_output(f"echo '{header}' > {file_name}", shell=True)
    subprocess.check_output(
        f"cat {tmp_file_name} | grep -v {header} >> {file_name} || true", shell=True
    )
    subprocess.check_output(f"rm {tmp_file_name}", shell=True)

    return file_name


def update_dhis2_data(
    old_data_path: str,
    new_data_path: str,
    output_path: str,
    filename: str,
    merge_columns: Optional[List[str]] = None,
) -> None:
    '''We use dask to merge the new files with the old files and then compress the merged file.
    We merge the files based on the `MERGE_COLUMNS`.'''

    merge_columns = merge_columns or MERGE_COLUMNS
    data_types = get_data_types(filename)

    new_file_path = os.path.join(new_data_path, filename)
    uncomp_new_file_path = uncompress_file(new_file_path)
    new_df = dd.read_csv(
        uncomp_new_file_path,
        blocksize=DASK_BLOCK_SIZE,
        dtype=data_types,
    )
    old_file_path = os.path.join(old_data_path, filename)
    # If this file does not exist in the old path. We shall assume that this is the first time
    # we are fetching data for this dataset. So we shall just move the new file to the output path.
    if not os.path.exists(old_file_path):
        LOG.info("Moving new dataset file %s to %s", new_file_path, output_path)
        output_file_path = os.path.join(output_path, filename)
        os.rename(new_file_path, output_file_path)
        return
    uncomp_old_file_path = uncompress_file(old_file_path)
    old_df = dd.read_csv(
        uncomp_old_file_path,
        blocksize=DASK_BLOCK_SIZE,
        dtype=data_types,
    )

    columns_to_update = list(set(old_df.columns) - set(merge_columns))

    updated_file_path = os.path.join(output_path, filename)
    output_df = old_df.merge(new_df, how='outer', on=merge_columns, indicator=True)

    for column in columns_to_update:
        output_df[column] = output_df[f"{column}_x"].where(
            output_df["_merge"] == "left_only", output_df[f"{column}_y"]
        )

    columns_to_drop = (
        [f"{column}_x" for column in columns_to_update]
        + [f"{column}_y" for column in columns_to_update]
        + ["_merge"]
    )
    output_df = output_df.drop(columns=columns_to_drop)
    compression = DASK_COMPRESSION.get(os.path.splitext(new_file_path)[1], 'gzip')
    output_df.to_csv(
        updated_file_path, index=False, compression=compression, single_file=True
    )
    subprocess.check_output(f"rm {uncomp_new_file_path}", shell=True)
    subprocess.check_output(f"rm {uncomp_old_file_path}", shell=True)
    LOG.info("Finished cleaning data for in %s", filename)


def replace_bools(paths: List[str], filename: str) -> List[str]:
    '''If we fail with a value error, it is most likely because one of the files had a string val
    `false` or `true`. We should replace these with 0 and 1 respectively.'''

    def replace_bool_with_int(value: str) -> Union[int, str]:
        if value == "false":
            return 0
        elif value == "true":
            return 1
        else:
            return value

    for path in paths:
        file_path = os.path.join(path, filename)
        df = pd.read_csv(file_path)
        df["value"] = df["value"].apply(replace_bool_with_int)
        df.to_csv(file_path, index=False)
    return paths


def start_update(merge_on_id: bool = False) -> None:
    '''This creates the tasks for to update the data.'''
    new_data_path = Flags.ARGS.new_data_path
    to_update = list_files_in_dir(new_data_path, prefix=FILE_PREFIX)
    LOG.info("Found %d files to update", len(to_update))

    kwargs = {"merge_columns": ["id"]} if merge_on_id else {}
    for filename in to_update:
        LOG.info("Updating data for %s", filename)
        old_data_path = Flags.ARGS.old_data_path
        output_path = Flags.ARGS.output_path
        try:
            update_dhis2_data(
                old_data_path, new_data_path, output_path, filename, **kwargs
            )
        except ValueError as err:
            LOG.error("Failed to update data for %s because of %s", filename, err)
            replace_bools([old_data_path, new_data_path], filename)
            update_dhis2_data(
                old_data_path, new_data_path, output_path, filename, **kwargs
            )


def main() -> int:
    Flags.PARSER.add_argument(
        "--old_data_path",
        type=str,
        required=True,
        help="Location of the old data",
    )
    Flags.PARSER.add_argument(
        "--new_data_path",
        type=str,
        required=True,
        help="Location to put the newly fetched data",
    )
    Flags.PARSER.add_argument(
        "--output_path",
        type=str,
        required=True,
        help="Location to put the updated data. Usually in the `PIPELINE_OUT` directory",
    )
    Flags.PARSER.add_argument(
        "--merge_on_id",
        action="store_true",
        default=False,
        required=False,
        help="Whether to merge on id or on the default columns",
    )
    Flags.InitArgs()
    start_update(merge_on_id=Flags.ARGS.merge_on_id)
    move_unchanged_files(
        Flags.ARGS.old_data_path, Flags.ARGS.new_data_path, Flags.ARGS.output_path
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
