#!/usr/bin/env python
'''The script compares the canonical mapping files to the shapefiles to flag
issues with the shapefiles.

This script treats shapes whose location is not in the canonical files (meaning
that canonical names have since changed so the shapes no longer match) as a
"critical error" that would fail the script. Canonical locations that do not
have shapes are logged as a warning, but will not fail the step. Finally,
dimensions that have no shapes at all (ex. FacilityName) are just logged. This
script will log for all dimensions before erroring (in the case of extra
shapes).

Example usage for the geojson defined in config:
  ZEN_ENV=something ./check_shapefiles.py \
    --canonical_mapping \
        "RegionName:${MAPPINGS_DIR}/region_mapped.csv" \
        "ZoneName:${MAPPINGS_DIR}/zone_mapped.csv" \
        "WoredaName:${MAPPINGS_DIR}/woreda_mapped.csv" \
        "CenterName:${MAPPINGS_DIR}/center_mapped.csv"

Example usage for another geojson:
  ZEN_ENV=something ./check_shapefiles.py \
    --canonical_mapping \
        "RegionName:${MAPPINGS_DIR}/region_mapped.csv" \
        "ZoneName:${MAPPINGS_DIR}/zone_mapped.csv" \
        "WoredaName:${MAPPINGS_DIR}/woreda_mapped.csv" \
        "CenterName:${MAPPINGS_DIR}/center_mapped.csv" \
    --geojson_file_path \
        {path to geojson}
'''

from collections import defaultdict
import csv
import json
import sys
from typing import Dict, List

import requests
from pylib.base.flags import Flags

from config.aggregation import DIMENSION_SLICES
from config.datatypes import HIERARCHICAL_DIMENSIONS
from config.ui import MAP_GEOJSON_LOCATION
from data.pipeline.gis.scripts.update_all_canonical_mapping_centroids import (
    parse_dimension_files,
)
from log import LOG


def check_dimension_for_issues(
    dimension: str, canonical_filename: str, locations: List[Dict[str, str]]
) -> bool:
    if not locations:
        LOG.info('Dimension %s has no shapes', dimension)
        return False

    hierarchy_length = len(DIMENSION_SLICES.get(dimension, [dimension]))
    canonical = set()
    geojson = set()

    with open(canonical_filename, 'r') as canonical_file:
        reader = csv.reader(canonical_file)
        # Drop the header line
        next(reader)
        for line in reader:
            if line:
                canonical.add(tuple(line[:hierarchy_length]))

    for location in locations:
        geojson.add(
            tuple(
                location[dimension]
                for dimension in HIERARCHICAL_DIMENSIONS[:hierarchy_length]
            )
        )

    # TODO: Add flags for dimensions where missing locations should be enforced.
    # Pass in a list of dimensions for which this script would fail if there are any
    # missing shapes.
    missing_locations = canonical - geojson
    if missing_locations:
        LOG.warning(
            'The following %s locations are missing shapes: %s',
            dimension,
            ', '.join(str(loc) for loc in missing_locations),
        )
    extra_locations = geojson - canonical
    if extra_locations:
        LOG.error(
            'The following %s shapes do not correspond to a canonical location: %s',
            dimension,
            ', '.join(str(loc) for loc in extra_locations),
        )
    return len(extra_locations) > 0


def main():
    Flags.PARSER.add_argument(
        '--canonical_mapping',
        nargs='*',
        type=str,
        required=True,
        help='List of dimensions and canonical mapping files to use. Colon '
        'separated, the pattern is: Dimension:mapping_csv_path',
    )
    Flags.PARSER.add_argument(
        '--geojson_file_path',
        type=str,
        required=False,
        help='If provided, use this geojson file rather than the one in config',
    )
    Flags.InitArgs()

    dimension_files = parse_dimension_files(Flags.ARGS.canonical_mapping)

    # Load the geojson file
    geojson_file_path = Flags.ARGS.geojson_file_path
    # If provided, use the given geojson file
    if geojson_file_path:
        with open(geojson_file_path, 'r') as geojson_file:
            shapefile = json.load(geojson_file)
    # Otherwise, use the one in config that the site uses
    else:
        response = requests.get(MAP_GEOJSON_LOCATION)
        response.raise_for_status()
        shapefile = response.json()
    properties = [feature['properties'] for feature in shapefile['features']]

    # Get all shape locations organized by level of the hierarchy
    all_locations = defaultdict(list)
    for location in properties:
        for dimension in HIERARCHICAL_DIMENSIONS[::-1]:
            if dimension in location and location[dimension]:
                all_locations[dimension].append(location)
                break

    # For each level of the hierarchy, check all shape locations.
    error_state = False
    for dimension in HIERARCHICAL_DIMENSIONS:
        error_state |= check_dimension_for_issues(
            dimension, dimension_files[dimension], all_locations[dimension]
        )

    LOG.info('Finished logging any shapefile issues')
    if error_state:
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
