from csv import DictReader, DictWriter
from collections import defaultdict

from fuzzywuzzy import process

from log import LOG


def _get_key(dimensions, row):
    if not dimensions:
        return ''
    return '__'.join([row[dimension] for dimension in dimensions])


def _write_table(output_filename, table_data, fieldnames):
    with open(output_filename, 'w') as output_file:
        writer = DictWriter(output_file, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(table_data)


class MatchingSuggestionBuilder:
    def __init__(self, dimension_ordering, canonical_prefix, cleaned_prefix):
        self.dimension_ordering = dimension_ordering
        self.location_types_lookup = {
            level: i + 1 for i, level in enumerate(dimension_ordering)
        }
        self.canonical_prefix = canonical_prefix
        self.cleaned_prefix = cleaned_prefix
        self.canonical_id_lookup = {}
        self.name_lookup = {}
        self.hierarchy = defaultdict(set)
        self.current_id = 0
        self.hierarchy_by_level = defaultdict(set)
        self.unmatched_locations = []
        self.seen_unmatched_location_keys = set()

    def get_sibling_suggestions(self, unmatched_id, name, parent_key):
        parent_id = self.canonical_id_lookup[parent_key]
        potential_name_lookup = {
            self.name_lookup[i]: i for i in self.hierarchy[parent_id]
        }
        suggested_names = (
            process.extract(name.strip(), list(potential_name_lookup.keys()), limit=5)
            if len(potential_name_lookup.keys())
            else []
        )
        suggested_ids = [potential_name_lookup[sn[0]] for sn in suggested_names]
        suggestions = []
        for s_id in suggested_ids:
            suggestions.append({'canonical_id': s_id, 'unmatched_id': unmatched_id})
        return suggestions

    def get_suggestions(self, unmatched_id, name, dimension):
        # If an unmatched location doesnt have a matched parent, then search all
        # locations at that heierarchy level for suggestions.
        potential_name_lookup = {
            self.name_lookup[i]: i for i in self.hierarchy_by_level[dimension]
        }
        suggested_names = (
            process.extract(name.strip(), list(potential_name_lookup.keys()), limit=5)
            if len(potential_name_lookup.keys())
            else []
        )
        suggested_ids = [potential_name_lookup[sn[0]] for sn in suggested_names]
        suggestions = []
        for s_id in suggested_ids:
            suggestions.append({'canonical_id': s_id, 'unmatched_id': unmatched_id})
        return suggestions

    def get_location_types(self):
        return [
            {'id': i, 'name': level} for level, i in self.location_types_lookup.items()
        ]

    def get_parent_id(self, row, ancestor_keys):
        parent_keys = ancestor_keys[:-1]
        parent_key = _get_key(parent_keys, row)

        while parent_key not in self.canonical_id_lookup and len(parent_keys):
            parent_keys = parent_keys[:-1]
            parent_key = _get_key(parent_keys, row)
        return self.canonical_id_lookup.get(parent_key, None)

    def get_canonical_locations(self, dimension_map):
        canonical_locations = []
        mapped_locations = []
        for i, dimension in enumerate(self.dimension_ordering):
            dimension_keys = self.dimension_ordering[: (i + 1)]
            type_id = self.location_types_lookup[dimension]
            with open(dimension_map[dimension], 'r') as dimension_file:
                dimension_reader = DictReader(dimension_file)
                for row in dimension_reader:
                    key = _get_key(dimension_keys, row)
                    # parent_key = _get_key(dimension_keys[:-1], row)
                    # parent_id = self.canonical_id_lookup.get(parent_key, None)
                    parent_id = self.get_parent_id(row, dimension_keys)
                    location_id = self.current_id
                    self.hierarchy_by_level[dimension].add(location_id)
                    self.current_id += 1
                    name = row[dimension]
                    self.canonical_id_lookup[key] = location_id
                    self.hierarchy[parent_id].add(location_id)
                    self.name_lookup[location_id] = name
                    for key in [key for key in row.keys() if key.startswith('match_')]:
                        unmatched_id = self.current_id
                        unmatched_location_key = '%s_%s_%s' % (
                            row[key],
                            parent_id,
                            type_id,
                        )
                        if (
                            unmatched_location_key
                            not in self.seen_unmatched_location_keys
                            and row[key]
                        ):
                            self.unmatched_locations.append(
                                {
                                    'id': unmatched_id,
                                    'name': row[key],
                                    'parent_id': parent_id,
                                    'type_id': type_id,
                                    'source_id': None,
                                }
                            )
                            mapped_locations.append(
                                {
                                    'canonical_id': location_id,
                                    'unmatched_id': unmatched_id,
                                }
                            )

                            self.current_id += 1
                        self.seen_unmatched_location_keys.add(unmatched_location_key)
                    canonical_locations.append(
                        {
                            'id': location_id,
                            'name': name,
                            'parent_id': parent_id,
                            'type_id': type_id,
                        }
                    )
        return canonical_locations, mapped_locations

    def get_location_level(self, row):
        most_filled = 0
        for i, dimension in enumerate(self.dimension_ordering):
            clean_dimension = '%s%s' % (self.cleaned_prefix, dimension)
            if row[clean_dimension]:
                most_filled = i
        return most_filled

    def get_all_unmatched(self, row, source_id):
        # for a row add all unmatched locaitons
        # if both clean and canonical are empty there is a location lower
        # in the hierarchy

        # get most granular level with text.
        most_filled = self.get_location_level(row)
        unmatched_locations = []
        suggestions = []
        # for each level up until and incldiing it figure out if it is matched.
        for dimension_level in range(0, most_filled + 1):
            dimension = self.dimension_ordering[dimension_level]
            canonical_dimension = '%s%s' % (self.canonical_prefix, dimension)
            clean_dimension = '%s%s' % (self.cleaned_prefix, dimension)
            if not row[canonical_dimension] and row[clean_dimension]:
                dimension_keys = [
                    '%s%s' % (self.canonical_prefix, d)
                    for d in self.dimension_ordering[: (dimension_level + 1)]
                ]
                parent_key = _get_key(dimension_keys[:-1], row)
                parent_id = self.get_parent_id(row, dimension_keys)
                location_id = self.current_id
                self.current_id += 1
                name = row[clean_dimension]
                type_id = self.location_types_lookup[dimension]
                unmatched_location_key = '%s_%s_%s' % (name, parent_id, type_id)
                if unmatched_location_key not in self.seen_unmatched_location_keys:
                    unmatched_locations.append(
                        {
                            'id': location_id,
                            'name': name,
                            'parent_id': parent_id,
                            'type_id': type_id,
                            'source_id': source_id,
                        }
                    )
                    location_suggestions = []
                    if parent_id and parent_key in self.canonical_id_lookup:
                        location_suggestions = self.get_sibling_suggestions(
                            location_id, name, parent_key
                        )
                    else:
                        location_suggestions = self.get_suggestions(
                            location_id, name, dimension
                        )
                    suggestions.extend(location_suggestions)
                self.seen_unmatched_location_keys.add(unmatched_location_key)
        return unmatched_locations, suggestions

    def get_outputs_from_sources(self, input_matches, sources):
        unmatched_locations = self.unmatched_locations
        table_sources = []
        suggestions = []
        for source_id, source in enumerate(sources):
            LOG.info('Processing source: %s', source_id)
            table_sources.append({'source_id': source_id, 'name': source})
            with open(input_matches.replace('#', source), 'r') as input_file:
                mapped_locations = DictReader(input_file)
                for i, row in enumerate(mapped_locations):
                    row_unmatched, row_suggestions = self.get_all_unmatched(
                        row, source_id
                    )
                    unmatched_locations.extend(row_unmatched)
                    suggestions.extend(row_suggestions)
            LOG.info('Finished processing source: %s', source_id)
        return unmatched_locations, table_sources, suggestions


class LocationMatchingTable:
    def __init__(self, data, fieldnames, location):
        self.data = data
        self.fieldnames = fieldnames
        self.location = location

    def write(self):
        _write_table(self.location, self.data, self.fieldnames)


class MatchingSuggestionRunner:
    def __init__(self, suggestion_builder, dimension_map):
        self.dimension_map = dimension_map
        self.suggestion_builder = suggestion_builder

    def run(self, sources, output_path, input_matches):
        LOG.info('Building canonical locations')
        canonical_locations, mapped_locations = self.suggestion_builder.get_canonical_locations(
            self.dimension_map
        )
        LOG.info('Getting location types')
        location_types = self.suggestion_builder.get_location_types()
        LOG.info('Processing sources')
        source_outputs = self.suggestion_builder.get_outputs_from_sources(
            input_matches, sources
        )
        LOG.info('Finished processing sources')
        unmatched_locations, table_sources, suggestions = source_outputs
        tables = [
            LocationMatchingTable(
                canonical_locations,
                ['id', 'name', 'parent_id', 'type_id'],
                output_path + 'canonical_locations.csv',
            ),
            LocationMatchingTable(
                unmatched_locations,
                ['id', 'name', 'parent_id', 'type_id', 'source_id'],
                output_path + 'unmatched_locations.csv',
            ),
            LocationMatchingTable(
                suggestions,
                ['canonical_id', 'unmatched_id'],
                output_path + 'suggested_matches.csv',
            ),
            LocationMatchingTable(
                location_types, ['id', 'name'], output_path + 'location_types.csv'
            ),
            LocationMatchingTable(
                table_sources, ['source_id', 'name'], output_path + 'sources.csv'
            ),
            LocationMatchingTable(
                mapped_locations,
                ['canonical_id', 'unmatched_id'],
                output_path + 'mapped_locations.csv',
            ),
        ]
        for table in tables:
            table.write()
