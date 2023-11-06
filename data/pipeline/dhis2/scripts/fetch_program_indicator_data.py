#!/usr/bin/env python
import importlib
import os
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.generate_program_indicators import fetch_program_indicator_data


def main():
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--input_indicator_filepath',
        type=str,
        required=True,
        help='Location of the indicator json file, created in the fetch indicator step',
    )
    Flags.PARSER.add_argument(
        '--output_file_pattern',
        type=str,
        required=True,
        help='Location of the output data',
    )
    Flags.PARSER.add_argument(
        '--reporting_period',
        type=str,
        required=False,
        default="Daily",
        help='The DHIS2 reporting period',
    )
    Flags.PARSER.add_argument(
        '--shard_by_date_range',
        type=bool,
        required=False,
        default=False,
        help='Whether we should shard the results into files by date period or not',
    )
    Flags.PARSER.add_argument(
        '--assert_data_success',
        type=str,
        required=False,
        default="True",
        help='Whether to fail this step if some data could not be fetched.',
    )
    Flags.PARSER.add_argument(
        '--geo_dimension_id_filepath',
        type=str,
        required=False,
        default=None,
        help='Location of file containing list of organizational unit ids to use when fetching data',
    )
    Flags.InitArgs()

    assert_data_success = Flags.ARGS.assert_data_success.lower() not in [
        "false",
        "no",
        "nah",
    ]

    api_config_filepath = Flags.ARGS.api_config_filepath
    module_name = os.path.basename(api_config_filepath).replace('-', '_')
    spec = importlib.util.spec_from_loader(
        module_name,
        importlib.machinery.SourceFileLoader(module_name, api_config_filepath),
    )
    dhis2_api_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dhis2_api_module)

    # If --geo_dimension_id_filepath, read file and create a list of
    # organization unit ids
    geo_dimension_ids = None
    if Flags.ARGS.geo_dimension_id_filepath:
        with open(Flags.ARGS.geo_dimension_id_filepath) as geo_dimension_id_file:
            geo_dimension_ids = [line.rstrip() for line in geo_dimension_id_file]

    fetch_program_indicator_data(
        dhis2_api_module,
        Flags.ARGS.input_indicator_filepath,
        Flags.ARGS.output_file_pattern,
        shard_by_date_range=Flags.ARGS.shard_by_date_range,
        assert_data_success=assert_data_success,
        parent_locations=geo_dimension_ids,
    )


if __name__ == "__main__":
    sys.exit(main())
