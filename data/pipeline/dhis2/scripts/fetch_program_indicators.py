#!/usr/bin/env python
import importlib
import json
import os
import sys
from typing import List

from pylib.base.flags import Flags

from data.pipeline.dhis2.dataset_generator import DataSetGenerator
from log import LOG

BASE_LOCATION_RESOURCE_MAP = {
    'programIndicators': ["id", "name", "filter", "program"],
    'programs': ['id', "name"],
}


def build_program_indicators(resources: dict) -> List[dict]:
    programs = resources.get("programs", [])
    indicators = resources.get("programIndicators", [])
    LOG.info(f'found {len(programs)} programs and {len(indicators)} indicators')
    for program in programs:
        program['indicators'] = []
        for _, indicator in enumerate(indicators):
            if indicator.get('program', {}).get('id') == program['id']:
                program['indicators'].append(
                    {
                        'name': indicator['name'],
                        'id': indicator['id'],
                        'filter': indicator.get('filter', ''),
                    }
                )
                indicator['visited'] = True
    unvisited_indicators = [
        {
            'name': indicator['name'],
            'id': indicator['id'],
            'filter': indicator.get('filter', ''),
        }
        for indicator in indicators
        if not indicator.get('visited')
    ]
    if unvisited_indicators:
        LOG.info(f"{len(unvisited_indicators)} indicators don't belong to any program")
        program = {
            "name": "Misc Program Indicators",
            "id": "misc_program_indicators",
            "indicators": unvisited_indicators,
        }
        programs.append(program)
    return programs


def main():
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='Output python file path'
    )
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.InitArgs()

    LOG.info("Fetching Program Indicators.")

    api_config_filepath = Flags.ARGS.api_config_filepath
    module_name = os.path.basename(api_config_filepath).replace('-', '_')
    spec = importlib.util.spec_from_loader(
        module_name,
        importlib.machinery.SourceFileLoader(module_name, api_config_filepath),
    )
    dhis2_api_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dhis2_api_module)
    DHIS_OPTIONS = dhis2_api_module.DHIS_OPTIONS

    data_set_builder = DataSetGenerator(DHIS_OPTIONS)
    resources = data_set_builder.get_resources(BASE_LOCATION_RESOURCE_MAP)

    with open(Flags.ARGS.output_file, 'w') as output_file:
        output_file.write(json.dumps(build_program_indicators(resources), indent=4))
    return 0


if __name__ == '__main__':
    sys.exit(main())
