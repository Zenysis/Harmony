from models.alchemy.security_group import Group, GroupRoles, GroupUsers
from web.server.data.data_access import (
    get_db_adapter,
    add_entity,
    delete_entity,
    find_by_id,
    find_one_by_fields,
    find_all_by_fields,
)
from web.server.errors import ItemNotFound
from web.server.routes.views.users import try_get_user
from web.server.routes.views.core import try_get_role_and_resource


def try_get_group_role(group_id, role_id, resource_id):
    return find_one_by_fields(
        GroupRoles,
        case_sensitive=True,
        search_fields={
            'group_id': group_id,
            'role_id': role_id,
            'resource_id': resource_id,
        },
    )


def try_get_group_user(group_id, user_id):
    return find_one_by_fields(
        GroupUsers,
        case_sensitive=True,
        search_fields={'group_id': group_id, 'user_id': user_id},
    )


def list_roles_for_resource(group, resource):
    return find_all_by_fields(
        GroupRoles, search_fields={'group_id': group.id, 'resource_id': resource.id}
    )


def list_group_users(group):
    return find_all_by_fields(GroupUsers, search_fields={'group_id': group.id})


def list_group_roles_for_resource_api(resource):
    '''Returns an enumeration of groups and the roles that they hold for a given
    resource. Groups that do not hold any roles specific to the resource will not
    be listed.
    '''
    matching_rows = find_all_by_fields(
        GroupRoles, search_fields={'resource_id': resource.id}
    )
    output = {}

    for row in matching_rows:
        group = find_by_id(Group, row.group_id)
        group_roles = list_roles_for_resource(group, resource)
        role_names = [group_role.role.name for group_role in group_roles]
        output[group.name] = role_names
    return output


def add_group_role(
    group,
    role_name,
    resource_type,
    resource_name,
    session=None,
    flush=True,
    commit=True,
):
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name
    )
    resource_id = resource.id if resource else None
    entity = try_get_group_role(group.id, role.id, resource_id)
    exists = True

    if not entity:
        exists = False
        entity = GroupRoles(group_id=group.id, role_id=role.id, resource_id=resource_id)
        add_entity(session, entity, flush, commit)

    return (entity, exists)


def delete_group_role(
    group,
    role_name,
    resource_type,
    resource_name,
    session=None,
    flush=True,
    commit=True,
):
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name
    )
    resource_id = resource.id if resource else None
    entity = try_get_group_role(group.id, role.id, resource_id)
    exists = False

    if entity:
        exists = True
        delete_entity(session, entity, flush, commit)
    return (entity, exists)


def update_group_roles(
    group, new_roles, resource=None, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    new_role_entities = []
    roles = list_roles_for_resource(group, resource) if resource else group.roles

    for role in roles:
        session.delete(role)

    for role in new_roles:
        role_name = role['role_name']
        resource_type = role['resource_type']
        resource_name = resource.name if resource else role.get('resource_name')

        # Do not flush or commit these changes. We want to perform the update in a transacted
        # fashion.
        (result, _) = add_group_role(
            group,
            role_name,
            resource_type,
            resource_name,
            session,
            flush=False,
            commit=False,
        )
        new_role_entities.append(result)

    if flush:
        session.flush()

    if commit:
        session.commit()

    return new_role_entities


def update_group_roles_from_map(
    group, role_mapping, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    new_role_entities = []
    roles = group.roles

    for role in roles:
        session.delete(role)

    for resource_type in list(role_mapping.keys()):
        resource_to_roles = role_mapping[resource_type]['resources']
        sitewide_roles = role_mapping[resource_type]['sitewideRoles']

        # Add all sitewide roles for the current resource type
        for role_name in sitewide_roles:
            (result, _) = add_group_role(
                group,
                role_name,
                resource_type,
                None,
                session,
                flush=False,
                commit=False,
            )
            new_role_entities.append(result)

        # Add all resource specific roles for the current resource type
        for resource_name, role_names in list(resource_to_roles.items()):
            for role_name in role_names:
                (result, _) = add_group_role(
                    group,
                    role_name,
                    resource_type,
                    resource_name,
                    session,
                    flush=False,
                    commit=False,
                )
                new_role_entities.append(result)

    if flush:
        session.flush()

    if commit:
        session.commit()

    return new_role_entities


def add_group_user(group, username, session=None, flush=True, commit=True):
    session = session or get_db_adapter().session
    user = try_get_user(username)

    if not user:
        raise ItemNotFound('user', {'username': username})

    entity = try_get_group_user(group.id, user.id)
    exists = True

    if not entity:
        exists = False
        entity = GroupUsers(group_id=group.id, user_id=user.id)
        add_entity(session, entity, flush, commit)

    return (user, exists)


def delete_group_user(group, username, session=None, flush=True, commit=True):
    session = session or get_db_adapter().session
    user = try_get_user(username)

    if not user:
        raise ItemNotFound('user', {'username': username})

    entity = try_get_group_user(group.id, user.id)
    exists = False

    if entity:
        exists = True
        delete_entity(session, entity, flush, commit)

    return (user, exists)


def update_group_users(group, new_users, session=None, flush=True, commit=True):
    session = session or get_db_adapter().session
    updated_users = []
    group_user_relations = list_group_users(group)

    for group_user in group_user_relations:
        session.delete(group_user)

    for username in new_users:
        # Do not flush or commit these changes. We want to perform the update in a transacted
        # fashion.
        (result, _) = add_group_user(
            group, username, session, flush=False, commit=False
        )
        updated_users.append(result)

    if flush:
        session.flush()

    if commit:
        session.commit()

    return updated_users
