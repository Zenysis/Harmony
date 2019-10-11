# pylint: disable=C0103
from builtins import object
from collections import defaultdict
from models.alchemy.location import CanonicalLocations


class LocationHierachy(object):
    def __init__(self):
        self.parent_lookup = self.build_parent_lookup()
        self.canonical_locations = self.build_canonical_locations()

    def build_parent_lookup(self):
        parent_lookup = defaultdict(list)
        locations = CanonicalLocations.query.filter(
            CanonicalLocations.type_id == 1
        ).all()
        for location in locations:
            self.get_tree(
                parent_lookup, location, [{'name': location.name, 'id': location.id}]
            )
        return parent_lookup

    def get_tree(self, lookup, location, parent):
        children = location.children
        lookup[location.id] = parent
        if not children:
            return
        for child in location.children:
            child_name = children[child].name
            child_id = children[child].id
            new_parent = parent + [{'name': child_name, 'id': child_id}]
            self.get_tree(lookup, children[child], parent=new_parent)

    def build_canonical_locations(self):
        canonical_locations = defaultdict(list)
        for location in self.parent_lookup:
            ancestors = self.parent_lookup[location]
            # TODO(moriah): change this, it is a stupid way to do this.
            canonical_locations[len(ancestors)].append(ancestors)
        return canonical_locations
