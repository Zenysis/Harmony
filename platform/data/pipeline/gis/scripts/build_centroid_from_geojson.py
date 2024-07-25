#!/usr/bin/env python
# This script takes a geojson file and computes the centroid for all features
# contained in it. The centroids are written to an output CSV mapping the
# feature's properties to its corresponding lat/lon. This script expects all
# features to have unique property values.
#
# NOTE: You need to set the correct ZEN_ENV since this file relies on config
# values. This allows the script to not need everything to be passed by command line
# flag.
# Example:
# ZEN_ENV='something' data/pipeline/gis/scripts/build_centroid_from_geojson.py \
#     --input_geojson_file='file_from_earlier.geojson' \
#     --output_file='centroids.csv'

import sys
from typing import Dict, List

from pylib.base.flags import Flags
from shapely.errors import TopologicalError
from shapely.ops import polylabel

from config.datatypes import HIERARCHICAL_DIMENSIONS
from data.pipeline.gis.geojson_builder import GeojsonBuilder
from log import LOG
from util.file.unicode_csv import UnicodeDictWriter

LAT_KEY = 'latitude'
LON_KEY = 'longitude'

# The number of decimal degrees we should truncate the final lat/lon values to.
# Six decimal places is accurate up to 0.11 meters, which is fine for us.
NUM_DEGREES = 6


def get_center(shape, feature_id):
    '''Calculate the center coordinate of the given shape.'''
    centroid_coords = shape.centroid.coords
    assert len(centroid_coords) == 1, (
        'Multiple centroid coordinates exist for feature. Feature ID: %s\t'
        'Centroid: %s' % (feature_id, centroid_coords)
    )

    # NOTE: For Polygon shapes, we want to calculate the "pole of
    # inaccessibility", which is the point within a polygon outline that
    # is furthest from that outline. This can help us approximate the "center"
    # of the shape.
    try:
        polylabel_coords = polylabel(shape, tolerance=10)
        # NOTE: Geojson stores longitude before latitude.
        lat = polylabel_coords.y
        lon = polylabel_coords.x
    except (AttributeError, TopologicalError):
        # If shape is MultiPolygon and not Polygon
        # NOTE: Geojson stores longitude before latitude.
        lat = centroid_coords[0][1]
        lon = centroid_coords[0][0]

    return {
        LAT_KEY: f'{round(lat, NUM_DEGREES):f}',
        LON_KEY: f'{round(lon, NUM_DEGREES):f}',
    }


class CentroidGeojsonBuilder(GeojsonBuilder):
    def add_feature(self, feature):
        if not feature.properties:
            return
        super().add_feature(feature)

    def get_feature_id(self, feature):
        '''Create a unique ID for this feature based on its stored properties.'''
        # Return an ordered tuple from the properties fields since we expect
        # each feature to have unique properties.
        return tuple(feature.properties.get(f) or '' for f in HIERARCHICAL_DIMENSIONS)


def get_centroids(input_geojson_file: str) -> List[Dict[str, str]]:
    geojson_builder = CentroidGeojsonBuilder()
    geojson_builder.read_geojson_file(input_geojson_file)
    LOG.info('Successfully read %s features.', geojson_builder.feature_count)

    # Loop through the stored features and write the center coordinates.
    # Ensure that only one feature maps to a given feature ID.
    centroids = []
    for feature_id, features in geojson_builder.feature_mapping.items():
        assert len(features) == 1 or not any(feature_id), (
            'All features should have unique property values. Multiple '
            'features exist for feature ID: %s' % str(feature_id)
        )
        feature = features[0]
        output_row = get_center(feature.shape, feature_id)
        output_row.update(feature.properties)
        centroids.append(output_row)

    LOG.info('Successfully found the centroids for %s features.', len(centroids))
    return centroids


def main():
    Flags.PARSER.add_argument(
        '--input_geojson_file',
        type=str,
        required=True,
        help='GeoJson file to compute centroids from.',
    )
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='CSV file to store centroids in'
    )
    Flags.InitArgs()

    centroids = get_centroids(Flags.ARGS.input_geojson_file)
    with open(Flags.ARGS.output_file, 'w') as output_file:
        # Setup the output CSV.
        output_fields = HIERARCHICAL_DIMENSIONS + [LAT_KEY, LON_KEY]
        writer = UnicodeDictWriter(
            output_file,
            fieldnames=output_fields,
            extrasaction='ignore',
            lineterminator='\n',
        )
        writer.writeheader()

        for centroid in centroids:
            writer.writerow(centroid)

        LOG.info('Successfully wrote the centroids.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
