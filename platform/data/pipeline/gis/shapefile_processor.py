import shapefile

from data.pipeline.gis.geojson_builder import (
    create_geojson_feature_dict,
    GeojsonFeature,
    GeojsonBuilder,
)
from log import LOG


class ShapefileProcessor:
    '''Base shapefile processing class.

    This is used for creating a geojson file from a gis shapefile and storing
    the locations found.
    '''

    def __init__(
        self,
        dimension_cleaner,
        shapefile_fields=None,
        geojson_builder=None,
        ignored_records=None,
    ):
        self._dimension_cleaner = dimension_cleaner
        self._geojson_builder = geojson_builder or GeojsonBuilder()
        self._ignored_records = ignored_records
        self.update_fields(shapefile_fields)

    @property
    def geojson_builder(self):
        return self._geojson_builder

    def update_fields(self, shapefile_fields):
        self._field_index = self.build_field_mapping(shapefile_fields)

    def build_field_mapping(self, shapefile_fields):
        '''Build a mapping from index to field name.

        This method can be overridden if more complex behavior is needed.
        '''
        output = {}
        if shapefile_fields:
            # Skip the first field ('DeletionFlag') since it is never included
            # in the shape properties. This is common across many different
            # shapefiles seen.
            if shapefile_fields[0][0] == 'DeletionFlag':
                shapefile_fields = shapefile_fields[1:]

            for idx, field_metadata in enumerate(shapefile_fields):
                key = field_metadata[0]
                output[key] = idx
        return output

    def process_shape(self, shape_record):
        '''Convert the provided shapely shape record into a geojson shape.

        The shape geometry will be extracted from the shape record, and all
        location properties will be built from it.
        '''
        shape_geometry = self.build_geojson_shape_geometry(shape_record)
        if not shape_geometry:
            LOG.error('Missing geo interface for shape: %s', shape_record.record)
            return

        properties = self.extract_shape_properties(shape_record)
        if not self.include_shape(properties):
            LOG.debug('Skipping shape with properties: %s', properties)
            return

        dimensions = self._dimension_cleaner.process_row(properties)
        if not dimensions:
            LOG.error('No location record was built for shape: %s', shape_record.record)
            return

        self._geojson_builder.add_feature(
            GeojsonFeature.from_dict(
                create_geojson_feature_dict(dimensions, shape_geometry)
            )
        )

    def include_shape(self, shape_properties):
        if not self._ignored_records:
            return True

        for key, values in self._ignored_records.items():
            if shape_properties.get(key) in values:
                return False
        return True

    def extract_shape_properties(self, shape_record):
        '''Extract and return the stored shape record's internal record.

        Convert a shapely shape record's internal record from an index based
        mapping (from field index to value) into a mapping from field name to
        value.
        '''
        output = {}
        record = shape_record.record

        # Output shape properties with the desired field name
        for key, idx in self._field_index.items():
            # Replace NULL bytes that might exist on the record since some shapefiles
            # store properties as fixed width with NULL bytes filling the space between
            # the last character and the column width.
            value = record[idx]
            if isinstance(value, str):
                if '\x00' in value:
                    value = value.replace('\x00', '')
            else:
                value = str(value)
            output[key] = value
        return output

    @staticmethod
    def build_geojson_shape_geometry(shape_record):
        '''Build a geojson shape geometry from a shapely shape record.'''
        if not shape_record.shape.__geo_interface__:
            return None

        geo_interface = shape_record.shape.__geo_interface__
        return {
            'type': geo_interface['type'],
            'coordinates': geo_interface['coordinates'],
        }

    def process_shapefile(self, shapefile_path):
        '''Process the stored shapefile and create GeojsonFeature's from it.

        The shapefile path can be a concrete path to a shapefile (.shp file) or
        to a directory containing a .shp file and other exported property files
        (like .dbf, .prj, .shx, etc.).

        @return the number of shapes processed.
        '''
        LOG.info('Processing: %s', shapefile_path)
        sf = shapefile.Reader(shapefile_path)
        self.update_fields(sf.fields)

        shape_count = 0
        for s in sf.iterShapeRecords():
            self.process_shape(s)
            shape_count += 1
        return shape_count

    @property
    def shape_count(self):
        return self._geojson_builder.feature_count
