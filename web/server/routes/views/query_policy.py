'''This module is responsible for managing CRUD requests against the Query Policy API and also for
converting query policies into Druid Filters which are used to restrict query access.

https://zenysis.slab.com/posts/query-authorization-gqdnaz9b
'''
from collections import defaultdict
from functools import wraps
from datetime import datetime
from slugify import slugify

from flask import g, current_app
from pydruid.utils.filters import Dimension, Filter

from db.druid.util import EmptyFilter
from models.alchemy.permission import ResourceTypeEnum
from web.server.potion.managers import AuthorizationResourceManager
from web.server.routes.views.authorization import is_authorized
from web.server.security.permissions import (
    DimensionFilter,
    QueryNeed,
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

DRUID_FILTER_TYPES = set(
    [
        AND_FILTER_SYMBOL,
        OR_FILTER_SYMBOL,
        NOT_FILTER_SYMBOL,
        IN_FILTER_SYMBOL,
        SELECTOR_FILTER_SYMBOL,
        REGEX_FILTER_SYMBOL,
        COLUMN_COMPARATOR_FILTER_SYMBOL,
    ]
)

DRUID_COMPOSITE_FILTER_TYPES = set(
    [AND_FILTER_SYMBOL, OR_FILTER_SYMBOL, NOT_FILTER_SYMBOL]
)

# The following are key names used for dimension to QueryNeed maps
COMPLEX = 'complex'
SIMPLE = 'simple'

# NOTE(toshi): We explicitly filter for this value for a dimension that has not
# been given a value due to fields with aggregate values in which case that
# dimension has no value. Therefore we cannot filter for an empty string.
NO_FILTER_VAL = '__NO_VAL__'

# HACK(yitian): Limiting admin access for kvap data sources.
ADMIN_DATA_SOURCE_LIMITATION_HACK = {'afsa': 'AGYW Finance'}


def apply_authorization_filters():
    '''A decorator that applies filters to the run query method of a DruidQueryClient that
    restricts the result dataframe to match whatever data the current user is authorized to view.
    '''

    def filter_query(run_query):
        @wraps(run_query)
        def filter_query_inner(self, query):
            if SuperUserPermission().can() or is_public_dashboard_user():
                # HACK(vedant): Since we are not using the standard authorization path, it is
                # possible that Site Administrator queries may be inadvertently filtered.
                # All other users will be expected to have a defined Query Policy to control what
                # data they are allowed to view.
                # NOTE(toshi): We also skip this for unregistered users when
                # public access is turned on
                # HACK(yitian): Limit access of certain kvap data sources for
                # admins. Admins with explicit query policy access can still
                # run queries as normal.
                updated_query = hack_filter_admin_kvap_data_sources(query)
                return run_query(self, updated_query)

            if should_filter_pii_dimensions_out(query['dimensions']):
                query['filter'] = Dimension(query['dimensions'][0]) == NO_FILTER_VAL

            updated_query = restrict_query_filter_to_user_permissions(query)
            return run_query(self, updated_query)

        return filter_query_inner

    return filter_query


def hack_filter_admin_kvap_data_sources(query):
    deployment_name = current_app.zen_config.general.DEPLOYMENT_NAME
    if deployment_name not in ADMIN_DATA_SOURCE_LIMITATION_HACK:
        return query

    datasource = ADMIN_DATA_SOURCE_LIMITATION_HACK[deployment_name]
    # NOTE(yitian): Only checking the first dimension filter as we only expect
    # to be working with simple filters. Simple filters have 1 dimension filter
    # while complex ones have > 1.
    source_query_needs = [
        need
        for need in g.identity.provides
        if isinstance(need, QueryNeed)
        and need.dimension_filters[0].dimension_name == 'source'
        and (
            need.dimension_filters[0].all_values
            or datasource in need.dimension_filters[0].include_values
        )
    ]
    if not source_query_needs:
        query.query_filter &= Dimension('source') != datasource
    return query


def restrict_query_filter_to_user_permissions(query, user_identity=None):
    '''Returns a Druid filter that has been injected with a security filter that
    accounts for the QueryPolicies a given user has been given.
    '''
    user_identity = user_identity or g.identity
    authorization_filter = _construct_authorization_filter(user_identity)

    # Take the logical AND of the original query filter with all of the filters
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
    category_map = {COMPLEX: [], SIMPLE: []}
    for query_need in query_needs:
        category = COMPLEX if len(query_need.dimension_filters) > 1 else SIMPLE
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

    All Simple Filters are compiled together to form one cohesive filter. This
    and all Complex Filters are then ORed together to get the final
    authorization filter.
    '''
    query_needs = enumerate_query_needs(user_identity)
    category_map = _categorize_query_needs_type(query_needs)

    simple_dimension_to_filters_map = _categorize_query_needs(category_map[SIMPLE])

    all_dimension_value_maps = [
        _categorize_query_needs([query_need]) for query_need in category_map[COMPLEX]
    ]
    all_dimension_value_maps.append(simple_dimension_to_filters_map)
    return _or_all_filters(all_dimension_value_maps)


def _or_all_filters(dimension_value_maps):
    '''Returns a Druid filter that comprises of an OR across each Druid filter
    which is constructed for each individual dimension to filter map that is
    passed in.
    '''
    full_filter = EmptyFilter()
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


def _fill_authorizable_dimension_needs(filter_map):
    '''Fills filter map for authorizable dimensions that aren't explicity defined
    in the dimension to filters map based on AUTHORIZABLE_DIMENSIONS.
    '''
    for auth_dimension in current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS:
        if auth_dimension not in filter_map:
            # Set default val
            # pylint: disable=W0104
            filter_map[auth_dimension]


def _categorize_query_needs(query_needs):
    '''Takes a list of QueryNeeds and categorizes them into dimension, and then
    into values that should be included, excluded, and allValues. Additionally,
    fills in values for authorizable dimensions that are not explicitly defined
    for a given user.
    '''
    dimension_to_values_map = get_empty_filter_map()
    for query_need in query_needs:
        populate_filter_map_with_need(dimension_to_values_map, query_need)
    _fill_authorizable_dimension_needs(dimension_to_values_map)

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

    filter_mapping = query_policy.policy_filters
    dimension_filters = _construct_default_dimension_filters(filter_mapping)

    return QueryNeed(dimension_filters)


def _construct_default_dimension_filters(raw_filter_mapping):
    '''Constructs an iteration of `DimensionFilter` instances that represent the filters
    '''
    dimension_filters = set()

    for (dimension, dimension_filter) in list(raw_filter_mapping.items()):
        use_all_values = dimension_filter['allValues']
        included_values = dimension_filter['includeValues']
        excluded_values = dimension_filter['excludeValues']
        dimension_filters.add(
            DimensionFilter(dimension, included_values, excluded_values, use_all_values)
        )

    return dimension_filters


def should_filter_pii_dimensions_out(dimensions):
    '''Returns if a user has privileges to view pii dimensions. Currently we
    require a user to have the `view_case_management` permission.
    '''
    # NOTE(toshi): Doing this so we don't clutter up every config file
    case_management_pii_dimensions = getattr(
        current_app.zen_config.case_management, 'CASE_MANAGEMENT_PII_DIMENSIONS', set()
    )
    if not case_management_pii_dimensions or is_authorized(
        'view_case_management', 'site'
    ):
        return False
    return bool(case_management_pii_dimensions.intersection(set(dimensions)))


class AuthorizedQueryClient:
    def __init__(self, query_client):
        self.query_client = query_client

    @apply_authorization_filters()
    def run_query(self, query):
        return self.query_client.run_query(query)

    def run_raw_query(self, query):
        return self.query_client.run_raw_query(query)
