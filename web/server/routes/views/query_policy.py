'''This module is responsible for managing CRUD requests against the Query Policy API and also for
converting query policies into Druid Filters which are used to restrict query access.

https://zenysis.slab.com/posts/query-authorization-gqdnaz9b
'''
from builtins import object
from functools import wraps
from datetime import datetime
from flask import g, current_app
from slugify import slugify

from pydruid.utils.filters import Dimension, Filter

from db.druid.util import EmptyFilter
from models.alchemy.permission import ResourceTypeEnum
from web.server.potion.managers import AuthorizationResourceManager
from web.server.security.permissions import (
    DimensionFilter,
    QueryNeed,
    SuperUserPermission,
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


def apply_authorization_filters():
    '''A decorator that applies filters to the run query method of a DruidQueryClient that
    restricts the result dataframe to match whatever data the current user is authorized to view.
    '''

    def filter_query(run_query):
        @wraps(run_query)
        def filter_query_inner(self, query):
            if SuperUserPermission().can():
                # HACK(vedant): Since we are not using the standard authorization path, it is
                # possible that Site Administrator queries may be inadvertently filtered.
                # All other users will be expected to have a defined Query Policy to control what
                # data they are allowed to view.
                return run_query(self, query)

            updated_query = restrict_query_filter_to_user_permissions(query)
            return run_query(self, updated_query)

        return filter_query_inner

    return filter_query


def restrict_query_filter_to_user_permissions(query, user_identity=None):
    '''Returns the druid filter
    '''
    user_identity = user_identity or g.identity
    authorization_filter = _construct_authorization_filter(user_identity)

    # Take the logical AND of the original query filter with all of the filters
    # referring to the query policies held by the user.
    if authorization_filter:
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


def _construct_authorization_filter(user_identity):
    '''Converts the query permissions that the user holds into druid filters and returns the
    logical OR of the computed constituent druid filters.
    '''
    query_needs = enumerate_query_needs(user_identity)

    output_filter = EmptyFilter()
    query_need_added = False

    for query_need in query_needs:
        _filter = _construct_druid_filter_from_query_need(query_need)
        if not isinstance(_filter, EmptyFilter):
            output_filter |= _filter
            query_need_added = True

    if not query_need_added:
        # If the user has no query policies, ensure that any dimensions for which authorization is
        # enabled are unqueryable.
        for dimension_name in current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS:
            output_filter &= Dimension(dimension_name) == ''

    return output_filter


def _construct_druid_filter_from_query_need(query_need):
    '''Constructs a druid filter from an individual query need.
    '''

    output_filter = EmptyFilter()
    filtered_dimensions = set()

    # Go through the individual dimension filters in the `QueryNeed` and construct the appropriate
    # filters.
    for dimension_filter in query_need.dimension_filters:
        dimension = dimension_filter.dimension_name
        include_values = dimension_filter.include_values
        exclude_values = dimension_filter.exclude_values
        all_values = dimension_filter.all_values
        dimension_filter = None
        filtered_dimensions.add(dimension)

        if all_values and not exclude_values:
            continue
        elif exclude_values:
            dimension_filter = ~Filter(
                type=IN_FILTER_SYMBOL, dimension=dimension, values=list(exclude_values)
            )
        else:
            dimension_filter = Filter(
                type=IN_FILTER_SYMBOL, dimension=dimension, values=list(include_values)
            )

        output_filter &= dimension_filter

    # If there are any authorizable dimensions for which permissions were not explicitly defined,
    # ensure that they are completely filtered out.
    for dimension_name in current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS:
        if dimension_name not in filtered_dimensions:
            no_dimension_values_filter = Dimension(dimension_name) == ''
            output_filter &= no_dimension_values_filter

    return output_filter


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


class QueryPolicyManager(AuthorizationResourceManager):
    '''A subclass of `AuthorizationResourceManager` that handles the additional
    Authorization Model creation, update and deletion for query policies.
    '''

    def create_authorization_model(self, query_policy, authorization_item):
        self.update_authorization_model(query_policy, {}, authorization_item)

    def update_authorization_model(self, query_policy, changes, authorization_item):
        authorization_name = slugify(query_policy.name, separator='_')
        authorization_item.name = authorization_name
        authorization_item.label = query_policy.name
        authorization_item.resource_type_id = ResourceTypeEnum.QUERY_POLICY.value


class AuthorizedQueryClient(object):
    def __init__(self, query_client):
        self.query_client = query_client

    @apply_authorization_filters()
    def run_query(self, query):
        return self.query_client.run_query(query)

    def run_raw_query(self, query):
        return self.query_client.run_raw_query(query)
