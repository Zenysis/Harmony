from slugify import slugify
from werkzeug.exceptions import NotFound

from models.alchemy.permission import Resource
from models.alchemy.user import User
from models.alchemy.security_group import Group
from web.server.data.data_access import get_db_adapter, find_one_by_fields
from web.server.errors import ItemNotFound
from web.server.routes.views.groups import (
    list_group_roles_for_resource_api,
    update_group_roles,
)
from web.server.routes.views.default_users import (
    list_default_roles_for_resource_api,
    update_default_roles,
)
from web.server.routes.views.users import (
    list_user_roles_for_resource_api,
    update_user_roles,
)

from web.server.potion.signals import after_roles_update, before_roles_update


def get_resource_by_type_and_name(resource_type, resource_name):
    slugified_name = slugify(resource_name.lower(), separator='_')

    resource = Resource.query.filter(
        Resource.name == slugified_name and Resource.resource_type.name == resource_type
    ).first()

    if resource:
        return resource

    raise ItemNotFound(resource_type, {'name': resource_name})


def get_current_resource_roles(resource):
    return {
        'groupRoles': list_group_roles_for_resource_api(resource),
        'userRoles': list_user_roles_for_resource_api(resource),
        'defaultRoles': list_default_roles_for_resource_api(resource),
    }


def _mark_existing_roles_for_deletion(
    existing_roles, new_user_roles=None, new_group_roles=None
):
    '''
    Given an updated list of user roles for a resource, go through the existing roles for a
    resource and explicitly delete users/groups that should no longer possess roles for a
    resource
    '''

    existing_group_roles = existing_roles['groupRoles']
    updated_user_roles = dict(new_user_roles) if new_user_roles else None
    updated_group_roles = dict(new_group_roles) if new_group_roles else None

    if new_user_roles:
        existing_user_roles = existing_roles['userRoles']
        for username in list(existing_user_roles.keys()):
            if username not in new_user_roles:
                # Specifying an empty list will indicate that all existing
                # roles for this user should be deleted
                updated_user_roles[username] = []

    if new_group_roles:
        for group_name in list(existing_group_roles.keys()):
            if group_name not in new_group_roles:
                # Specifying an empty list will indicate that all existing
                # roles for this group should be deleted
                updated_group_roles[group_name] = []

    return (updated_user_roles, updated_group_roles)


def _update_user_roles(resource, user_roles, session, add_roles=True):
    resource_name = resource.name
    type_name = resource.resource_type.name
    undefined_users = set()

    if user_roles is None:
        return undefined_users

    for username, roles in list(user_roles.items()):
        user = find_one_by_fields(User, False, {'username': username})

        if not user:
            undefined_users.add(username)
            add_roles = False
            continue

        if add_roles:
            new_roles = [
                {
                    'resource_name': resource_name,
                    'resource_type': type_name,
                    'role_name': role,
                }
                for role in roles
            ]
            update_user_roles(user, new_roles, resource, session, True, False)

    return undefined_users


def _update_group_roles(resource, group_roles, session, add_roles=True):
    resource_name = resource.name
    type_name = resource.resource_type.name
    undefined_groups = set()

    if group_roles is None:
        return undefined_groups

    for name, roles in list(group_roles.items()):
        group = find_one_by_fields(Group, False, {'name': name})

        if not group:
            undefined_groups.add(name)
            add_roles = False
            continue

        if add_roles:
            new_roles = [
                {
                    'resource_name': resource_name,
                    'resource_type': type_name,
                    'role_name': role,
                }
                for role in roles
            ]
            update_group_roles(group, new_roles, resource, session, True, False)

    return undefined_groups


def _update_default_roles(resource, default_roles, session, add_roles=True):
    resource_name = resource.name
    type_name = resource.resource_type.name

    if default_roles != None and add_roles:
        new_roles = [
            {
                'resource_name': resource_name,
                'resource_type': type_name,
                'role_name': default_role['roleName'],
                'apply_to_unregistered': default_role['applyToUnregistered'],
            }
            for default_role in list(default_roles.values())
        ]
        update_default_roles(new_roles, resource, session, True, False)

    return


def update_resource_roles(
    resource, user_roles=None, group_roles=None, default_roles=None
):
    db_adapter = get_db_adapter()
    session = db_adapter.session
    add_roles = True
    existing_roles = get_current_resource_roles(resource)
    user_roles, group_roles = _mark_existing_roles_for_deletion(
        existing_roles, user_roles, group_roles
    )

    undefined_users = _update_user_roles(resource, user_roles, session)
    add_roles = len(undefined_users) == 0
    undefined_groups = _update_group_roles(resource, group_roles, session, add_roles)
    add_roles = add_roles and len(undefined_groups) == 0
    _update_default_roles(resource, default_roles, session, add_roles)

    if add_roles:
        new_roles = {}
        new_roles['userRoles'] = (
            user_roles if user_roles != None else existing_roles['userRoles']
        )
        new_roles['groupRoles'] = (
            group_roles if group_roles != None else existing_roles['groupRoles']
        )
        new_roles['defaultRoles'] = (
            default_roles if default_roles != None else existing_roles['defaultRoles']
        )
        before_roles_update.send(
            resource, existing_roles=existing_roles, new_roles=new_roles
        )
        session.commit()
        after_roles_update.send(
            resource, existing_roles=existing_roles, new_roles=new_roles
        )

        return (existing_roles, new_roles)

    session.rollback()
    errors = [
        {
            'fields': ['username'],
            'message': ['User with username \'%s\' cannot be found. ' % username],
        }
        for username in undefined_users
    ]

    errors.extend(
        [
            {
                'fields': ['name'],
                'message': ['Group with name \'%s\' cannot be found. ' % group_name],
            }
            for group_name in undefined_groups
        ]
    )

    raise NotFound(
        {
            'message': 'Certain user(s) and group(s) could not be found. See the \'errors\' section.',
            'errors': errors,
        }
    )
