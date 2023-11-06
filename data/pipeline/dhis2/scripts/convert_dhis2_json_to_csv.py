#!/usr/bin/env python
import asyncio
import csv
import itertools
import os
import sys
from typing import List, Iterable, Any

import ijson
from pylib.base.flags import Flags

from data.pipeline.dhis2.scripts.common import JSON_DATA_FORMAT, CSV_DATA_FORMAT
from data.pipeline.util import list_files_in_dir
from log import LOG
from util.file.ambiguous_file import AmbiguousFile

DEFAULT_DATA_VALUES_KEY = "dataValues.item"

VALUES_MAP = {
    "dataElement": DEFAULT_DATA_VALUES_KEY,
    "events": "events.item",
    "enrollments": "enrollments.item",
}


def _numerate_bool_value(value: str) -> Any:
    '''Convert a boolean value to a number.'''
    bool_map = {'true': 1, 'false': 0}
    return bool_map.get(value, value)


def peek(iterable):
    '''See if an iterable has a first element and return the iterable or None
    if it does not.'''
    try:
        first = next(iterable)
    except StopIteration:
        return None
    return itertools.chain([first], iterable)


def _write_output(
    out_file_path: str,
    data_values: Iterable[dict],
    fieldnames: List[str],
    data_type: str,
):
    with AmbiguousFile(out_file_path, write=True) as out_file:
        csv_writer = csv.DictWriter(out_file, fieldnames=fieldnames)
        csv_writer.writeheader()
        for data_value in data_values:
            try:
                if 'id' in fieldnames:
                    if 'event' in data_value:
                        data_value['id'] = data_value['event']
                    elif 'enrollment' in data_value:
                        data_value['id'] = data_value['enrollment']
                # We treat events file differently because events have a list of data
                # values, and we need to convert that list to a comma separated string
                # so that it can be loaded into a single column in the csv.
                if data_type == 'events':
                    event_data_values = data_value['dataValues']
                    values = []
                    for value in event_data_values:
                        _value = (
                            f"{value.get('dataElement', 'NO_DE')}"
                            f"::{value.get('value', '')}"
                        )
                        values.append(_value)
                    data_value['dataValues'] = "|||".join(values)
                reduced_data_value = {key: data_value[key] for key in fieldnames}
                if 'value' in fieldnames:
                    reduced_data_value['value'] = _numerate_bool_value(
                        reduced_data_value['value']
                    )
                csv_writer.writerow(reduced_data_value)
            except KeyError as error:
                LOG.error(
                    "Skipping row: %s because of error %s",
                    data_value,
                    error,
                )


def _get_field_names(data_type: str) -> List[str]:
    if data_type == 'enrollments':
        return ['id', 'enrollmentDate', 'orgUnit', 'program']
    if data_type == 'events':
        return ['id', 'eventDate', 'orgUnit', 'program', 'dataValues']
    return [
        'dataElement',
        'period',
        'orgUnit',
        'categoryOptionCombo',
        'value',
    ]


async def convert_to_csv(
    filename: str,
    input_dir: str,
    output_dir: str,
    raise_on_error: bool = False,
    data_type: str = 'dataElements',
):
    '''Convert a json file to csv file. The json file must be in the format returned by
    the DHIS2 API.'''
    # We shall not include unwanted keys in the output csv file
    fieldnames = _get_field_names(data_type)

    try:
        file_path = os.path.join(input_dir, filename)
        out_file_path = os.path.join(
            output_dir, filename.replace(JSON_DATA_FORMAT, CSV_DATA_FORMAT)
        )
        with AmbiguousFile(file_path) as in_file:
            data_value_key = VALUES_MAP.get(data_type, DEFAULT_DATA_VALUES_KEY)
            data_values = peek(ijson.items(in_file, data_value_key))
            # We shall only open a new csv file if we know there was data from the response
            if data_values is not None:
                _write_output(out_file_path, data_values, fieldnames, data_type)
                LOG.info("Converted %s to %s", file_path, out_file_path)
            else:
                LOG.info("No data values found in %s", file_path)
    except ijson.common.IncompleteJSONError as error:
        # Some json responses are not empty but do not have the expected format. It is usually empty
        # spaces.
        LOG.error("Error converting %s to csv: %s", filename, error)
        if raise_on_error:
            raise error


async def convert_many_to_csv(
    files: List[str],
    input_dir: str,
    output_dir: str,
    raise_on_error: bool = False,
    data_type: str = 'dataElements',
):
    '''Convert many json files to csv files asynchronously.'''
    tasks = [
        convert_to_csv(
            filename,
            input_dir,
            output_dir,
            raise_on_error=raise_on_error,
            data_type=data_type,
        )
        for filename in files
    ]
    await asyncio.gather(*tasks)


async def main():
    Flags.PARSER.add_argument(
        "--input_dir",
        type=str,
        required=True,
        help="Location of the input data",
    )
    Flags.PARSER.add_argument(
        "--output_dir",
        type=str,
        required=True,
        help="Location of the output data",
    )
    Flags.PARSER.add_argument(
        "--data_type",
        type=str,
        required=False,
        default='dataElements',
        help="This is to differentiate between events and data elements",
    )
    Flags.PARSER.add_argument(
        "--input_file_pattern",
        type=str,
        required=True,
        help="The file pattern to match for input files",
    )
    Flags.PARSER.add_argument(
        "--raise_on_error",
        action="store_true",
        default=False,
        required=False,
        help="Whether to raise an error if any of the input files cannot be converted to csv",
    )

    Flags.InitArgs()

    prefix, suffix = Flags.ARGS.input_file_pattern.split("#")
    files = list_files_in_dir(Flags.ARGS.input_dir, prefix, suffix)
    await convert_many_to_csv(
        files,
        Flags.ARGS.input_dir,
        Flags.ARGS.output_dir,
        data_type=Flags.ARGS.data_type,
        raise_on_error=Flags.ARGS.raise_on_error,
    )


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
