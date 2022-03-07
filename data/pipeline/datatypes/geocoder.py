from builtins import object
import csv


class Geocoder(object):
    '''Collect all the lat/lon coordinates that apply for a canonical location.

    Args:
        mapping_files: Dictionary mapping a dimension to its canonical locations
            file location.
        geo_order: Ordered list of geo dimensions from least specific to most
            specific.
        geo_to_latlng: Dictionary mapping a geo dimension to a tuple of its
            (lat, lon) dimensions.
    '''

    def __init__(self, mapping_files: dict, geo_order: list, geo_to_latlng: list):
        self._table = {}
        self.geo_order = geo_order
        self.geo_to_latlng = geo_to_latlng

        self._check_dimension_log_lat(mapping_files)

    def _check_dimension_log_lat(self, mapping_files):
        for dimension in self.geo_order:
            assert dimension in self.geo_to_latlng, (
                'All geo dimensions must have corresponding lat/lon fields '
                'defined. Geo dimension: %s\tLat/lon dimensions: %s'
                % (dimension, self.geo_to_latlng)
            )
            self._process_file(mapping_files[dimension], dimension)

    def geocode(self, location_dict):
        '''Return the lat/lon values that apply for this location.

        Args:
            location_dict: Flat dictionary containing all the canonical
                locations to retrieve lat/lon data for.
        '''
        return self._table.get(self._build_key(location_dict), {})

    def _process_file(self, filename, dimension):
        '''Capture and store the lat/lon data for this dimension.'''
        with open(filename, 'r') as input_file:
            reader = csv.DictReader(input_file)
            has_parent = self.geo_order.index(dimension) > 0
            (lat_dimension, lon_dimension) = self.geo_to_latlng[dimension]
            for row in reader:
                new_row = {
                    lat_dimension: float(row[lat_dimension] or '0.0'),
                    lon_dimension: float(row[lon_dimension] or '0.0'),
                }

                # Merge in the parent location data.
                if has_parent:
                    parent_key = self._build_parent_key(row, dimension)
                    new_row.update(self._table[parent_key])

                # Store this new canonical locations data.
                key = self._build_key(row)
                self._table[key] = new_row

    def _build_key(self, row):
        return tuple([row.get(f) or '' for f in self.geo_order])

    def _build_parent_key(self, input_row, cur_level):
        '''Build the location key for this row's parent level.'''
        row = dict(input_row)
        row.pop(cur_level)
        return self._build_key(row)
