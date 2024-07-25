from models.alchemy.permission import Permission, ResourceRole
from models.alchemy.query_policy import QueryPolicy
from models.alchemy.user import UserRoles
from web.server.data.data_access import Transaction
from web.server.potion.signals import after_user_role_change


def build_role(role_dict):
    '''Builds a role model dictionary with an input roles dictionary from the
    frontend, to add into the db.
    '''
    db_permissions = []
    query_policy_uris = [
        query_policy['$uri'] for query_policy in role_dict['queryPolicies']
    ]
    db_query_policies = []
    alert_resource_role_id = None
    dashboard_resource_role_id = None
    with Transaction() as transaction:
        for permission in role_dict['permissions']:
            db_permission = transaction.find_one_by_fields(
                Permission,
                True,
                {
                    'permission': permission.permission,
                    'resource_type_id': permission.resource_type_id,
                },
            )
            if db_permission:
                db_permissions.append(db_permission)

        for uri in query_policy_uris:
            policy_id = uri.split('/')[-1]
            db_query_policy = transaction.find_by_id(QueryPolicy, policy_id)
            if db_query_policy:
                db_query_policies.append(db_query_policy)

        alert_resource_role_name = role_dict['alertResourceRoleName']
        if alert_resource_role_name:
            alert_resource_role_id = transaction.find_one_by_fields(
                ResourceRole, True, {'name': alert_resource_role_name}
            ).id

        dashboard_resource_role_name = role_dict['dashboardResourceRoleName']
        if dashboard_resource_role_name:
            dashboard_resource_role_id = transaction.find_one_by_fields(
                ResourceRole, True, {'name': dashboard_resource_role_name}
            ).id

    return {
        'alert_resource_role_id': alert_resource_role_id,
        'dashboard_resource_role_id': dashboard_resource_role_id,
        'label': role_dict['label'],
        'permissions': db_permissions,
        'query_policies': db_query_policies,
        'enable_data_export': role_dict['dataExport'],
    }


def add_current_user_to_role(role_id, current_user):
    # A superuser does not need roles
    if not current_user.is_superuser():
        user_role = UserRoles(role_id=role_id, user_id=current_user.id)
        with Transaction() as transaction:
            transaction.add_or_update(user_role)
        after_user_role_change.send(current_user, role=user_role)
