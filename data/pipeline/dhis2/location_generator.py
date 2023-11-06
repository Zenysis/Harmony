#!/usr/bin/env python
import csv

from collections import defaultdict
from slugify import slugify

from util.pipeline.database_dump import flatten_self_referential_table

LEVEL_ENDPOINT = 'organisationUnitLevels'
OU_ENDPOINT = 'organisationUnits'
LEVEL_FIELDS = ['level', 'name']
OU_FIELDS = ['name', 'id', 'parent', 'level', 'children', 'leaf']

BASE_LOCATION_RESOURCE_MAP = {LEVEL_ENDPOINT: LEVEL_FIELDS, OU_ENDPOINT: OU_FIELDS}


def build_location_dimension_lookup(dimension_resources):
    # build a lookup of location id to a dictionary of dimensions: value
    location_dimension_lookup = defaultdict(dict)
    dimensions = dimension_resources['organisationUnitGroupSets']
    dimension_values = {
        d['id']: d for d in dimension_resources['organisationUnitGroups']
    }
    dimension_columns = []
    for dimension in dimensions:
        dimension_id = dimension['id']
        dimension_name = slugify(dimension['displayName'], separator='_')
        dimension_columns.append(dimension_name)
        for dimension_set in dimension['organisationUnitGroups']:
            # Some of these are hidden
            dimension_value = dimension_values.get(dimension_set['id'])
            if not dimension_value:
                print('Dimension value is hidden for id: ', dimension_set['id'])
                continue
            dimension_value_name = dimension_value['displayName']
            for location in dimension_value['organisationUnits']:
                location_id = location['id']
                location_dimension_lookup[location_id][
                    dimension_name
                ] = dimension_value_name
                if dimension_name in location_dimension_lookup[location_id]:
                    print(
                        'Location: %s has multiple values for dimension: %s'
                        % (location_id, dimension_name)
                    )
    return location_dimension_lookup, dimension_columns


class LocationGenerator:
    def __init__(self, resources, hierarchy, overwrite_leaves=False):
        self.hierarchy = hierarchy
        self.organisation_units, self.location_lookup = self._flatten_locations(
            resources[OU_ENDPOINT]
        )
        self.hierarchy_map = self._create_hierarchy_map(resources[LEVEL_ENDPOINT])
        self.leaf_level = max(self.hierarchy_map.keys())
        self.overwrite_leaves = overwrite_leaves
        self._locations = self._get_output_locations()

    def _create_hierarchy_map(self, levels):
        # Create a lookup of level number to name ie {1: CountryName, 2: RegionName, ...}
        level_map = {}
        assert len(levels) == len(
            self.hierarchy
        ), 'Dhis2 has %d levels while the hierarchy has %d' % (
            len(levels),
            len(self.hierarchy),
        )
        for level in levels:
            level_number = level['level']
            level_map[level_number] = self.hierarchy[level_number - 1]
        return level_map

    @staticmethod
    def _flatten_locations(organisation_units):
        # Flatten the locations so that parent isn't a dictionary and is a regular id
        flattened_locations = []
        location_lookup = {}
        for location in organisation_units:
            location['parent'] = location.get('parent', {}).get('id', '')
            flattened_locations.append(location)
            location_lookup[location['id']] = location
        return flattened_locations, location_lookup

    def should_overwrite_leaf(self, formatted_loc):
        return formatted_loc['leaf'] and formatted_loc['level'] is not self.leaf_level

    def _get_output_locations(self):
        # Create the output locations with keys:
        # {id: id_0, level: n, hierarchy_1: h_0, hierarchy_2: h_2, ...}
        output_locations = []
        # Find each locations parents and grandparents and add it's name to the location.
        # returns {id: {1: level_1_name, 2: level_2_name, ...}}
        locations = flatten_self_referential_table(
            self.organisation_units, 'id', 'level', 'parent', 'name'
        )
        for location_id in locations:
            # The highest (most granular) level in the hierarchy is the last level with values
            level = self.location_lookup[location_id][
                'level'
            ]  # max(locations[location_id].keys())
            leaf = self.location_lookup[location_id]['leaf']
            formatted_loc = {'id': location_id, 'level': level, 'leaf': leaf}
            for loc in locations[location_id]:
                if int(loc) <= len(self.hierarchy):
                    formatted_loc[self.hierarchy_map[loc]] = locations[location_id][loc]
            if self.overwrite_leaves and self.should_overwrite_leaf(formatted_loc):
                # move the leaf to the leaf column
                formatted_loc[self.hierarchy_map[self.leaf_level]] = formatted_loc[
                    self.hierarchy_map[level]
                ]
                formatted_loc[self.hierarchy_map[level]] = None
                formatted_loc['level'] = self.leaf_level
            output_locations.append(formatted_loc)
        return output_locations

    def write_output_facilities(self, file_name, extra_columns=None):
        # Write all locations.
        columns = ['level', 'id'] + self.hierarchy
        if extra_columns:
            columns.extend(extra_columns)

        with open(file_name, 'w') as output_locations:
            print('Starting writing locations...')
            location_writer = csv.DictWriter(
                output_locations, fieldnames=columns, extrasaction='ignore'
            )
            location_writer.writeheader()
            for location in self._locations:
                location_writer.writerow(location)
        print('Finished Writing locations...')

    def write_output_facilities_with_dimensions(
        self, file_name, location_dimension_lookup, header_columns=None
    ):
        # Write all locations.
        columns = ['level', 'id'] + header_columns

        with open(file_name, 'w') as output_locations:
            print('Starting writing locations...')
            location_writer = csv.DictWriter(
                output_locations, fieldnames=columns, extrasaction='ignore'
            )
            location_writer.writeheader()
            for location in self._locations:
                location_id = location['id']
                for dimension in location_dimension_lookup[location_id]:
                    location[dimension] = location_dimension_lookup[location_id][
                        dimension
                    ]
                location_writer.writerow(location)
        print('Finished Writing locations...')
