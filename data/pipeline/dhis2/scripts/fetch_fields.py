#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import json
import sys
from typing import Any, Optional

from pylib.base.flags import Flags

from data.pipeline.dhis2.dataset_generator import DataSetGenerator
from data.pipeline.dhis2.dhis2_field_builder import DHIS2FieldBuilder
from data.pipeline.dhis2.zenysis_field_builder import (
    DHIS2FieldMetadata,
    DHIS2ZenysisFieldBuilder,
)
from data.pipeline.dhis2.util import load_module_by_filepath
from log import LOG


# Maps from endpoint to which attributes to fetch
FIELD_ATTRIBUTES = ['id', 'displayName', 'displayShortName', 'displayDescription']
CATEGORY_ATTRIBUTES = ['id', 'displayName', 'access']
# Field Endpoints
# What Zenysis calls "fields" and "categories", DHIS2 calls "data elements" and "groups"
CATEGORIES_ENDPOINT = 'dataElementGroups'
COMPOSITE_FIELDS_ENDPOINT = 'dataElementOperands'
FIELDS_ENDPOINT = 'dataElements'
# The data sets are needed to determine the reporting rate for fetching
DATA_SETS_ENDPOINT = 'dataSets'
DATA_SET_ATTRIBUTES = ['periodType', 'dataSetElements[dataElement[id]]', 'access']
FIELDS_RESOURCE_MAP = {
    CATEGORIES_ENDPOINT: ['dataElements', *CATEGORY_ATTRIBUTES],
    COMPOSITE_FIELDS_ENDPOINT: ['dataElement', *FIELD_ATTRIBUTES],
    FIELDS_ENDPOINT: ['aggregationType', 'valueType', *FIELD_ATTRIBUTES],
    DATA_SETS_ENDPOINT: ['id', *DATA_SET_ATTRIBUTES],
}

# Program Fields Endpoints
PROGRAM_FIELDS_ENDPOINT = 'programIndicators'
PROGRAMS_ENDPOINT = 'programs'
PROGRAM_FIELDS_RESOURCE_MAP = {
    PROGRAMS_ENDPOINT: [
        f'programIndicators[aggregationType,{",".join(FIELD_ATTRIBUTES)}]',
        *CATEGORY_ATTRIBUTES,
    ],
}

# Formula Fields Endpoints
# What Zenysis calls "formula fields", DHIS2 calls "indicators"
FORMULA_FIELDS_ENDPOINT = 'indicators'
FORMULA_CATEGORIES_ENDPOINT = 'indicatorGroups'
CONSTANTS_ENDPOINT = 'constants'
FORMULA_FIELDS_RESOURCE_MAP = {
    FORMULA_FIELDS_ENDPOINT: ['numerator', 'denominator', *FIELD_ATTRIBUTES],
    FORMULA_CATEGORIES_ENDPOINT: ['indicators', *CATEGORY_ATTRIBUTES],
    CONSTANTS_ENDPOINT: ['id', 'value'],
}

# Reporting Endpoints
# Note this also uses the same /dataSets endpoint as we use for reporting rates
REPORTING_RESOURCE_MAP = {
    # dataSetElements is only needed for the field reporting rates
    DATA_SETS_ENDPOINT: [
        'organisationUnits',
        *DATA_SET_ATTRIBUTES,
        *FIELD_ATTRIBUTES,
    ]
}


def fetch_metadata(
    dhis2_options: Any,
    output_raw_dhis2_fetch: Optional[str],
    fetch_data_elements: bool,
    fetch_program_fields: bool,
    fetch_reporting_fields: bool,
    fetch_formula_fields: bool,
) -> DHIS2FieldMetadata:
    # Specify which resources to fetch
    resources_to_fetch = {}
    if fetch_data_elements:
        LOG.info('Fetching data elements')
        resources_to_fetch.update(FIELDS_RESOURCE_MAP)
    if fetch_program_fields:
        LOG.info('Additionally fetching program fields')
        resources_to_fetch.update(PROGRAM_FIELDS_RESOURCE_MAP)
    if fetch_reporting_fields:
        LOG.info('Additionally fetching reporting fields')
        resources_to_fetch.update(REPORTING_RESOURCE_MAP)
    if fetch_formula_fields:
        LOG.info('Additionally fetching formula fields')
        resources_to_fetch.update(FORMULA_FIELDS_RESOURCE_MAP)

    # Fetch the resources
    # NOTE(abby): As of 5/15/2023, the /metadata endpoint is intentionally not used since
    # it only returns a subset of the dataElementOperands.
    metadata_fetcher = DataSetGenerator(dhis2_options)
    metadata = metadata_fetcher.get_resources(resources_to_fetch)
    metadata_unpacked = DHIS2FieldMetadata(
        field_categories=metadata.get(CATEGORIES_ENDPOINT, []),
        composite_fields=metadata.get(COMPOSITE_FIELDS_ENDPOINT, []),
        fields=metadata.get(FIELDS_ENDPOINT, []),
        data_sets=metadata.get(DATA_SETS_ENDPOINT, []),
        # Fetching the program fields is optional
        programs=metadata.get(PROGRAMS_ENDPOINT, []),
        # Fetching the formula fields is optional
        constants=metadata.get(CONSTANTS_ENDPOINT, []),
        formula_fields=metadata.get(FORMULA_FIELDS_ENDPOINT, []),
        formula_categories=metadata.get(FORMULA_CATEGORIES_ENDPOINT, []),
    )

    # If enabled, output the raw DHIS2 data
    if output_raw_dhis2_fetch:
        with open(output_raw_dhis2_fetch, 'w') as output_file:
            output_file.write(json.dumps(metadata, indent=4))

    return metadata_unpacked


def main() -> int:
    Flags.PARSER.add_argument(
        '--api_config_filepath',
        type=str,
        required=True,
        help='Location of api config file.',
    )
    Flags.PARSER.add_argument(
        '--output_dhis2_fetch_file',
        type=str,
        required=False,
        help='Output json file for all fields that should be fetched from DHIS2',
    )
    Flags.PARSER.add_argument(
        '--output_dhis2_resampled_fetch_file',
        type=str,
        required=False,
        help='Output json file for all resampled fields that should be fetched from DHIS2. '
        'If this is enabled, then `output_dhis2_fetch_file` will only contain non-resampled '
        'fields.',
    )
    Flags.PARSER.add_argument(
        '--output_dhis2_program_fetch_file',
        type=str,
        required=False,
        help='Output json file for all program fields that should be fetched from DHIS2. '
        'If both this and `fetch_formula_fields` are enabled, then formula fields can '
        'include program field constituents.',
    )
    Flags.PARSER.add_argument(
        '--output_dhis2_reporting_fetch_file',
        type=str,
        required=False,
        help='Output json file for all reporting/ data sets fields that should be fetched '
        'from DHIS2',
    )
    Flags.PARSER.add_argument(
        '--output_field_metadata_file',
        type=str,
        required=True,
        help='Output csv file with the field metadata to add to Data Catalog',
    )
    Flags.PARSER.add_argument(
        '--output_category_metadata_file',
        type=str,
        required=True,
        help='Output csv file with the category info to add to Data Catalog',
    )
    Flags.PARSER.add_argument(
        '--output_raw_dhis2_fetch',
        type=str,
        required=False,
        help='Output json file with raw DHIS2 API data',
    )
    Flags.PARSER.add_argument(
        '--reporting_rates_to_include',
        type=str,
        required=False,
        nargs='+',
        default=None,
        help='Reporting rates to include in the output JSON. Will only filter data'
        'elements and reporting fields',
    )
    Flags.PARSER.add_argument(
        '--fetch_formula_fields',
        action='store_true',
        default=False,
        help='Fetch formula fields as well',
    )
    Flags.PARSER.add_argument(
        '--use_dvs_endpoint',
        action='store_true',
        default=False,
        help='Output the dhis2 fetch and resampled fetch files in the format for the '
        'dataValueSets endpoint. If this is enabled, then `output_dhis2_fetch_file` '
        'and optionally `output_dhis2_resampled_fetch_file` must be a file pattern.'
        'If we are not fetching dataElements, then this flag is ignored.',
    )
    Flags.PARSER.add_argument(
        '--output_resampled_periods_file',
        type=str,
        required=False,
        help='The output file with the period for each of the resampled fields. This '
        'is used in resampling to determine the correct end date for the period.',
    )
    Flags.InitArgs()

    # Load DHIS2 options
    LOG.info('Starting fetching fields')
    dhis2_api_config = load_module_by_filepath(
        Flags.ARGS.api_config_filepath, 'DHIS_OPTIONS'
    )

    output_dhis2_fetch_file = Flags.ARGS.output_dhis2_fetch_file
    resampled_file = Flags.ARGS.output_dhis2_resampled_fetch_file
    include_data_elements = output_dhis2_fetch_file is not None
    program_file = Flags.ARGS.output_dhis2_program_fetch_file
    include_program_fields = program_file is not None
    reporting_file = Flags.ARGS.output_dhis2_reporting_fetch_file
    include_reporting_fields = reporting_file is not None
    include_formula_fields = Flags.ARGS.fetch_formula_fields
    reporting_rates_to_include = (
        set(Flags.ARGS.reporting_rates_to_include)
        if Flags.ARGS.reporting_rates_to_include
        else None
    )

    use_dvs_endpoint = False
    if include_data_elements:
        use_dvs_endpoint = Flags.ARGS.use_dvs_endpoint
        # Validate --use_dvs_endpoint is used correctly
        if use_dvs_endpoint:
            assert '#' in output_dhis2_fetch_file and (
                not resampled_file or '#' in resampled_file
            ), 'If --use_dvs_endpoint is True, then the dhis2 fetch files must be file patterns'
        else:
            assert '#' not in output_dhis2_fetch_file and (
                not resampled_file or '#' not in resampled_file
            ), (
                'If --use_dvs_endpoint is False, then the dhis2 fetch files must not be file '
                'patterns'
            )

    # Fetch the data from the API
    metadata_unpacked = fetch_metadata(
        dhis2_api_config.DHIS_OPTIONS,
        Flags.ARGS.output_raw_dhis2_fetch,
        include_data_elements,
        include_program_fields,
        include_reporting_fields,
        include_formula_fields,
    )

    # Process and output the zenysis fields
    zenysis_builder = DHIS2ZenysisFieldBuilder(
        metadata_unpacked,
        dhis2_api_config,
        split_resample_fields=resampled_file is not None,
        include_program_fields=program_file is not None,
        include_reporting_fields=reporting_file is not None,
        reporting_rates_to_include=reporting_rates_to_include,
    )
    zenysis_builder.output_zenysis_fields(
        Flags.ARGS.output_field_metadata_file,
        Flags.ARGS.output_category_metadata_file,
        Flags.ARGS.output_resampled_periods_file,
    )

    # Output the DHIS2 fields for the 05 fetch steps
    dhis2_builder = DHIS2FieldBuilder(zenysis_builder)
    dhis2_builder.output_fields_to_fetch_from_dhis2(
        metadata_unpacked,
        use_dvs_endpoint,
        output_dhis2_fetch_file,
        resampled_file_name=resampled_file,
        program_file_name=program_file,
        reporting_file_name=reporting_file,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
