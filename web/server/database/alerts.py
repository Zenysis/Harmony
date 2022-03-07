from typing import Set, Tuple
from uuid import uuid4

from flask import g, current_app
from flask_user import current_user
from slugify import slugify

from models.alchemy.alerts import AlertDefinition
from models.alchemy.permission import Resource, ResourceTypeEnum
from models.alchemy.user import User
from web.server.data.data_access import Transaction
from web.server.potion.managers import AuthorizationResourceManager
from web.server.routes.views.users import add_user_acl
from web.server.security.permissions import QueryNeed
from web.server.util.util import get_user_string


def compute_authorization_label(alert_definition: AlertDefinition) -> str:
    user_string = get_user_string(
        alert_definition.user or current_user, include_ip=False
    )
    text_label = (
        'Alert on {title} by {time_bucket} and {granularity}. Created by {user}'
    ).format(
        title=alert_definition.title,
        time_bucket=alert_definition.time_granularity,
        granularity=alert_definition.dimension_name,
        user=user_string,
    )
    return text_label


def make_author_alert_administrator(
    transaction: Transaction, authorization_item: Resource, user: User = None
) -> None:
    user = user or current_user
    add_user_acl(
        user or current_user,
        'alert_admin',
        ResourceTypeEnum.ALERT.name,
        authorization_item.name,
        session=transaction.run_raw(),
        commit=False,
    )


class AlertDefinitionManager(AuthorizationResourceManager):
    def before_create(self, transaction, alert_definition, authorization_item):
        alert_definition.user_id = current_user.id
        make_author_alert_administrator(transaction, authorization_item)

    def create_authorization_model(self, alert_definition, authorization_item):
        # Only update the `name` which we'll keep as a UUID4 since the user
        # doesn't really come up with a name for this item.
        authorization_item.name = slugify(str(uuid4()), separator='_')
        self.update_authorization_model(alert_definition, {}, authorization_item)

    def update_authorization_model(self, alert_definition, changes, authorization_item):
        authorization_item.label = compute_authorization_label(alert_definition)
        authorization_item.resource_type_id = ResourceTypeEnum.ALERT.value


def get_allowed_sources_for_user() -> Tuple[bool, Set[str]]:
    '''Returns a tuple of a boolean and set of allowed sources for given user.
    The boolean represents all sources, and the set represents the individual
    sources permitted.
    '''
    user = g.identity
    query_needs = [need for need in user.provides if isinstance(need, QueryNeed)]

    allowed_sources = set()
    allow_all_sources = False
    for query_need in query_needs:
        for dimension_filter in query_need.dimension_filters:
            if dimension_filter.dimension_name == 'source':
                allowed_sources.update(dimension_filter.include_values)
                allow_all_sources |= dimension_filter.all_values
    return allow_all_sources, allowed_sources


def get_sources_for_field(field_id: str) -> Set[str]:
    '''Returns a set of sources that comprise a given field id.'''
    constituents = current_app.query_data.calculated_fields_to_constituent_map.get(
        field_id, []
    )
    id_to_field_metadata = current_app.query_data.id_to_field_metadata
    source_set = set(
        id_to_field_metadata[constituent_id].source.name
        for constituent_id in constituents
        if constituent_id in id_to_field_metadata
    )
    return source_set


def is_field_permitted_for_user(field_id: str) -> bool:
    '''Returns if a user is permitted to view a field.'''
    if 'source' not in current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS:
        return True

    allow_all_sources, allowed_sources = get_allowed_sources_for_user()
    if allow_all_sources:
        return True
    return get_sources_for_field(field_id) <= allowed_sources


def get_permitted_alert_fields(transaction: Transaction) -> Tuple[bool, Set[str]]:
    '''Returns a tuple of a boolean and set of allowed alert fields for
    given user. The boolean represents all sources.
    '''
    alert_def_field_set = {
        field['id']
        for alert_def in transaction.find_all(AlertDefinition)
        for field in alert_def.fields
    }

    field_to_source_set = {
        field_id: get_sources_for_field(field_id.rsplit('__', 1)[0])
        for field_id in alert_def_field_set
    }
    allow_all_sources, allowed_sources = get_allowed_sources_for_user()

    individual_fields = set(
        field_id
        for field_id, sources in field_to_source_set.items()
        if sources <= allowed_sources
    )
    return allow_all_sources, individual_fields
