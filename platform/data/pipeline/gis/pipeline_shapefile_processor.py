from pylib.base.flags import Flags
from data.pipeline.datatypes.dimension_collector_io import write_hierarchical_dimensions
from data.pipeline.gis.shapefile_processor import ShapefileProcessor
from log import LOG


class PipelineShapefileProcessor:
    INPUT_FLAGS_ADDED = False
    OUTPUT_FLAGS_ADDED = False

    def __init__(
        self,
        dimension_cleaner,
        raw_dimension_prefix,
        clean_dimension_prefix,
        shapefile_processor=None,
    ):
        self._dimension_cleaner = dimension_cleaner
        self._raw_dimension_prefix = raw_dimension_prefix
        self._clean_dimension_prefix = clean_dimension_prefix
        self._processor = shapefile_processor or ShapefileProcessor(dimension_cleaner)
        self._input_shape_count = 0

    def run(
        self,
        base_shapefile_path=None,
        output_file=None,
        location_file=None,
        supplemental_geojson_file=None,
        validate_counts=True,
    ):
        self.preprocess_supplemental_shapes(supplemental_geojson_file)
        self.process_shapefile(base_shapefile_path)
        self.write_dimensions(location_file, validate_counts)
        self.write_geojson(output_file)
        self.print_stats()

    def preprocess_supplemental_shapes(self, geojson_file_override):
        '''Ingest supplemental shapes from a prebuilt geojson file.

        Some deployments need additional shapes to be added that are not
        included in the original shapefile. This might be needed if the original
        shapefile is 99% complete but missing a small number of shapes to be
        fully useful. Or the original shapefile might have all shapes needed but
        could be missing an extra boundary that is required for political
        reasons.

        The supplemental shapes geojson should store the exact dimension names
        in the file and should not require remapping.
        '''
        geojson_file = self.supplemental_geojson_file(geojson_file_override)
        if not geojson_file:
            return

        # Read in the supplemental shapes first so we can easily capture the new
        # location information.
        LOG.info('Reading supplemental shape definitions')
        geojson_builder = self._processor.geojson_builder
        geojson_builder.read_geojson_file(geojson_file)

        # Collect the supplemental shapes' dimensions directly since they are
        # added to the geojson_builder manually and not through the
        # ShapefileProcessor.
        supplemental_count = 0
        dimension_mapping = (
            self._dimension_cleaner.dimension_collector.dimension_name_to_row_mapping
        )
        for feature in geojson_builder.features_iterator():
            # NOTE: We need to flip the row since the dimension
            # cleaner/collector expects the row's properties to match the
            # renamed version (if it exists).
            row = {}
            for dimension, value in feature.properties.items():
                key = dimension_mapping.get(dimension, dimension)
                row[key] = value

            self._dimension_cleaner.process_row(row)
            supplemental_count += 1
        LOG.info('Found %s supplemental shapes', supplemental_count)
        self._input_shape_count += supplemental_count

    def process_shapefile(self, shapefile_path_override=None):
        shapefile_path = self.base_shapefile_path(shapefile_path_override)
        LOG.info('Beginning shapefile processing')

        # Process the deployment's shapefile.
        input_shape_count = self._processor.process_shapefile(shapefile_path)
        LOG.info('Shapes processed: %s', input_shape_count)
        self._input_shape_count += input_shape_count

    def _log_duplicate_locations(self) -> None:
        '''Log which locations are duplicates for debugging. The default GeojsonBuilder
        uses the same feature id for all features, so this code builds a key from the
        properties to be able to detect features with the same location.'''
        for feature_list in self._processor.geojson_builder.feature_mapping.values():
            keys_seen = set()
            if len(feature_list) > 1:
                for feature in feature_list:
                    key = '__'.join(feature.properties.values())
                    if key in keys_seen:
                        LOG.error('Duplicate location: %s', feature.properties)
                    else:
                        keys_seen.add(key)

    def write_dimensions(self, location_file_override=None, validate_counts=True):
        location_file = self.location_path(location_file_override)
        output_shape_count = self._processor.shape_count
        LOG.info('Shapes found: %s', output_shape_count)

        location_count = (
            self._dimension_cleaner.dimension_collector.hierarchical_dimension_count
        )

        if location_count != output_shape_count:
            error_msg = (
                'Number of output shapes does not match number of '
                f'locations! Location count: {location_count}\t'
                f'Shape count: {output_shape_count}'
            )
            if validate_counts:
                self._log_duplicate_locations()
                assert False, error_msg
            else:
                LOG.error(error_msg)

        LOG.info('Writing locations')
        write_hierarchical_dimensions(
            self._dimension_cleaner.dimension_collector,
            location_file,
            self._raw_dimension_prefix,
            self._clean_dimension_prefix,
        )

    def write_geojson(self, output_file_override=None):
        LOG.info('Writing geojson')
        output_file = self.output_path(output_file_override)
        self._processor.geojson_builder.write_geojson_file(output_file)

    def print_stats(self):
        location_count = (
            self._dimension_cleaner.dimension_collector.hierarchical_dimension_count
        )
        LOG.info('Finished shapefile processing')
        LOG.info('Input shapes: %s', self._input_shape_count)
        LOG.info('Output shapes: %s', self._processor.shape_count)
        LOG.info('Locations written: %s', location_count)

    @classmethod
    def setup_flags(cls):
        cls.setup_input_flags()
        cls.setup_output_flags()

    @classmethod
    def setup_input_flags(cls):
        Flags.PARSER.add_argument(
            '--base_shapefile_path',
            type=str,
            required=True,
            help='Path to shape files with common name ' '(excluding extension)',
        )
        Flags.PARSER.add_argument(
            '--supplemental_geojson_file',
            type=str,
            required=False,
            default=None,
            help='Path to geojson file containing '
            'additional shapes to include. Optional',
        )
        cls.INPUT_FLAGS_ADDED = True

    @classmethod
    def setup_output_flags(cls):
        Flags.PARSER.add_argument(
            '--output_file', type=str, required=True, help='Processed data output file'
        )
        Flags.PARSER.add_argument(
            '--location_list',
            type=str,
            required=True,
            help='Output list of locations for matching',
        )
        cls.OUTPUT_FLAGS_ADDED = True

    def base_shapefile_path(self, override=None):
        if override:
            return override
        return Flags.ARGS.base_shapefile_path if self.INPUT_FLAGS_ADDED else None

    def supplemental_geojson_file(self, override=None):
        if override:
            return override
        return Flags.ARGS.supplemental_geojson_file if self.INPUT_FLAGS_ADDED else None

    def output_path(self, override=None):
        if override:
            return override
        return Flags.ARGS.output_file if self.OUTPUT_FLAGS_ADDED else None

    def location_path(self, override=None):
        if override:
            return override
        return Flags.ARGS.location_list if self.OUTPUT_FLAGS_ADDED else None
