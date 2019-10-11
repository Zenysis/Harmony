from models.alchemy.user import DefaultRoles
from web.server.data.data_access import (
    add_entity,
    delete_entity,
    find_all_by_fields,
    find_one_by_fields,
    get_db_adapter,
)
from web.server.routes.views.core import try_get_role_and_resource


def list_default_roles():
    '''Returns an enumeration of all the default roles that all registered
    users (and potentially, unregistered users) possess.
    '''
    return find_all_by_fields(DefaultRoles, {}) or []


def list_roles_for_resource(resource):
    '''Returns an enumeration of the default roles that all registered users
    (and potentially, unregistered users) possess for a given resource.
    '''
    return find_all_by_fields(DefaultRoles, search_fields={'resource_id': resource.id})


def list_default_roles_for_resource_api(resource):
    '''Returns the API-friendly representation of the default roles that all
    registered users (and potentially, unregistered users) possess for a given
    resource.
    '''
    output = {}
    default_roles = list_roles_for_resource(resource)
    for default_role in default_roles:
        role_name = default_role.role.name
        apply_to_unregistered = default_role.apply_to_unregistered
        output[role_name] = {
            'roleName': role_name,
            'applyToUnregistered': apply_to_unregistered,
        }

    return output


def try_get_default_role(role_id, resource_id, apply_to_unregistered):
    '''Given a role and resource id, attempts to determine if such a role,
    resource association exists in the permissions table.
    '''
    return find_one_by_fields(
        DefaultRoles,
        case_sensitive=True,
        search_fields={
            'role_id': role_id,
            'resource_id': resource_id,
            'apply_to_unregistered': apply_to_unregistered,
        },
    )


def add_default_role(
    role_name,
    resource_type,
    apply_to_unregistered,
    resource_name=None,
    session=None,
    flush=True,
    commit=True,
):
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name
    )
    resource_id = resource.id if resource else None
    entity = try_get_default_role(role.id, resource_id, apply_to_unregistered)
    exists = False

    if not entity:
        exists = True
        entity = DefaultRoles(
            role_id=role.id,
            resource_id=resource_id,
            apply_to_unregistered=apply_to_unregistered,
        )
        add_entity(session, entity, flush, commit)

    return (entity, exists)


def delete_default_role(
    role_name,
    resource_type,
    apply_to_unregistered,
    resource_name=None,
    session=None,
    flush=True,
    commit=True,
):
    session = session or get_db_adapter().session
    (role, resource_type, resource) = try_get_role_and_resource(
        role_name, resource_type, resource_name
    )
    resource_id = resource.id if resource else None
    entity = try_get_default_role(role.id, resource_id, apply_to_unregistered)
    exists = False

    if entity:
        exists = True
        delete_entity(session, entity, flush, commit)
    return (entity, exists)


def update_default_roles(
    new_roles, resource=None, session=None, flush=True, commit=True
):
    session = session or get_db_adapter().session
    new_role_entities = []
    roles = list_roles_for_resource(resource) if resource else list_default_roles()

    for role in roles:
        session.delete(role)

    for role in new_roles:
        role_name = role['role_name']
        resource_type = role['resource_type']
        resource_name = resource.name if resource else role.get('resource_name')
        apply_to_unregistered = role['apply_to_unregistered']

        # Do not flush or commit these changes. We want to perform the update in a transacted
        # fashion.
        (result, _) = add_default_role(
            role_name,
            resource_type,
            apply_to_unregistered,
            resource_name,
            session,
            flush,
            commit,
        )
        new_role_entities.append(result)

    if flush:
        session.flush()

    if commit:
        session.commit()

    return new_role_entities
