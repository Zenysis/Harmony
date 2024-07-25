'''This module is responsible for managing CRUD requests against the Query Policy API and also for
converting query policies into Druid Filters which are used to restrict query access.
'''
from collections import defaultdict
from functools import wraps
from datetime import datetime

from flask import g, current_app
from pydruid.utils.filters import Dimension, Filter

from db.druid.util import EmptyFilter
from models.python.permissions import QueryNeed
from web.server.security.permissions import (
    SuperUserPermission,
    is_public_dashboard_user,
)

# pylint: disable=C0103
MINIMUM_DATETIME = datetime(1800, 1, 1)
MAXIMUM_DATETIME = datetime(2200, 12, 31)
ALL_VALUES_SYMBOL = '<<ALL>>'
ALL_VALUES_LIST = [ALL_VALUES_SYMBOL]

AND_FILTER_SYMBOL = 'and'
OR_FILTER_SYMBOL = 'or'
NOT_FILTER_SYMBOL = 'not'
IN_FILTER_SYMBOL = 'in'
SELECTOR_FILTER_SYMBOL = 'selector'
REGEX_FILTER_SYMBOL = 'regex'
COLUMN_COMPARATOR_FILTER_SYMBOL = 'columnComparison'

DRUID_FILTER_TYPES = {
    AND_FILTER_SYMBOL,
    OR_FILTER_SYMBOL,
    NOT_FILTER_SYMBOL,
    IN_FILTER_SYMBOL,
    SELECTOR_FILTER_SYMBOL,
    REGEX_FILTER_SYMBOL,
    COLUMN_COMPARATOR_FILTER_SYMBOL,
}

DRUID_COMPOSITE_FILTER_TYPES = {AND_FILTER_SYMBOL, OR_FILTER_SYMBOL, NOT_FILTER_SYMBOL}

# The following are key names used for dimension to QueryNeed maps
COMPLEX = 'complex'
SIMPLE = 'simple'
HIERARCHICAL = 'hierarchical'

# NOTE: We explicitly filter for this value for a dimension that has not
# been given a value due to fields with aggregate values in which case that
# dimension has no value. Therefore we cannot filter for an empty string.
NO_FILTER_VAL = '__NO_VAL__'


def apply_authorization_filters():
    '''A decorator that applies filters to the run query method of a DruidQueryClient that
    restricts the result dataframe to match whatever data the current user is authorized to view.
    '''

    def filter_query(run_query):
        @wraps(run_query)
        def filter_query_inner(self, query):
            if SuperUserPermission().can() or is_public_dashboard_user():
                # NOTE: Since we are not using the standard authorization path, it is
                # possible that Site Administrator queries may be inadvertently filtered.
                # All other users will be expected to have a defined Query Policy to control what
                # data they are allowed to view.
                # NOTE: We also skip this for unregistered users when
                # public access is turned on
                return run_query(self, query)

            updated_query = restrict_query_filter_to_user_permissions(query)
            return run_query(self, updated_query)

        return filter_query_inner

    return filter_query


def restrict_query_filter_to_user_permissions(query, user_identity=None):
    '''Returns a Druid filter that has been injected with a security filter that
    accounts for the QueryPolicies a given user has been given.
    '''
    user_identity = user_identity or g.identity
    authorization_filter = _construct_authorization_filter(user_identity)

    # Take the logical AND of the original query filter with all the filters
    # referring to the query policies held by the user.
    if authorization_filter and not isinstance(authorization_filter, EmptyFilter):
        query_filter = query.query_filter
        query.query_filter = Filter(
            type=AND_FILTER_SYMBOL, fields=[query_filter, authorization_filter]
        )

    return query


def enumerate_query_needs(user_identity=None):
    user_identity = user_identity or g.identity

    query_needs = [
        need for need in user_identity.provides if isinstance(need, QueryNeed)
    ]

    return query_needs


def _categorize_query_needs_type(query_needs):
    '''Categorizes QueryNeeds into simple and complex needs - simple is a single
    filter in a QueryNeed.
    '''
    category_map = {COMPLEX: [], SIMPLE: [], HIERARCHICAL: []}
    for query_need in query_needs:
        if len(query_need.dimension_filters) > 1:
            category = COMPLEX
        else:
            category = SIMPLE
            hierarchical_dimensions = (
                current_app.zen_config.datatypes.HIERARCHICAL_DIMENSIONS
            )
            if any(
                f.dimension_name
                for f in query_need.dimension_filters
                if f.dimension_name in hierarchical_dimensions
            ):
                category = HIERARCHICAL
        category_map[category].append(query_need)
    return category_map


def _construct_authorization_filter(user_identity):
    '''Returns Druid filter that encodes the restrictions a user has. There are
    two components to this computation:
    1) Simple Filters - Each of these QueryPolicies represents a single
        dimension, and are additive: For the same dimension, if a user has
        distinct Policy A and Policy B, they are merged together as Policy (A OR
        B). For different dimensions, the resultant policy is ANDed together. In
        essence, stacked simple filters will only increase the amount of data
        able to be accessed.
    2) Complex Filters - Each QueryPolicy acts as a distinct unit, a user
        receives access to exactly the ANDed filter of the compoennts in that
        policy.
    3) Hierarchical Filters - These are to be SIMPLE filters of dimensions that
        have a hierarchical relationship with each other. The use case here is
        locations: While for SIMPLE Filters, different dimensions are ANDed
        together, we want hierarchical dimensions to be ORed.

    All Simple Filters are compiled together to form one cohesive filter.This
    and all Complex Filters are then ORed together. Hierarchical filters are then
    ANDed to form a full_filter.
    authorization filter.
    '''
    query_needs = enumerate_query_needs(user_identity)
    category_map = _categorize_query_needs_type(query_needs)

    simple_dimension_to_filters_map = _categorize_query_needs(category_map[SIMPLE])
    hierarchical_dimension_to_filters_map = _categorize_query_needs(
        category_map[HIERARCHICAL], dimensions_type=HIERARCHICAL
    )
    simple_and_hierarchical_filters = _and_simple_and_hierarchical_filters(
        simple_dimension_to_filters_map, hierarchical_dimension_to_filters_map
    )

    all_dimension_value_maps = [
        _categorize_query_needs([query_need]) for query_need in category_map[COMPLEX]
    ]

    return _or_all_filters(simple_and_hierarchical_filters, all_dimension_value_maps)


def _and_simple_and_hierarchical_filters(simple_value_map, hierarchical_value_map=None):
    _filter = _construct_single_filter(simple_value_map)
    if hierarchical_value_map:
        _filter &= _construct_hierarchical_filter(hierarchical_value_map)
    return _filter


def _or_all_filters(full_filter, dimension_value_maps):
    '''Returns a Druid filter that comprises an OR across simple and complex Druid filters
    which is constructed for each individual dimension to filter map that is
    passed in.
    '''
    for dimension_value_map in dimension_value_maps:
        full_filter |= _construct_single_filter(dimension_value_map)
    return full_filter


def get_empty_filter_map():
    return defaultdict(
        lambda: {'include': set(), 'exclude': set(), 'all_values': False}
    )


def populate_filter_map_with_need(filter_map, query_need):
    '''Populates a dimension to filter map from the each individual filter from
    a QueryNeed.
    '''
    for (
        dimension_name,
        dimension_filter,
    ) in query_need.dimension_to_filter_mapping.items():
        if dimension_name in current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS:
            entry = filter_map[dimension_name]
            entry['include'].update(dimension_filter.include_values)
            entry['exclude'].update(dimension_filter.exclude_values)
            entry['all_values'] = entry['all_values'] or dimension_filter.all_values


def _fill_authorizable_dimension_needs(filter_map, dimensions_type=SIMPLE):
    '''Fills filter map for authorizable dimensions that aren't explicity defined
    in the dimension to filters map based on AUTHORIZABLE_DIMENSIONS.
    '''
    authorizable_dimensions = set(
        current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS
    )
    hierarchical_dimensions = set(
        current_app.zen_config.datatypes.HIERARCHICAL_DIMENSIONS
    )
    auth_dimension_map = {
        SIMPLE: authorizable_dimensions - hierarchical_dimensions,
        HIERARCHICAL: authorizable_dimensions & hierarchical_dimensions,
    }
    for auth_dimension in auth_dimension_map[dimensions_type]:
        if auth_dimension not in filter_map:
            # Set default val
            # pylint: disable=W0104
            filter_map[auth_dimension]


def _categorize_query_needs(query_needs, dimensions_type=SIMPLE):
    '''Takes a list of QueryNeeds and categorizes them into dimension, and then
    into values that should be included, excluded, and allValues. Additionally,
    fills in values for authorizable dimensions that are not explicitly defined
    for a given user.
    '''
    dimension_to_values_map = get_empty_filter_map()
    for query_need in query_needs:
        populate_filter_map_with_need(dimension_to_values_map, query_need)
    _fill_authorizable_dimension_needs(
        dimension_to_values_map, dimensions_type=dimensions_type
    )
    return dimension_to_values_map


def _construct_single_filter(dimension_to_filters_map):
    '''Takes in a dict mapping dimension to permitted values and produces a
    single AND filter across each set. Simulates an OR filter across all
    dimension permutations.
    '''
    full_filter = EmptyFilter()
    for dimension_name, values in dimension_to_filters_map.items():
        if values['all_values']:
            continue

        is_filter_added = False
        if values['include']:
            full_filter &= Filter(
                type='in', dimension=dimension_name, values=list(values['include'])
            )
            is_filter_added = True
        if values['exclude']:
            full_filter &= ~Filter(
                type='in', dimension=dimension_name, values=list(values['exclude'])
            )
            is_filter_added = True

        # Need to do an additional check for no items
        if not is_filter_added:
            full_filter &= Dimension(dimension_name) == NO_FILTER_VAL

    return full_filter


def _construct_hierarchical_filter(dimension_to_filters_map):
    '''Takes in a dict mapping dimension to permitted values and produces a
    single OR filter across each set for included values.
    '''

    full_filter = EmptyFilter()
    for dimension_name, values in dimension_to_filters_map.items():
        if values['all_values']:
            return EmptyFilter()

        is_filter_added = False
        if values['include']:
            full_filter |= Filter(
                type='in', dimension=dimension_name, values=list(values['include'])
            )
            is_filter_added = True
        if values['exclude']:
            full_filter &= ~Filter(
                type='in', dimension=dimension_name, values=list(values['exclude'])
            )
            is_filter_added = True

        # Need to do an additional check for no items
        if not is_filter_added:
            full_filter |= Dimension(dimension_name) == NO_FILTER_VAL

    return full_filter


def construct_query_need_from_policy(query_policy):
    '''Constructs a `QueryNeed` based on a `QueryPolicy` entity that is typically associated with
    a `User` or `Group` object.

    Parameters
    ----------
        query_policy: models.query_models.QueryPolicy
            The query policy held by a user or group that will serve as the template to construct
            a `QueryNeed` from.

    Returns
    ----------
    web.server.security.permissions.QueryNeed
        The constructed Query Need object that represents the query permissions held by
        `query_policy`.
    '''
    return QueryNeed(query_policy.dimension_filters)


class AuthorizedQueryClient:
    def __init__(self, query_client):
        self.query_client = query_client

    @apply_authorization_filters()
    def run_query(self, query):
        return self.query_client.run_query(query)

    def run_raw_query(self, query):
        return self.query_client.run_raw_query(query)
