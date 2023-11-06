#!/usr/bin/env python
import csv
import json
import sys
from typing import Union, List, Optional, Dict

from pylib.base.flags import Flags

from config.datatypes import BaseRowType, HIERARCHICAL_DIMENSIONS
from data.pipeline.pipeline_args import PipelineArgs
from data.pipeline.dhis2.data_processing import (
    ReportingPeriodDHIS2DataAggregator,
    DHIS2Columns,
    DHIS2DataAggregator,
)
from log import LOG
from util.file.ambiguous_file import AmbiguousFile
from util.file.file_config import FilePattern
from util.file.shard import ShardReader

DVS_COLUMNS = {
    "period": "period",
    "value": "value",
    "data_element": "dataElement",
    "org_unit": "orgUnit",
    "category_option_combo": "categoryOptionCombo",
}


def get_field_datasource_lookup(dhis2_groups_file: Union[str, None]) -> Dict[str, str]:
    """Create a lookup table for field data sources from a dhis2 groups file."""
    if dhis2_groups_file is None:
        return {}
    with open(dhis2_groups_file) as input_file:
        # We are currently using the raw_dhis2.json output of `00_fetch_fields` in the generate
        # step
        groups = json.load(input_file).get("dataElementGroups", [])
        return {
            data_element["id"]: ": " + group["displayName"]
            for group in groups
            for data_element in group["dataElements"]
        }


def initialize_aggregator(
    locations_file: str,
    date_format: str,
    dhis2_columns: DHIS2Columns,
    prefix: str,
    suffix: str,
    data_source: Union[str, None],
    default_disaggregation: List[str],
    dhis2_groups_file: Optional[str] = None,
) -> DHIS2DataAggregator:
    with open(locations_file) as input_locations_file:
        locations_reader = csv.DictReader(input_locations_file)

        # We should temporarily support the analytics endpoint format. We can easily tell which
        # format is being used by looking at the period column.
        if dhis2_columns.period in ["Period start date", "Period end date"]:
            data_aggregator = DHIS2DataAggregator
        else:
            data_aggregator = ReportingPeriodDHIS2DataAggregator
        return data_aggregator(
            locations_reader,
            HIERARCHICAL_DIMENSIONS,
            BaseRowType,
            date_format,
            default_disaggregation,
            data_source=data_source or prefix,
            prefix=prefix,
            suffix=suffix,
            column_names=dhis2_columns,
            field_datasource_lookup=get_field_datasource_lookup(dhis2_groups_file),
        )


def process_and_write_rows(
    dhis2_data_aggregator: DHIS2DataAggregator,
    input_path: Union[FilePattern, str],
    output_path_pattern: str,
    field_list_path: str,
    location_list_path: str,
    non_hierarchical_list_path: str,
) -> None:
    if isinstance(input_path, FilePattern):
        reader = ShardReader
        args = [input_path, AmbiguousFile]
    else:
        reader = AmbiguousFile  # type: ignore
        args = [input_path]
    with reader(*args) as input_file:  # type: ignore
        opts = {
            "output_file_pattern": output_path_pattern,
            "output_fields_path": field_list_path,
            "output_locations_path": location_list_path,
            "input_file": input_file,
        }
        # TODO move output_non_hierarchical_filename to opts
        dhis2_data_aggregator.process_and_write(
            opts,
            buffer_size=20000000,
            output_non_hierarchical_filename=non_hierarchical_list_path,
        )


def process_data(
    input_path: Union[FilePattern, str],
    output_path_pattern: str,
    input_locations_file: str,
    date_format: str,
    dhis2_columns: DHIS2Columns,
    prefix: str,
    suffix: str,
    data_source: Union[str, None],
    field_list_path: str,
    location_list_path: str,
    default_disaggregation: List[str],
    non_hierarchical_list_path: str,
    dhis2_groups_file: Optional[str] = None,
) -> None:
    dhis2_data_aggregator = initialize_aggregator(
        input_locations_file,
        date_format,
        dhis2_columns,
        prefix,
        suffix,
        data_source,
        default_disaggregation,
        dhis2_groups_file,
    )
    process_and_write_rows(
        dhis2_data_aggregator,
        input_path,
        output_path_pattern,
        field_list_path,
        location_list_path,
        non_hierarchical_list_path,
    )
    dhis2_data_aggregator.print_stats()
    dhis2_data_aggregator.assert_success()


def get_pattern_or_file(_file: str, _file_pattern: str) -> Union[str, FilePattern]:
    return _file or FilePattern(_file_pattern)


def validate_output_file_pattern(output_file_pattern: str) -> str:
    """This will return the output file pattern if it is valid, otherwise it
    will raise an error"""

    # For some reason zeus will accept a `output_file` argument when
    # a output_file_pattern argument is set.
    # This is a validation to make sure that the output_file_pattern always
    # has a "#" in it. Otherwise the process step will overwrite the same file
    if not output_file_pattern or "#" not in output_file_pattern:
        raise ValueError('output_file_pattern is invalid. It must contain a "#"')
    return output_file_pattern


def main() -> int:
    group = Flags.PARSER.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--input_file", type=str, help="Location of the fetched data file"
    )
    group.add_argument(
        "--input_file_pattern",
        type=str,
        help="Location of the fetched data files",
    )
    Flags.PARSER.add_argument(
        "--locations_file",
        type=str,
        required=True,
        help="Location of the fetched data file",
    )
    Flags.PARSER.add_argument(
        "--date_key",
        type=str,
        required=False,
        default="Period",
        help="The title of the date column",
    )
    Flags.PARSER.add_argument(
        "--date_format",
        type=str,
        required=False,
        default="%Y%m%d",
        help="The format of the date column",
    )
    Flags.PARSER.add_argument(
        "--prefix",
        type=str,
        required=False,
        default="",
        help="Prefix to use for indicator IDs when there are conflicting DHIS2 integrations",
    )
    Flags.PARSER.add_argument(
        "--suffix",
        type=str,
        required=False,
        default="",
        help="Suffix to use for indicator IDs when there are conflicting DHIS2 integrations",
    )
    Flags.PARSER.add_argument(
        "--data_source",
        type=str,
        required=False,
        default=None,
        help="Prefix to use for indicator IDs when there are conflicting DHIS2 integrations",
    )
    Flags.PARSER.add_argument(
        "--default_disaggregation",
        type=str,
        nargs="+",
        required=False,
        default="",
        help="Default category option combo for data elements without parents",
    )
    Flags.PARSER.add_argument(
        "--use_dvs_columns",
        action="store_true",
        help="Use the DHIS2 data value set columns. When this is True the --date_key is ignored",
        required=False,
        default=False,
    )
    Flags.PARSER.add_argument(
        "--generate_source_from_groups_file",
        type=str,
        required=False,
        help="Location of the dhis2 dataElementGroups file",
        default=None,
    )
    PipelineArgs.add_source_processing_args()
    Flags.InitArgs()

    assert (
        Flags.ARGS.data_source or Flags.ARGS.prefix
    ), "Must specify at least one of --data_source or --prefix"

    dhis2_columns = (
        DHIS2Columns(**DVS_COLUMNS)
        if Flags.ARGS.use_dvs_columns
        else DHIS2Columns(period=Flags.ARGS.date_key)
    )
    input_path = get_pattern_or_file(
        Flags.ARGS.input_file, Flags.ARGS.input_file_pattern
    )
    LOG.info("Starting DHIS2 data processing...")
    process_data(
        input_path,
        validate_output_file_pattern(Flags.ARGS.output_file_pattern),
        Flags.ARGS.locations_file,
        Flags.ARGS.date_format,
        dhis2_columns,
        Flags.ARGS.prefix,
        Flags.ARGS.suffix,
        Flags.ARGS.data_source,
        Flags.ARGS.field_list,
        Flags.ARGS.location_list,
        Flags.ARGS.default_disaggregation,
        Flags.ARGS.non_hierarchical_list,
        dhis2_groups_file=Flags.ARGS.generate_source_from_groups_file,
    )
    LOG.info("Finished DHIS2 data processing...")
    return 0


if __name__ == "__main__":
    sys.exit(main())
