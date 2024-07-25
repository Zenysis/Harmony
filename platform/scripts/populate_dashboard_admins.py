#!/usr/bin/env python
import sys

from pylib.base.flags import Flags

from db.postgres.common import get_db_session
from log import LOG
from models.alchemy.dashboard import Dashboard

# pylint:disable=W0611
from models.alchemy.query_policy import QueryPolicyRole
from models.alchemy.permission import Resource
from models.alchemy.security_group import GroupAcl
from models.alchemy.user import User, UserAcl
from web.server.data.data_access import Transaction

DASHBOARD_ADMIN_RESOURCE_ROLE_ID = 3
DASHBOARD_EDITOR_RESOURCE_ROLE_ID = 2

# NOTE: There has been an issue where dashboards (created a while back) are now existing
# on the various deployments without a dashboard admin. So far we have spotted
# this mainly with copied dashboards. Users who created the copy who are the
# dashboard authors and hence dashboard admins are no longer admins. This script
# populates a dashboard admin for each dashboard without an admin and is expected
# to only run once for each deployment. The script
# picks an admin as follows:
# 1. Attempts to add dashboard author as admin
# 2. If dashboard author doesn't exist, attempt to add a user dashboard editor
#    as admin.
# 3. If there are no user dashboard editors, attempt to add a group dashboard
#    editor as admin.
# 4. If none of the above options are possible, leave the dashboard as is. We
#    do not want to be giving dashboard viewers additional access.


def populate_dashboard_admins(transaction):
    dashboard_resources = transaction.find_all_by_fields(
        Resource, {'resource_type_id': 2}
    )
    for dashboard_resource in dashboard_resources:
        LOG.info('Populating dashboard "%s"', dashboard_resource.name)
        dashboard_resource_id = dashboard_resource.id
        user_admin_acl = transaction.find_one_by_fields(
            UserAcl,
            True,
            {
                'resource_id': dashboard_resource_id,
                'resource_role_id': DASHBOARD_ADMIN_RESOURCE_ROLE_ID,
            },
        )
        group_admin_acl = transaction.find_one_by_fields(
            GroupAcl,
            True,
            {
                'resource_id': dashboard_resource_id,
                'resource_role_id': DASHBOARD_ADMIN_RESOURCE_ROLE_ID,
            },
        )

        # If there exists at least one dashboard admin for this dashboard
        # resource, then we don't have to do anything here.
        if user_admin_acl or group_admin_acl:
            LOG.info('Dashboard admin exists, skipping...')
            continue

        # Attempt to add dashboard author as dashboard admin.
        dashboard = transaction.find_one_by_fields(
            Dashboard, True, {'slug': dashboard_resource.name}
        )
        if dashboard and transaction.find_by_id(User, dashboard.author_id):
            LOG.info('Adding dashboard author as dashboard admin...')
            transaction.add_or_update(
                UserAcl(
                    resource_id=dashboard_resource_id,
                    resource_role_id=DASHBOARD_ADMIN_RESOURCE_ROLE_ID,
                    user_id=dashboard.author_id,
                )
            )
            continue

        # Attempt to add a user dashboard editor as a dashboard admin.
        user_editor_acl = transaction.find_one_by_fields(
            UserAcl,
            True,
            {
                'resource_id': dashboard_resource_id,
                'resource_role_id': DASHBOARD_EDITOR_RESOURCE_ROLE_ID,
            },
        )
        if user_editor_acl:
            LOG.info('Adding dashboard editor user as dashboard admin...')
            transaction.add_or_update(
                UserAcl(
                    resource_id=dashboard_resource_id,
                    resource_role_id=DASHBOARD_ADMIN_RESOURCE_ROLE_ID,
                    user_id=user_editor_acl.user_id,
                )
            )
            continue

        # Attempt to add a group dashboard editor as a dashboard admin.
        group_editor_acl = transaction.find_one_by_fields(
            GroupAcl,
            True,
            {
                'resource_id': dashboard_resource_id,
                'resource_role_id': DASHBOARD_EDITOR_RESOURCE_ROLE_ID,
            },
        )
        if group_editor_acl:
            LOG.info('Adding dashboard editor group as dashboard admin...')
            transaction.add_or_update(
                GroupAcl(
                    group_id=group_editor_acl.group_id,
                    resource_id=dashboard_resource_id,
                    resource_role_id=DASHBOARD_ADMIN_RESOURCE_ROLE_ID,
                )
            )
            continue

        # Leave the dashboard as is since there are no dashboard editors to
        # add as admin and we don't want to be giving dashboard viewers additional
        # access.
        LOG.info('Unable to find a suitable admin, skipping dashboard...')


def main():
    '''If no deployment name is provided, the local database will be used (based on a
    ZEN_ENV that is set). If a deployment name *is* provided, the deployment database
    will be used.'''
    Flags.PARSER.add_argument(
        '-D',
        '--deployment_name',
        type=str,
        required=False,
        default='',
        help=(
            'Optional deployment name to perform operations against. If unspecified, '
            'the local dev DB will be used.'
        ),
    )
    Flags.InitArgs()

    LOG.info('Begin populating...')

    with Transaction(
        get_session=lambda: get_db_session(Flags.ARGS.deployment_name)
    ) as transaction:
        populate_dashboard_admins(transaction)


if __name__ == '__main__':
    sys.exit(main())
