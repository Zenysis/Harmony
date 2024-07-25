#!/usr/bin/env python
# Simple script to convert a shapefile into geojson and collect the location
# properties for each shape.
import sys

from collections import defaultdict

from pylib.base.flags import Flags

from config.datatypes import DimensionFactoryType
from data.pipeline.datatypes.dimension_collector_io import (
    write_non_hierarchical_dimensions,
)
from data.pipeline.gis.pipeline_shapefile_processor import PipelineShapefileProcessor
from data.pipeline.gis.shapefile_processor import ShapefileProcessor


def main():
    Flags.PARSER.add_argument(
        '--rename_dimensions',
        type=str,
        nargs='*',
        required=False,
        default={},
        help='Optional mappings for renaming shapefile properties names into '
        'the desired dimension name, formatted as "OriginalName:NewName". '
        'For example: region_name:RegionName',
    )
    Flags.PARSER.add_argument(
        '--ignore_shapes',
        type=str,
        nargs='*',
        required=False,
        default={},
        help='Optional mappings for ignoring shapes that have matching '
        'property values to this input. The property name should match '
        'the raw shape record\'s properties and is not restricted to '
        'dimensions alone. Formatted as "PropertyName:PropertyValue". '
        'For example: region_name:Oromiya',
    )
    Flags.PARSER.add_argument(
        '--skip_location_validation',
        action='store_true',
        default=False,
        help='If set, instructs the processor to not fail if the shape count does not '
        'match the number of locations found.',
    )
    Flags.PARSER.add_argument(
        '--output_non_hierarchical',
        type=str,
        required=bool(DimensionFactoryType.non_hierarchical_dimensions),
        help='Path to output non-hierarchical dimension values.',
    )
    PipelineShapefileProcessor.setup_flags()
    Flags.InitArgs()

    validate_counts = not Flags.ARGS.skip_location_validation
    dimension_to_property = {}
    for rename in Flags.ARGS.rename_dimensions:
        (input_property, dimension) = rename.split(':')
        dimension_to_property[dimension] = input_property

    shapes_to_skip = defaultdict(set)
    for value in Flags.ARGS.ignore_shapes:
        (property_name, property_value) = value.split(':')
        shapes_to_skip[property_name].add(property_value)

    dimension_cleaner = DimensionFactoryType.DimensionCleaner(dimension_to_property)

    shapefile_processor = ShapefileProcessor(
        dimension_cleaner, ignored_records=shapes_to_skip
    )
    processor = PipelineShapefileProcessor(
        dimension_cleaner,
        DimensionFactoryType.raw_prefix,
        DimensionFactoryType.clean_prefix,
        shapefile_processor,
    )

    if Flags.ARGS.output_non_hierarchical:
        # pylint: disable=not-callable
        cleaner = DimensionFactoryType.DimensionCleaner()
        collector = cleaner.dimension_collector
        write_non_hierarchical_dimensions(
            collector,
            Flags.ARGS.output_non_hierarchical,
            DimensionFactoryType.raw_prefix,
            DimensionFactoryType.clean_prefix,
        )

    processor.run(validate_counts=validate_counts)
    return 0


if __name__ == '__main__':
    sys.exit(main())
