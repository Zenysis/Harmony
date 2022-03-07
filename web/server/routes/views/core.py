# pylint: disable=C0103
from werkzeug.exceptions import NotFound

from models.alchemy.permission import Resource, ResourceRole, ResourceType
from web.server.data.data_access import find_one_by_fields


def try_get_resource_type(resource_type):
    return find_one_by_fields(
        ResourceType, case_sensitive=True, search_fields={'name': resource_type}
    )


def try_get_role_and_resource(
    role_name, resource_type, resource_name=None, session=None
):
    '''Given a role name, resource type and optionally a resource name, attempts to find the
    corresponding Database entities associated with them.

    Parameters
    ----------
    role_name : string
        The name of the role that you wish to retrieve (e.g. 'dashboard_admin')

    resource_type : string
        The type of resource type that you wish to retrieve (e.g. 'dashboard')

    resource_name (optional): string
        The name of the resource in question (e.g. 'jsc'). If not specified,
        a null value for this entity will be returned.

    Returns
    -------
    tuple
        The first element being the role entity, the second being the resource type entity
        and the third element representing the resource entity (will be null if resource_name
        was not specified).

    Raises
    -------
    werzkeug.exceptions.NotFound
        In the event that one or more of the entities requested could not be found or there is a
        mismatch between resource types for `role` and `resource` (e.g. if `role` is `group_admin`
        and `resource` is `jsc-dashboard`).
    '''
    # NOTE(toshi): All references to `role` actually refers to a ResourceRole
    role = find_one_by_fields(
        ResourceRole,
        case_sensitive=False,
        search_fields={'name': role_name},
        session=session,
    )
    resource_type_entity = find_one_by_fields(
        ResourceType,
        case_sensitive=True,
        search_fields={'name': resource_type},
        session=session,
    )
    resource = None
    if resource_name and resource_type_entity:
        resource = find_one_by_fields(
            Resource,
            case_sensitive=False,
            search_fields={
                'name': resource_name,
                'resource_type_id': resource_type_entity.id,
            },
            session=session,
        )

    errors = []
    if not role:
        errors.append(
            {
                'fields': ['roleName'],
                'message': 'Role \'%s\' does not exist. ' % role_name,
            }
        )

    if not resource_type_entity:
        errors.append(
            {
                'fields': ['resourceType'],
                'message': 'Resource type \'%s\' does not exist. ' % resource_type,
            }
        )

    if resource_name and not resource:
        errors.append(
            {
                'fields': ['resourceName'],
                'message': (
                    'Resource \'%s\' of type \'%s\' does not exist. '
                    % (resource_name, resource_type)
                ),
            }
        )

    role_permission_resource_type = role.permissions[0].resource_type
    if (
        resource
        and role
        and resource.resource_type_id != role_permission_resource_type.id
    ):
        errors.append(
            {
                'fields': ['resourceType', 'roleName'],
                'message': (
                    'Role \'%s\' is only valid for resource type: \'%s\'. '
                    'Resource \'%s\' is of type \'%s\'. '
                )
                % (
                    role.name,
                    role_permission_resource_type.name,
                    resource.name,
                    resource.resource_type.name,
                ),
            }
        )

    if errors:
        message = {
            'errors': errors,
            'message': 'Errors were encountered while trying to retrieve role and resource data.',
        }
        raise NotFound(message)

    return (role, resource_type_entity, resource)
