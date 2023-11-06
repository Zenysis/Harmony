#!/usr/bin/env python
'''Script for fetching data from DHIS2 API using the dataValueSets endpoint.'''
import asyncio
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.data_generator import DHIS2DataBuilder
from data.pipeline.dhis2.scripts.common import setup_common_flags
from data.pipeline.dhis2.util import load_module_by_filepath


# pylint: disable=no-member,missing-function-docstring
async def main():
    setup_common_flags()
    Flags.PARSER.add_argument(
        "--input_datasets_filepath",
        type=str,
        required=True,
        help="Location of the indicator json file, created in the fetch fields step",
    )
    Flags.PARSER.add_argument(
        "--input_resample_datasets_filepath",
        type=str,
        required=False,
        default=None,
        help="Location of the resample indicator json file, created in the fetch fields step",
    )
    Flags.PARSER.add_argument(
        "--output_file_pattern",
        type=str,
        required=True,
        help="Location of the output data",
    )
    Flags.PARSER.add_argument(
        "--last_updated_filepath",
        type=str,
        required=True,
        help="Location of the json file that stores lastUpdate time for each dataset",
    )
    Flags.PARSER.add_argument(
        "--request_key",
        type=str,
        required=False,
        default="dataSet",
        help="Whether to fetch data by dataSet or by dataElementGroup",
    )

    Flags.InitArgs()

    dhis2_api_module = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, "DHIS_OPTIONS"
    )

    builder = DHIS2DataBuilder(
        dhis2_api_module,
        Flags.ARGS.output_file_pattern,
        Flags.ARGS.last_updated_filepath,
        Flags.ARGS.request_key,
        Flags.ARGS.input_datasets_filepath,
        resample_datasets_path=Flags.ARGS.input_resample_datasets_filepath,
    )

    await builder.fetch_data_by_data_value_sets()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
