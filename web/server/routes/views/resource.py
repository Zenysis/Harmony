from slugify import slugify
from werkzeug.exceptions import NotFound

from models.alchemy.permission import Resource, SitewideResourceAcl, ResourceRole
from models.alchemy.user import User
from models.alchemy.security_group import Group
from models.alchemy.user import UserRoles
from web.server.data.data_access import Transaction, get_db_adapter, find_one_by_fields
from web.server.errors import ItemNotFound
from web.server.routes.views.groups import (
    delete_group_role,
    list_group_roles_for_resource_api,
    update_group_resource_roles,
)
from web.server.routes.views.users import (
    list_user_roles_for_resource_api,
    update_user_resource_roles,
    try_get_user,
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


def get_sitewide_acl_for_resource_api(resource):
    '''Gets sidewide_acl values for a particular resource.
    '''
    maybe_sitewide_acl = find_one_by_fields(
        SitewideResourceAcl, True, {'resource_id': resource.id}
    )
    if not maybe_sitewide_acl:
        return {'registeredResourceRole': '', 'unregisteredResourceRole': ''}

    registered_resource_role_name = (
        maybe_sitewide_acl.registered_resource_role.name
        if maybe_sitewide_acl.registered_resource_role
        else ''
    )
    unregistered_resource_role_name = (
        maybe_sitewide_acl.unregistered_resource_role.name
        if maybe_sitewide_acl.unregistered_resource_role
        else ''
    )

    return {
        'registeredResourceRole': registered_resource_role_name,
        'unregisteredResourceRole': unregistered_resource_role_name,
    }


def get_current_resource_roles(resource):
    return {
        'groupRoles': list_group_roles_for_resource_api(resource),
        'sitewideResourceAcl': get_sitewide_acl_for_resource_api(resource),
        'userRoles': list_user_roles_for_resource_api(resource),
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
    updated_user_roles = dict(new_user_roles) if new_user_roles is not None else None
    updated_group_roles = dict(new_group_roles) if new_group_roles is not None else None

    if new_user_roles:
        existing_user_roles = existing_roles['userRoles']
        for username in list(existing_user_roles.keys()):
            if username not in new_user_roles:
                # Specifying an empty list will indicate that all existing
                # roles for this user should be deleted
                # pylint: disable=E1137
                updated_user_roles[username] = []

    if new_group_roles:
        for group_name in list(existing_group_roles.keys()):
            if group_name not in new_group_roles:
                # Specifying an empty list will indicate that all existing
                # roles for this group should be deleted
                # pylint: disable=E1137
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
            update_user_resource_roles(user, new_roles, resource, session, True, False)

    return undefined_users


def _update_group_roles(
    resource, new_group_roles, existing_group_roles, session, add_roles=True
):
    resource_name = resource.name
    type_name = resource.resource_type.name
    undefined_groups = set()

    if new_group_roles is None:
        return undefined_groups

    if not new_group_roles and existing_group_roles:
        for name, roles in list(existing_group_roles.items()):
            group = find_one_by_fields(Group, False, {'name': name})
            for role in roles:
                delete_group_role(
                    group, role, type_name, resource_name, session=session
                )

    for name, roles in list(new_group_roles.items()):
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
            update_group_resource_roles(
                group, new_roles, resource, session, True, False
            )

    return undefined_groups


def _update_sitewide_resource_acl(resource, new_sitewide_resource_acl):
    '''Updates a specific resource's sitewideResourceAcl.
    '''
    with Transaction() as transaction:
        # Check if there is even an entry here
        sitewide_acl = transaction.find_one_by_fields(
            SitewideResourceAcl, True, {'resource_id': resource.id}
        )
        acl_exists = True
        if not sitewide_acl:
            sitewide_acl = SitewideResourceAcl(resource_id=resource.id)
            acl_exists = False

        registered_resource_role_name = new_sitewide_resource_acl[
            'registeredResourceRole'
        ]
        unregistered_resource_role_name = new_sitewide_resource_acl[
            'unregisteredResourceRole'
        ]

        sitewide_acl.registered_resource_role_id = (
            (
                transaction.find_one_by_fields(
                    ResourceRole, True, {'name': registered_resource_role_name}
                ).id
            )
            if registered_resource_role_name
            else None
        )
        sitewide_acl.unregistered_resource_role_id = (
            (
                transaction.find_one_by_fields(
                    ResourceRole, True, {'name': unregistered_resource_role_name}
                ).id
            )
            if unregistered_resource_role_name
            else None
        )

        if (
            acl_exists
            and not sitewide_acl.registered_resource_role_id
            and not sitewide_acl.unregistered_resource_role_id
        ):
            transaction.delete(sitewide_acl)
            return

        transaction.add_or_update(sitewide_acl, flush=True)


def update_resource_roles(
    resource, user_roles=None, group_roles=None, sitewide_acl=None
):
    # Update sitewide_acl. This can still be independent of other role updates
    _update_sitewide_resource_acl(resource, sitewide_acl)

    # TODO(toshi): Clean this up to use transactions
    db_adapter = get_db_adapter()
    session = db_adapter.session
    add_roles = True
    existing_roles = get_current_resource_roles(resource)
    user_roles, group_roles = _mark_existing_roles_for_deletion(
        existing_roles, user_roles, group_roles
    )
    undefined_users = _update_user_roles(resource, user_roles, session)
    add_roles = len(undefined_users) == 0
    undefined_groups = _update_group_roles(
        resource, group_roles, existing_roles['groupRoles'], session, add_roles
    )
    add_roles = add_roles and len(undefined_groups) == 0

    if add_roles:
        new_roles = {}
        new_roles['userRoles'] = user_roles
        new_roles['groupRoles'] = group_roles
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


def add_role_user(role, username, session):
    user = try_get_user(username)

    if not user:
        raise ItemNotFound('user', {'username': username})

    role_user = session.find_one_by_fields(
        UserRoles, True, {'role_id': role.id, 'user_id': user.id}
    )
    exists = True

    if not role_user:
        exists = False
        session.add_or_update(UserRoles(role_id=role.id, user_id=user.id))

    return (user, exists)


def update_role_users(role, new_users, session):
    updated_users = []
    role_users = session.find_all_by_fields(UserRoles, {'role_id': role.id})
    for role_user in role_users:
        session.delete(role_user)

    for username in new_users:
        (user, _) = add_role_user(role, username, session)
        updated_users.append(user)
    return updated_users
