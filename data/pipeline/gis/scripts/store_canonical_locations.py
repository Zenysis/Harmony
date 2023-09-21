#!/usr/bin/env python
import sys

from pylib.base.flags import Flags
from pyproj import Proj

from config.datatypes import DimensionFactoryType
from data.pipeline.gis.canonical_geojson_builder import CanonicalGeojsonBuilder
from log import LOG

# The number of decimal degrees we should truncate the final lat/lon values to.
# Six decimal places is accurate up to 0.11 meters, which is fine for us.
DEFAULT_NUM_DEGREES = 6

# Choose a small distance that balances shape point reduction with preservation
# of the original figure.
DEFAULT_SIMPLIFY_TOLERANCE = 0.001


def main():
    Flags.PARSER.add_argument(
        '--input_geojson_file',
        type=str,
        required=True,
        help='GeoJson file needing canonical location ' 'data to be stored',
    )
    Flags.PARSER.add_argument(
        '--num_degrees',
        type=int,
        required=False,
        default=DEFAULT_NUM_DEGREES,
        help='The number of decimal degrees we should '
        'truncate the final lat/lon values to. If a '
        'value < 0 is specified, coordinates will '
        'not be rounded.',
    )
    Flags.PARSER.add_argument(
        '--simplify_tolerance',
        type=float,
        required=False,
        default=DEFAULT_SIMPLIFY_TOLERANCE,
        help='The distance between shape points that can '
        'be used to simplify a shape and reduce '
        'file size. If a value < 0 is specified, '
        'simplification will be skipped.',
    )
    Flags.PARSER.add_argument(
        '--input_projection',
        type=str,
        required=False,
        default=None,
        help='The projection of the input geojson file '
        'that must be converted. If omitted, the '
        'coordinate system will not change.',
    )
    Flags.PARSER.add_argument(
        '--location_mapping',
        type=str,
        required=True,
        help='Canonical location mapping file',
    )
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='Processed data output file'
    )
    Flags.InitArgs()

    # Disable coordinate truncation if the num_degrees is below 0.
    num_degrees = Flags.ARGS.num_degrees
    if num_degrees < 0:
        num_degrees = None

    # Disable simplification if the tolerance level is below 0.
    simplify_tolerance = Flags.ARGS.simplify_tolerance
    if simplify_tolerance < 0:
        simplify_tolerance = None

    # If a coordinate system is specified, convert from the input projection
    # system into the projection system that can be displayed on a map.
    start_proj = end_proj = None
    input_projection_str = Flags.ARGS.input_projection
    if input_projection_str:
        # The input projection can either be the EPSG ID (like `epsg:4326`) or a full
        # projection definition (like `+proj=tmerc +lat_0=0 ...`).
        # Convert the input projection str in
        if input_projection_str.lower().startswith('epsg:'):
            input_projection_str = f'+init={input_projection_str}'
        start_proj = Proj(input_projection_str)
        end_proj = Proj(init='epsg:4326')

    LOG.info('Starting canonical geojson creation')
    mapped_dimension_collector = DimensionFactoryType.create_metadata_collector(
        mapped_locations_filename=Flags.ARGS.location_mapping
    )
    geojson_builder = CanonicalGeojsonBuilder(mapped_dimension_collector)
    geojson_builder.read_geojson_file(Flags.ARGS.input_geojson_file)
    input_count = geojson_builder.feature_count

    # Merge all shapes that share the same canonical location.
    LOG.info('Starting feature merging')
    geojson_builder.merge()

    # Clean the merged shapes, convert the coordinates into rounded lat/lon,
    # and simplify so that the output geojson file is compact.
    LOG.info('Finished feature merging. Finalizing feature coordinates.')

    geojson_builder.finalize(simplify_tolerance, num_degrees, start_proj, end_proj)
    geojson_builder.write_geojson_file(Flags.ARGS.output_file)

    LOG.info('Finished updating geojson file')
    LOG.info('Input shapes: %s', input_count)
    LOG.info('Input locations: %s', geojson_builder.unique_location_count)
    LOG.info('Output shapes: %s', geojson_builder.feature_count)
    return 0


if __name__ == '__main__':
    sys.exit(main())
