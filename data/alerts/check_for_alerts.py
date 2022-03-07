#!/usr/bin/env python
# pylint: disable=C0413

from collections import defaultdict
from datetime import datetime
from os import getenv
import sys
from typing import DefaultDict, List, Tuple

from pylib.base.flags import Flags

from config.database import DATASOURCE
from data.alerts.alert import (
    check_if_alert_triggered,
    get_latest_data_dates_for_alert_defs,
)
from data.alerts.send_alert_notifications import maybe_send_alert_notifications
from db.druid.query_client import DruidQueryClient
from db.druid.util import DRUID_DATE_FORMAT
from db.postgres.common import get_local_db_uri, get_db_uri, get_session
from log import LOG
from util.connections.server_client import get_deployment_url
from web.python_client.alerts_service.model import AlertDefinition, AlertNotification
from web.python_client.alerts_service.service import (
    AlertDefinitionService,
    AlertNotificationService,
)
from web.python_client.core import AuthenticatedSession
from web.server.potion.access import get_id_from_uri

# NOTE(toshi): Following is necessary due SQL Alchemy imports. In the future we
# can potentially have hi-fi and lo-fi models to get around this.
# pylint: disable=unused-import
import models.alchemy.security_group
from models.alchemy.dashboard import Dashboard
from models.alchemy.user import User
from models.alchemy.alerts import (
    AlertDefinition as AlchemyAlertDefinition,
    AlertNotification as AlchemyAlertNotification,
)
from models.alchemy.query_policy import QueryPolicy
from models.alchemy.permission import Role, Resource, ResourceType, ResourceTypeEnum
from models.alchemy.security_group import Group, GroupRoles


sys.path = [path for path in sys.path if 'data/alerts' not in path]
QUERY_CLIENT_CACHE = {}

# HACK(toshi, vedant): Leaving this here only for alert authorization stuff
def hack_get_db_session(run_locally, param_db_uri, deployment_name):
    # get the correct db_uri depending on which flag was passed
    db_uri = ''
    if run_locally:
        db_uri = get_local_db_uri(getenv('ZEN_ENV'))
    elif param_db_uri:
        db_uri = param_db_uri
    else:
        db_uri = get_db_uri(deployment_name)

    return get_session(db_uri)


def compute_notification_hash(notification, alert_def_map):
    '''Computes the hash of a notification object.'''
    alert_definition_id = get_id_from_uri(notification.alert_definition.ref)
    alert_definition = alert_def_map[notification.alert_definition.ref]
    dimension_info = notification.dimension_info.get(alert_definition.dimension_name)

    # TODO(toshi): If an alert definition is modified, linked alerts should be
    # deleted
    # NOTE(toshi): If the dimension_id is changed for an alert definition, the
    # stored dimension values will not match up with the expected dimension_id.
    # Therefore we need to account for that dimension not appearing in info
    dimension_val = dimension_info.dimension_val if dimension_info else 'STALE_DATA'

    return '%s__%s__%s' % (
        alert_definition_id,
        dimension_val,
        notification.query_interval,
    )


def categorize_generated_notifications(
    generated_notifications: List[AlertNotification],
    todays_notifications: List[AlertNotification],
    all_notifications: List[AlertNotification],
    alert_defs: List[AlertDefinition],
) -> Tuple[
    List[AlertNotification],
    List[AlertNotification],
    List[AlertNotification],
    DefaultDict[str, AlertNotification],
]:
    '''Splits generated notifications into:
    1) Completely new notifications
    2) Revised notifications - change in reported value
    3) Todays old notifications - existing and other notifs that have minor
        changes

    Generated notifications are diffed against todays notifications if there are
    notifications generated for today, otherwise diffed against existing
    notifications.

    Also marks notifications that were generated today that no longer apply by
    appending '.deleted' to `generation_date`, ie `2019-04-20.deleted`.

    Objects that need to be updated are returned as well.
    '''
    alert_def_map = {definition.uri: definition for definition in alert_defs}
    hash_to_gen_notif_map = {
        compute_notification_hash(notification, alert_def_map): notification
        for notification in generated_notifications
    }
    hash_to_existing_notif_map = {
        compute_notification_hash(notification, alert_def_map): notification
        for notification in all_notifications
    }
    hash_to_todays_notif_map = {
        compute_notification_hash(notification, alert_def_map): notification
        for notification in todays_notifications
    }

    new_notifs, revised_notifs, todays_old_notifs = [], [], []
    # dict containing the changes that need to be made
    dirty_uri_to_notif_dict = defaultdict(dict)
    for notif_hash, notification in hash_to_gen_notif_map.items():
        existing_notif = hash_to_existing_notif_map.get(notif_hash)
        if not existing_notif:
            new_notifs.append(notification)
        else:

            if (
                existing_notif.reported_val != notification.reported_val
                or existing_notif.compared_val != notification.compared_val
            ):
                existing_notif.reported_val = notification.reported_val
                existing_notif.compared_val = notification.compared_val
                revised_notifs.append(existing_notif)
                updated_uri_dict = {
                    'reportedVal': existing_notif.reported_val,
                    'comparedVal': existing_notif.compared_val,
                }
                dirty_uri_to_notif_dict[existing_notif.uri].update(updated_uri_dict)
            elif notif_hash in hash_to_todays_notif_map:
                todays_old_notifs.append(existing_notif)

            # Keeping track of items in existing and not in new
            hash_to_todays_notif_map.pop(notif_hash, None)

    # If this isn't the first run of the day, 'delete' notifications that no
    # longer apply
    for stale_notification in list(hash_to_todays_notif_map.values()):
        stale_notification.generation_date += '.deleted'
        dirty_uri_to_notif_dict[stale_notification.uri][
            'generationDate'
        ] = stale_notification.generation_date

    # Set generation_date as deleted for items no longer
    return new_notifs, revised_notifs, todays_old_notifs, dirty_uri_to_notif_dict


# pylint: disable=R0914
def check_for_alerts(
    alert_def_service, alert_notif_service, db_session, suppress_emails
):
    alert_defs = alert_def_service.get_all_by_fields()

    datasource_name = DATASOURCE.name
    LOG.info('Using datasource: %s.', datasource_name)

    alert_def_to_latest_date_map = get_latest_data_dates_for_alert_defs(
        datasource_name, alert_defs, DruidQueryClient
    )

    # TODO(toshi): Change this variable name
    generated_notifications = []
    for alert in alert_defs:
        latest_date = alert_def_to_latest_date_map.get(alert.uri)

        # TODO(stephen, toshi): Figure out how to evaluate alerts when a field
        # has no data reported.
        if latest_date is None:
            continue

        # TODO(toshi): Group alert queries by their max_time_bound values to
        # reduce the total number of queries issued in data.alerts.alert
        notifs_for_ind = check_if_alert_triggered(
            alert, datasource_name, latest_date, DruidQueryClient
        )
        if notifs_for_ind:
            generated_notifications += notifs_for_ind

    today = datetime.now()
    todays_date_str = today.strftime(DRUID_DATE_FORMAT)
    todays_search_fields = {'generationDate': todays_date_str}

    # TODO(toshi): Convert to fetch only active notifications
    all_notifs = alert_notif_service.get_all_by_fields()
    todays_prior_generated_notifs = alert_notif_service.get_all_by_fields(
        todays_search_fields
    )

    (
        new_notifs,
        revised_notifs,
        todays_old_notifs,
        dirty_uri_to_notif_dict,
    ) = categorize_generated_notifications(
        generated_notifications, todays_prior_generated_notifs, all_notifs, alert_defs
    )

    maybe_send_alert_notifications(
        alert_defs,
        new_notifs,
        revised_notifs,
        todays_old_notifs,
        todays_prior_generated_notifs,
        alert_def_service.base_uri,
        db_session,
        suppress_emails=suppress_emails,
    )

    update_list = []
    for uri, field_dict in dirty_uri_to_notif_dict.items():
        field_dict['$uri'] = uri
        update_list.append(field_dict)
    alert_notif_service.add_all(new_notifs)
    alert_notif_service.update_all(update_list)

    return 0


def main():
    '''If --run_locally is provided, it will use the ZEN_ENV env variable.
    Otherwise, if --db_uri is provided, it will be used. If not,
    --deployment_name will be used to look for credentials in the fabfile.

    **NOTE** that an automation account is necessary when running in prod.
    '''
    # TODO(toshi): Once Vault implementation is completed, change credential
    # injection.
    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help=(
            'Name of the deployment to generate alerts.'
            'Used if --db_uri is not provided'
        ),
    )
    Flags.PARSER.add_argument(
        '--db_uri',
        type=str,
        required=False,
        help='DB connection string. If not provided, --deployment_name will be used',
    )
    Flags.PARSER.add_argument(
        '--run_locally',
        action='store_true',
        required=False,
        default=False,
        help=(
            'Enable this to test things locally. Your'
            'ZEN_ENV env variable will be used'
        ),
    )
    Flags.PARSER.add_argument(
        '--suppress_emails',
        action='store_true',
        required=False,
        default=False,
        help=(
            'Enable this to prevent sending of email '
            'notifications. Used while testing.'
        ),
    )
    Flags.InitArgs()

    # NOTE(open source): any implementer of alerts with our opensource offering will need
    # to determin the best way forward here. Creating pipeline user/temporary access token
    # for the AuthenticatedSession.
    username, password = '', ''

    run_locally = Flags.ARGS.run_locally
    with AuthenticatedSession(username, password) as session:
        deployment_name = Flags.ARGS.deployment_name
        host = None if run_locally else get_deployment_url(deployment_name)
        alert_def_service = AlertDefinitionService(session, host=host)

        # Check if API versioning is fine
        if not alert_def_service.check_if_api_version_matches():
            LOG.error('API version mismatch. Exiting alert generation early.')
            return 1

        alert_notif_service = AlertNotificationService(session, host=host)
        db_session = hack_get_db_session(
            Flags.ARGS.run_locally, Flags.ARGS.db_uri, deployment_name
        )
        # TODO(abby): cohort calculations return completely inaccurate results
        check_for_alerts(
            alert_def_service,
            alert_notif_service,
            db_session,
            Flags.ARGS.suppress_emails,
        )

    return 0


if __name__ == '__main__':
    sys.exit(main())
