from flask import current_app, g

from log import LOG
from models.alchemy.alerts import AlertDefinition, AlertNotification
from models.alchemy.permission import ResourceTypeEnum
from web.server.data.data_access import Transaction
from web.server.routes.views.query_policy import (
    enumerate_query_needs,
    get_empty_filter_map,
    populate_filter_map_with_need,
)
from web.server.routes.views.users import add_user_acl, try_get_user
from web.server.security.permissions import SuperUserPermission


SOURCE_DIMENSION = 'source'


def get_dimension_value_map(query_needs):
    '''Computes the set of dimension values that a list of query needs allows.
    Note that this does not account for complex multiple non-source dimensions
    filtering.
    '''
    dimension_to_values_map = get_empty_filter_map()
    for query_need in query_needs:
        populate_filter_map_with_need(dimension_to_values_map, query_need)
    return dimension_to_values_map


def get_dimensions_to_verify():
    '''Returns a tuple of (set, string), where the set of dimensions that Alert
    Notifications need to be checked against, excluding source (this is checked
    for at the Alert Definition level). If any hierarchical dimensions appear,
    it means that there needs to be a hierarchical check, so we add all
    hierarchical dimensions to catch this case.

    The string represents a hierarchical dimension id if it exists, otherwise
    it is an empty string.
    '''
    non_source_dimension_filters = set(
        current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS
    )
    non_source_dimension_filters.discard(SOURCE_DIMENSION)
    hierarchical_dimension_set = set(
        current_app.zen_config.datatypes.HIERARCHICAL_DIMENSIONS
    )
    for dimension_name in non_source_dimension_filters:
        if dimension_name in hierarchical_dimension_set:
            for hierarchical_dimension_name in hierarchical_dimension_set:
                non_source_dimension_filters.add(hierarchical_dimension_name)
            return non_source_dimension_filters, dimension_name
    return non_source_dimension_filters, ''


def filter_notifications_by_dimension(notifications_query):
    '''Filter AlertNotifications by dimension. Note that source filtering is
    done at the AlertDefinition level. Currently we are not supporting complex,
    multi-non-source-dimensional queries ie SRs + geo.
    '''
    if SuperUserPermission().can():
        # Shortcircuit in the event that the user is a site-admin
        return notifications_query

    dimension_filters, maybe_hierarchical_dim = get_dimensions_to_verify()
    dimension_to_values_map = get_dimension_value_map(enumerate_query_needs())

    ids_to_exclude = []
    for notification in notifications_query:
        # TODO(abby): Figure out how this would work when dimension_name is null, which is not
        # yet allowed by the front end.
        notification_dimension_name = notification.alert_definition.dimension_name

        # NOTE(toshi) We only want to verify enabled, nonsource dimensions. We
        # perform this check to catch hierarchical dimensions that might not be
        # explicitly in AUTHORIZABLE_DIMENSIONS
        if notification_dimension_name not in dimension_filters:
            continue

        # Check if this dimension value passes:
        dimension_filter = dimension_to_values_map[maybe_hierarchical_dim]
        if not dimension_filter['all_values']:
            # Attempt to get dimension value from dimension info. We check even
            # if dimension id's don't match to filter these out - it means that
            # this user doesn't have permission to view
            notification_dimension_val = notification.dimension_info.get(
                maybe_hierarchical_dim, {}
            ).get('dimension_val')
            if notification_dimension_val not in dimension_filter['include']:
                ids_to_exclude.append(notification.id)

    return notifications_query.filter(~AlertNotification.id.in_(ids_to_exclude))


def add_user_as_alert_administrator(transaction, resource_entity, user_entity):
    add_user_acl(
        user_entity,
        'alert_admin',
        ResourceTypeEnum.ALERT.name,
        resource_entity.name,
        session=transaction.run_raw(),
        commit=False,
    )


def transfer_alert_def_ownership(transaction, alert_def, target_user_entity):
    alert_def.user_id = target_user_entity.id
    # TODO(toshi): Maybe we want to flush DB less often?
    transaction.add_or_update(alert_def, flush=True)
    add_user_as_alert_administrator(transaction, alert_def.resource, target_user_entity)


def bulk_transfer_alert_def_ownership(source_username, target_username):
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG

    source_user_entity = try_get_user(source_username)
    target_user_entity = try_get_user(target_username)

    if not source_user_entity or not target_user_entity:
        logger.error(
            'Cannot transfer alerts from "%s" to "%s"'
            % (source_username, target_username)
        )

    logger.info(
        'Attempting to transfer ownership of all alerts owned by %s to %s',
        source_username,
        target_username,
    )

    with Transaction() as transaction:
        alert_defs = transaction.find_all_by_fields(
            AlertDefinition, {'user_id': source_user_entity.id}
        )

        for alert_def in alert_defs:
            transfer_alert_def_ownership(transaction, alert_def, target_user_entity)

    logger.info('Transfer of alerts was successful.')
