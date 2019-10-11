# pylint: disable=C0103,E1101,R0201,E0401,C0413,C0411
from future import standard_library

standard_library.install_aliases()
from collections import defaultdict
from http.client import NO_CONTENT

from flask import current_app
from flask_potion import fields
from flask_potion.routes import Route

from models.alchemy.location import (
    CanonicalLocations,
    LocationTypes,
    UnmatchedLocations,
    UserMatches,
    SuggestedMatches,
    MappedLocations,
    Sources,
    FlaggedLocations,
)
from web.server.api.api_models import PrincipalResource
from web.server.data.data_access import Transaction


LOCATION_ENUM = current_app.zen_config.datatypes.LocationTypeEnum
LOCATION_TYPES = current_app.zen_config.datatypes.LOCATION_TYPES
PARENT_LOOKUP = current_app.location_hierarchy.parent_lookup
CANONICAL_LOCATIONS = current_app.location_hierarchy.canonical_locations


def get_id_from_lookup(lookup, id):
    if id and id in lookup:
        return lookup[id]
    return []


def unpack_children(canonical_location, matches_by_id):
    children = []
    canonical_children = canonical_location.children
    for child in canonical_children:
        node = canonical_children[child]
        node_children = unpack_children(node, matches_by_id)
        processed_node = {'name': node.name, 'matches': matches_by_id[node.id]}
        if len(node_children):
            processed_node['children'] = node_children
        children.append(processed_node)
    return children


class CanonicalLocationResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `CanonicalLocationResource`
    class.
    '''

    class Meta:
        model = CanonicalLocations

    class Schema:
        name = fields.String(description='The location name.', attribute='name')
        parent = fields.ItemUri(
            'web.server.api.location_api_models.CanonicalLocationResource',
            attribute='parent_id',
        )
        locationType = fields.Custom(
            fields.String(enum=LOCATION_TYPES),
            attribute='type_id',
            formatter=lambda type_id: LOCATION_ENUM(type_id).name.lower(),
            converter=lambda type_value: LOCATION_ENUM[type_value.upper()].value,
            nullable=False,
        )

    @Route.GET(
        '/count',
        title='Get Total Number of Canonical Locations',
        response_schema=fields.Integer(
            description='The total number of canonical locations'
        ),
    )
    # pylint: disable=R0201
    def canonical_count(self):
        return CanonicalLocations.query.count()

    @Route.GET('/hierarchy')
    def hierarchy(self):
        return dict(CANONICAL_LOCATIONS)

    @Route.GET('/ancestor_lookup')
    def parent_lookup(self):
        return dict(PARENT_LOOKUP)

    @Route.GET('/mfr_hierarchy')
    def mfr_hierarchy(self):
        matches_by_id = defaultdict(list)
        for mapped_location in MappedLocations.query.all():
            matches_by_id[mapped_location.canonical_id].append(
                {
                    'id': mapped_location.unmatched_id,
                    'name': mapped_location.unmatched.name,
                }
            )

        children = []
        query = CanonicalLocations.query.filter(CanonicalLocations.type_id == 1)
        for location in query.all():
            node_children = unpack_children(location, matches_by_id)
            processed_node = {
                'name': location.name,
                'matches': matches_by_id[location.id],
            }
            if len(node_children):
                processed_node['children'] = node_children
            children.append(processed_node)
        return {'name': 'root', 'children': children, 'matches': []}

    @Route.GET('/mfr_table')
    def mfr_table(self):
        matches_by_id = defaultdict(list)
        for mapped_location in MappedLocations.query.all():
            matches_by_id[mapped_location.canonical_id].append(
                {
                    'id': mapped_location.unmatched_id,
                    'name': mapped_location.unmatched.name,
                }
            )

        rows = []
        for location_level in CANONICAL_LOCATIONS:
            for location in CANONICAL_LOCATIONS[location_level]:
                row = {
                    LOCATION_ENUM(i + 2).name.lower(): level['name']
                    for i, level in enumerate(location)
                }
                row.update(
                    {
                        'match_%s' % i: m['name']
                        for i, m in enumerate(matches_by_id[location[-1]['id']])
                    }
                )
                rows.append(row)
        return rows


class LocationTypesResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `LocationTypes`
    class.
    '''

    class Meta:
        model = LocationTypes

    class Schema:
        name = fields.String(
            description='The Location type name, or hierarchy level name.',
            attribute='name',
        )

    @Route.GET('/unique')
    def unique_types(self):
        types = []
        for location_type in LocationTypes.query.all():
            types.append({'name': location_type.name, 'id': location_type.id})
        return types


class SourcesResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `LocationTypes`
    class.
    '''

    class Meta:
        model = Sources

    class Schema:
        name = fields.String(description='The Location source name.', attribute='name')

    @Route.GET('/unique')
    def unique_sources(self):
        sources = []
        for location_source in Sources.query.all():
            sources.append(
                {'name': location_source.name, 'id': location_source.source_id}
            )
        return sources


class UnmatchedLocationsResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `UnmatchedLocations`
    class.
    '''

    class Meta:
        model = UnmatchedLocations

    class Schema:
        name = fields.String(
            description='The unmatched locations name.', attribute='name'
        )
        parent = fields.ItemUri(
            'web.server.api.location_api_models.UnmatchedLocationsResource',
            attribute='parent_id',
        )
        locationType = fields.Custom(
            fields.String(enum=LOCATION_TYPES),
            attribute='type_id',
            formatter=lambda type_id: LOCATION_ENUM(type_id).name.lower(),
            converter=lambda type_value: LOCATION_ENUM[type_value.upper()].value,
            nullable=False,
        )

    @Route.GET(
        '/count',
        title='Get Total Number of Unmatched Locations',
        response_schema=fields.Integer(
            description='The total number of unmatched locations'
        ),
    )
    # pylint: disable=R0201
    def unmatched_count(self):
        return UnmatchedLocations.query.count() - MappedLocations.query.count()

    @Route.GET('/unmatched_suggestions')
    def unmatched_suggestions(self):
        output = []
        mapped_location_ids = set(ml.unmatched_id for ml in MappedLocations.query.all())
        flagged_location_ids = set(
            fl.unmatched_id for fl in FlaggedLocations.query.all()
        )
        for unmatched_location in UnmatchedLocations.query.all():
            if unmatched_location.id in mapped_location_ids:
                continue
            suggestions = [
                {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'ancestors': get_id_from_lookup(
                        PARENT_LOOKUP, suggestion.parent_id
                    ),
                }
                for suggestion in unmatched_location.suggestions
            ]
            matchSelected = None
            if len(unmatched_location.user_match):
                matches = [
                    match.canonical_id for match in unmatched_location.user_match
                ]
                matchSelected = matches[0]
            output.append(
                {
                    'name': unmatched_location.name,
                    'suggestions': suggestions,
                    'ancestors': get_id_from_lookup(
                        PARENT_LOOKUP, unmatched_location.parent_id
                    ),
                    'source': unmatched_location.source.name,
                    'id': unmatched_location.id,
                    'matchSelected': matchSelected,
                    'typeId': unmatched_location.type_id,
                    'isFlagged': unmatched_location.id in flagged_location_ids,
                }
            )
        return output

    @Route.GET('/unmatched_filter_structure')
    def unmatched_hierarchy(self):
        output = defaultdict(lambda: defaultdict(list))
        mapped_location_ids = set(ml.unmatched_id for ml in MappedLocations.query.all())
        flagged_location_ids = set(
            fl.unmatched_id for fl in FlaggedLocations.query.all()
        )
        for unmatched_location in UnmatchedLocations.query.all():
            if unmatched_location.id in mapped_location_ids:
                continue
            suggestions = [
                {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'ancestors': get_id_from_lookup(
                        PARENT_LOOKUP, suggestion.parent_id
                    ),
                }
                for suggestion in unmatched_location.suggestions
            ]
            matchSelected = None
            if len(unmatched_location.user_match):
                matches = [
                    match.canonical_id for match in unmatched_location.user_match
                ]
                matchSelected = matches[0]
            source_id = unmatched_location.source.source_id
            type_id = unmatched_location.type_id
            output[source_id][type_id].append(
                {
                    'name': unmatched_location.name,
                    'suggestions': suggestions,
                    'ancestors': get_id_from_lookup(
                        PARENT_LOOKUP, unmatched_location.parent_id
                    ),
                    'sourceId': source_id,
                    'id': unmatched_location.id,
                    'matchSelected': matchSelected,
                    'typeId': type_id,
                    'isFlagged': unmatched_location.id in flagged_location_ids,
                }
            )
        return output

    @Route.GET('/filterable_stats', title='Get match count by level')
    def get_filterable_stats(self):
        output = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        mapped_location_ids = {ml.unmatched_id for ml in MappedLocations.query.all()}
        for unmatched_location in UnmatchedLocations.query.all():
            if unmatched_location.id in mapped_location_ids:
                continue
            source_id = unmatched_location.source_id
            type_id = unmatched_location.type_id
            if not unmatched_location.user_match:
                output[source_id][type_id]['unmatched'] += 1
            else:
                output[source_id][type_id]['review'] += 1
        return output


class SuggestedMatchesResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `SuggestedMatches`
    class. Suggested matches are automatically produced in the pipeline
    run (via string distance) to help facilitate the matcing process.
    '''

    class Meta:
        model = SuggestedMatches

    class Schema:
        canonicalUri = fields.ItemUri(
            'web.server.api.location_api_models.SuggestedMatchesResource',
            attribute='canonical_id',
        )
        unmatchedUri = fields.ItemUri(
            'web.server.api.location_api_models.SuggestedMatchesResource',
            attribute='unmatched_id',
        )


class UserMatchesResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `UserMatches`
    class. User matches are the user selection of matches for unmatched locations.
    '''

    class Meta:
        model = UserMatches

    class Schema:
        canonicalUri = fields.ItemUri(
            'web.server.api.location_api_models.UserMatchesResource',
            attribute='canonical_id',
        )
        unmatchedUri = fields.ItemUri(
            'web.server.api.location_api_models.UserMatchesResource',
            attribute='unmatched_id',
        )
        user = fields.ItemUri(
            'web.server.api.location_api_models.UserMatchesResource',
            attribute='user_id',
        )

    @Route.POST(
        '/add_or_update_match', title='Submit Location match', schema=fields.Any()
    )
    def add_or_update_match(self, match):
        with Transaction() as transaction:
            canonical_id = match['canonical_id']
            user_id = match['user_id']
            unmatched_id = match['unmatched_id']
            new_match = UserMatches(
                canonical_id=canonical_id, unmatched_id=unmatched_id, user_id=user_id
            )
            old_match = transaction.find_by_id(
                UserMatches, unmatched_id, id_column='unmatched_id'
            )
            if old_match:
                old_match.canonical_id = canonical_id
                new_match = old_match
            transaction.add_or_update(new_match, flush=True)

        return None, NO_CONTENT

    @Route.GET('/by_level', title='Get user matches by level')
    def get_matches_by_level(self):
        matchedLocations = defaultdict(list)
        matchedHierarchy = defaultdict(list)
        for match in UserMatches.query.all():
            flagged_location_ids = set(
                fl.unmatched_id for fl in FlaggedLocations.query.all()
            )
            key = '%s_%s' % (match.unmatched.id, match.canonical.id)
            level = match.canonical.type.name
            canonical = {
                'id': match.canonical.id,
                'name': match.canonical.name,
                'ancestors': get_id_from_lookup(
                    PARENT_LOOKUP, match.canonical.parent_id
                ),
            }
            unmatched = {
                'name': match.unmatched.name,
                'suggestions': [],
                'ancestors': get_id_from_lookup(
                    PARENT_LOOKUP, match.unmatched.parent_id
                ),
                'source': match.unmatched.source.name,
                'id': match.unmatched.id,
                'isFlagged': match.unmatched.id in flagged_location_ids,
            }
            matchedLocations[key] = {
                'canonicalLocation': canonical,
                'unmatchedLocation': unmatched,
                'username': match.user.username,
            }

            matchedHierarchy[level].append(key)
        output = {
            'matchedLocations': matchedLocations,
            'matchedHierarchy': matchedHierarchy,
        }
        return output

    @Route.POST(
        '/remove', title='Remove reviewed mapped locations.', schema=fields.Any()
    )
    def delete_reviewed_matches(self, matches):
        with Transaction() as transaction:
            for match in matches:
                unmatched_id = match['unmatchedLocation']['id']
                match_to_delete = transaction.find_by_id(
                    UserMatches, unmatched_id, id_column='unmatched_id'
                )
                if match_to_delete:
                    transaction.delete(match_to_delete)

        return None, NO_CONTENT


class MappedLocationResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `SuggestedMatches`
    class. Suggested matches are automatically produced in the pipeline
    run (via string distance) to help facilitate the matcing process.
    '''

    class Meta:
        model = MappedLocations

    class Schema:
        canonicalUri = fields.ItemUri(
            'web.server.api.location_api_models.MappedLocationResource',
            attribute='canonical_id',
        )
        unmatchedUri = fields.ItemUri(
            'web.server.api.location_api_models.MappedLocationResource',
            attribute='unmatched_id',
        )

    @Route.POST(
        '/submit', title='Submit reviewed mapped locations.', schema=fields.Any()
    )
    def add_or_update_reviewed_matches(self, matches):
        with Transaction() as transaction:
            for match in matches:
                canonical_id = match['canonicalLocation']['id']
                unmatched_id = match['unmatchedLocation']['id']
                new_match = MappedLocations(
                    canonical_id=canonical_id, unmatched_id=unmatched_id
                )
                old_match = transaction.find_by_id(
                    MappedLocations, unmatched_id, id_column='unmatched_id'
                )
                if old_match:
                    old_match.canonical_id = canonical_id
                    new_match = old_match
                transaction.add_or_update(new_match, flush=True)

        return None, NO_CONTENT


class FlaggedLocationResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `SuggestedMatches`
    class. Suggested matches are automatically produced in the pipeline
    run (via string distance) to help facilitate the matcing process.
    '''

    class Meta:
        model = FlaggedLocations

    class Schema:
        unmatchedUri = fields.ItemUri(
            'web.server.api.location_api_models.FlaggedLocationResource',
            attribute='unmatched_id',
        )
        user = fields.ItemUri(
            'web.server.api.location_api_models.FlaggedLocationResource',
            attribute='user_id',
        )

    @Route.GET(
        '/count',
        title='Get Total Number of Flagged Locations',
        response_schema=fields.Integer(
            description='The total number of flagged locations'
        ),
    )
    def get_flag_count(self):
        return FlaggedLocations.query.count()

    @Route.POST(
        '/add_or_update_flagged_match',
        title='Submit flagged location.',
        schema=fields.Any(),
    )
    def add_or_update_flagged_match(self, flaggedDict):
        with Transaction() as transaction:
            unmatched_id = flaggedDict['unmatchedId']
            user_id = flaggedDict['userId']
            new_match = FlaggedLocations(unmatched_id=unmatched_id, user_id=user_id)
            old_match = transaction.find_by_id(
                FlaggedLocations, unmatched_id, id_column='unmatched_id'
            )
            if old_match:
                new_match = old_match
            transaction.add_or_update(new_match, flush=True)

        return None, NO_CONTENT

    @Route.POST('/remove', title='Remove flagged location.', schema=fields.Any())
    def delete_flagged_match(self, unmatchedId):
        with Transaction() as transaction:
            match_to_delete = transaction.find_by_id(
                FlaggedLocations, unmatchedId, id_column='unmatched_id'
            )
            if match_to_delete:
                transaction.delete(match_to_delete)

        return None, NO_CONTENT


RESOURCE_TYPES = [
    CanonicalLocationResource,
    LocationTypesResource,
    MappedLocationResource,
    UnmatchedLocationsResource,
    SuggestedMatchesResource,
    UserMatchesResource,
    SourcesResource,
    FlaggedLocationResource,
]
