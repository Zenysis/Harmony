#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import json
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.raw_data_generator import RawDataBuilder, RawDataFetcher
from data.pipeline.dhis2.util import load_module_by_filepath

PATH = (
    'analytics?'
    'dimension=dx:%s&'
    'dimension=pe:%s&'
    'dimension=ou:%s&'
    'displayProperty=NAME&'
    'skipMeta=true'
)


def main() -> int:
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--input_fields_filepath',
        type=str,
        required=True,
        help='Location of the program fields json file, created in the fetch fields step',
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
    Flags.InitArgs()

    assert_data_success = Flags.ARGS.assert_data_success.lower() not in [
        "false",
        "no",
        "nah",
    ]

    dhis2_api_module = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    periods = dhis2_api_module.DHIS2_PERIODS[Flags.ARGS.reporting_period]
    nation = [dhis2_api_module.NATION]
    retry_max = getattr(dhis2_api_module, 'RETRY_MAX', 0)

    with open(Flags.ARGS.input_fields_filepath) as json_file:
        program_fields = json.load(json_file)

    dimension_builder = RawDataBuilder(
        program_fields,
        periods,
        nation,
        max_concurrent_requests=dhis2_api_module.MAX_CONCURRENT_REQUESTS,
        shard_indicator_size=dhis2_api_module.SHARD_INDICATOR_SIZE,
        shard_dates_size=dhis2_api_module.SHARD_DATES_SIZE,
        analytics_resource_type='json',
    )

    data_fetcher = RawDataFetcher(
        dhis2_api_module.DHIS_OPTIONS, retry_max=retry_max, path=PATH
    )
    dimension_builder.write_output_data(
        Flags.ARGS.output_file_pattern,
        data_fetcher,
        shard_by_date_range=Flags.ARGS.shard_by_date_range,
    )

    if assert_data_success:
        data_fetcher.assert_success()
    return 0


if __name__ == "__main__":
    sys.exit(main())
