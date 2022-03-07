from builtins import range
from builtins import object
from config.aggregation import GEO_FIELD_ORDERING


class LocationInfoBuilder(object):
    '''Creates a csv file of unified locations. Which essentially maps a unique location
    id (int) to a combination of different granularity names (str) (rzwf).
    '''

    def __init__(self, unified_locations):
        self.unified_locations = unified_locations.fillna('')
        self._id_lookup = self._build_inverted_id_lookup()
        self.types_built = self._build_location_type()

    def _build_location_type(self):
        types = []
        for _, row in self.unified_locations.iterrows():
            found = False
            for i in range(len(GEO_FIELD_ORDERING) - 1, -1, -1):
                if row[GEO_FIELD_ORDERING[i]]:
                    types.append(i)
                    found = True
                    break
            if not found:
                raise ValueError('No name found for row: %s' % row)

        self.unified_locations['type_id'] = types
        return True

    def _build_inverted_id_lookup(self):
        print('Building ID lookup.')
        id_lookup = {}
        for index, row in self.unified_locations.iterrows():
            key = tuple(row[GEO_FIELD_ORDERING].fillna(''))
            id_lookup[key] = index
        print('Finished building ID lookup.')
        return id_lookup

    def build_geoloc(self, geocoder):
        lat = []
        lng = []
        for _, row in self.unified_locations.iterrows():
            key = row[GEO_FIELD_ORDERING].fillna('').to_dict()
            geo_loc = geocoder.geocode(key)

            level = GEO_FIELD_ORDERING[row['type_id']].replace('Name', '')
            lat.append(geo_loc.get('%sLat' % level, 0.0))
            lng.append(geo_loc.get('%sLon' % level, 0.0))
        self.unified_locations['lat'] = lat
        self.unified_locations['lng'] = lng

    def build_parent_id(self):
        parent_ids = []
        for _, row in self.unified_locations.iterrows():
            parent_key = tuple(row[GEO_FIELD_ORDERING[: row['type_id']]])
            parent_key += ('',) * (4 - len(parent_key))
            if parent_key in self._id_lookup:
                parent_id = self._id_lookup[parent_key]
            else:
                print('No Parent: ', row)
                parent_id = self._id_lookup[tuple(row[GEO_FIELD_ORDERING])]
            parent_ids.append(parent_id)
        self.unified_locations['parent_id'] = parent_ids

    def build_names(self):
        names = []
        for _, row in self.unified_locations.iterrows():
            name = row[GEO_FIELD_ORDERING[row['type_id']]]
            names.append(name)
        self.unified_locations['name'] = names

    def write_unified_locations(self, file_name):
        self.unified_locations.reset_index(inplace=True)
        self.unified_locations.rename(columns={'LocationID': 'id'}, inplace=True)
        columns = ['name', 'id', 'type_id', 'parent_id', 'lat', 'lng']
        self.unified_locations[columns].to_csv(file_name, index=False)
