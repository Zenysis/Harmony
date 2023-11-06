#!/usr/bin/env python
import sys

from pylib.base.flags import Flags

from data.pipeline.dhis2.dataset_generator import DataSetGenerator
from data.pipeline.dhis2.location_generator import (
    LocationGenerator,
    BASE_LOCATION_RESOURCE_MAP,
)
from data.pipeline.dhis2.util import load_module_by_filepath
from log import LOG


def main():
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='output locations file path'
    )
    Flags.PARSER.add_argument(
        '--hierarchy',
        type=str,
        nargs='*',
        required=True,
        help='List of geographical hierarchy',
    )
    Flags.InitArgs()

    hierarchy = Flags.ARGS.hierarchy
    LOG.info('Starting location generating...')
    dhis2_api_config = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    dataset_generator = DataSetGenerator(dhis2_api_config.DHIS_OPTIONS)
    # Query location resources from the dhis2 api.
    resources = dataset_generator.get_resources(BASE_LOCATION_RESOURCE_MAP)

    # Process location response into a hierarchical format.
    location_builder = LocationGenerator(resources, hierarchy)
    location_builder.write_output_facilities(Flags.ARGS.output_file)
    return 0


if __name__ == '__main__':
    sys.exit(main())
