from flask import g

from log import LOG
from models.alchemy.alerts import AlertDefinition
from models.alchemy.permission import ResourceTypeEnum
from web.server.data.data_access import Transaction
from web.server.routes.views.users import add_user_role, try_get_user


def add_user_as_alert_administrator(transaction, resource_entity, user_entity):
    add_user_role(
        user_entity,
        'alert_admin',
        ResourceTypeEnum.ALERT.name,
        resource_entity.name,
        # pylint: disable=W0212
        session=transaction._session,
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
