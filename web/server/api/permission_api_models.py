'''Flask-Potion API models for permissions-related functionality.

Resource APIs Accessible via http://<server_uri>:5000/api2/resource
Role APIs Accessible via http://<server_uri>:5000/api2/role
'''
# pylint: disable=C0413
from collections import defaultdict
from http.client import METHOD_NOT_ALLOWED, NO_CONTENT, NOT_ACCEPTABLE, OK, UNAUTHORIZED

from flask import g, current_app, url_for
from flask_user import current_user
from flask_potion import fields
from flask_potion.routes import ItemRoute, Relation, Route
from flask_potion.schema import FieldSet

from models.alchemy.permission import (
    Permission,
    Resource,
    ResourceRole,
    ResourceType,
    RESOURCE_ROLE_NAMES,
    RESOURCE_TYPES,
    Role,
    ResourceTypeEnum,
)
from models.alchemy.user import UserRoles
from web.server.api.api_models import PrincipalResource
from web.server.api.model_schemas import (
    CONCISE_GROUP_SCHEMA,
    CONCISE_USER_SCHEMA,
    PERMISSION_SCHEMA,
)
from web.server.api.permission_api_schemas import (
    FRONTEND_ROLE_SCHEMA,
    READ_ONLY_API_MESSAGE,
    RESOURCE_ROLES_SCHEMA,
    UPDATE_ROLE_PERMISSIONS_RESPONSE_SCHEMA,
)
from web.server.api.query_api_models import QueryPolicyResource
from web.server.api.responses import STANDARD_RESPONSE_SCHEMA, StandardResponse
from web.server.data.data_access import find_by_id, Transaction
from web.server.errors import ItemNotFound, NotificationError
from web.server.potion.filters import ResourceTypeFilter
from web.server.potion.managers import RoleResourceManager
from web.server.potion.signals import after_roles_update
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.feed import create_dashboard_permission_updates
from web.server.routes.views.permission import build_role
from web.server.routes.views.resource import (
    update_resource_roles,
    get_current_resource_roles,
    update_role_users,
)
from web.server.security.permissions import SuperUserPermission, principals
from web.server.util.util import get_resource_string


class BackendTypeResource(PrincipalResource):
    class Meta:
        name = 'resource-type'
        model = ResourceType
        natural_key = 'name'

        # Read Permissions are the defaults as defined in
        # `web.server.security.permissions.PERMISSION_DEFAULTS`
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`

        # Allow API users to filter on resources by name
        filters = {'name': True}

    class Schema:
        name = fields.Custom(
            fields.String(enum=RESOURCE_TYPES),
            formatter=lambda rsc_type: rsc_type.name,
            title='Name',
            description='The string representation of the resource type.',
        )

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    # pylint: disable=E1101
    @Route.POST('', rel='create')
    def post(self, *_):
        return (
            StandardResponse(READ_ONLY_API_MESSAGE, METHOD_NOT_ALLOWED, False),
            METHOD_NOT_ALLOWED,
        )

    @ItemRoute.PATCH('', rel='update')
    def patch(self, *_):
        return (
            StandardResponse(READ_ONLY_API_MESSAGE, METHOD_NOT_ALLOWED, False),
            METHOD_NOT_ALLOWED,
        )

    @ItemRoute.DELETE('', rel='destroy')
    def delete(self, *_):
        return (
            StandardResponse(READ_ONLY_API_MESSAGE, METHOD_NOT_ALLOWED, False),
            METHOD_NOT_ALLOWED,
        )


class BackendResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `Resource` class.'''

    users = Relation('user', io='r')
    groups = Relation('group', io='r')
    resourceType = Relation('resource-type', attribute='resource_type', io='r')

    class Meta:
        model = Resource
        natural_key = 'name'

        # Marking all fields as read-only so they don't show up in the Hyperschema for any
        # destructive HTTP Methods (e.g. PUT, POST, PATCH, DELETE, etc.)
        read_only_fields = [
            'name',
            'label',
            'users',
            'groups',
            'id',
            'resource_type',
            'resource_type_id',
        ]

        # Read Permissions are the defaults as defined in
        # `web.server.security.permissions.PERMISSION_DEFAULTS`.
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`

        # Allow API users to filter on resources by name, label and
        # resource_type
        filters = {
            'name': True,
            'label': True,
            'resourceType': {None: ResourceTypeFilter, 'eq': ResourceTypeFilter},
            'users': True,
            'groups': True,
        }

    class Schema:
        name = fields.String(description='The unique name of the resource.')
        label = fields.String(description='The label of the resource.')
        resourceType = fields.Custom(
            fields.String(),
            attribute='resource_type',
            converter=None,
            formatter=lambda rsc_type: rsc_type.name.name,
            title='resourceType',
            description='The string representation of the resource type.',
            io='r',
        )
        users = fields.List(
            CONCISE_USER_SCHEMA,
            description='The user(s) that hold one or more roles for this resource.',
            io='r',
        )
        groups = fields.List(
            CONCISE_GROUP_SCHEMA,
            description='The group(s) that hold one or more roles for this resource.',
            io='r',
        )

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    # pylint: disable=E1101
    @Route.POST('', rel='create')
    def post(self, *_):
        return (
            StandardResponse(READ_ONLY_API_MESSAGE, METHOD_NOT_ALLOWED, False),
            METHOD_NOT_ALLOWED,
        )

    @ItemRoute.PATCH('', rel='update')
    def patch(self, *_):
        return (
            StandardResponse(READ_ONLY_API_MESSAGE, METHOD_NOT_ALLOWED, False),
            METHOD_NOT_ALLOWED,
        )

    @ItemRoute.DELETE('', rel='destroy')
    def delete(self, *_):
        return (
            StandardResponse(READ_ONLY_API_MESSAGE, METHOD_NOT_ALLOWED, False),
            METHOD_NOT_ALLOWED,
        )

    @ItemRoute.POST(
        '/roles',
        title='Update Resource Roles',
        description='Updates the roles that the various users and groups hold on this particular '
        'resource.',
        rel='updateRoles',
        schema=RESOURCE_ROLES_SCHEMA,
    )
    def update_resource_roles(self, resource, request):
        resource_name = resource.name
        type_name = resource.resource_type.name.name
        resource_string = get_resource_string(resource_name, type_name)
        with AuthorizedOperation('update_users', type_name, resource.id):
            user_roles = request.get('userRoles')
            group_roles = request.get('groupRoles')
            sitewide_resource_acl = request.get('sitewideResourceAcl')

            is_dashboard_resource = (
                resource.resource_type_id == ResourceTypeEnum.DASHBOARD.value
            )
            # Unique set of user roles for this resource
            unique_user_roles = set(
                role for roles in user_roles.values() for role in roles
            )
            # Unique set of group roles for this resource
            unique_group_roles = set(
                role for roles in group_roles.values() for role in roles
            )
            dashboard_admin_role_name = RESOURCE_ROLE_NAMES['DASHBOARD_ADMIN']

            # If this is a dashboard resource and there exists no dashboard admin
            # in the user roles or group roles, we cannot make this change.
            # There must always be at least 1 dashboard admin.
            if (
                is_dashboard_resource
                and dashboard_admin_role_name not in unique_user_roles
                and dashboard_admin_role_name not in unique_group_roles
            ):
                return None, NOT_ACCEPTABLE

            (existing_roles, new_roles) = update_resource_roles(
                resource, user_roles, group_roles, sitewide_resource_acl
            )

            g.request_logger.info(
                'Updating roles for %s. Existing roles are %s. New roles will be %s.',
                resource_string,
                existing_roles,
                new_roles,
            )

            return None, NO_CONTENT

    @ItemRoute.GET(
        '/roles',
        title='Get Resource Roles',
        description='Gets the roles that the various users and groups hold on this particular '
        'resource.',
        rel='getRoles',
        response_schema=RESOURCE_ROLES_SCHEMA,
    )
    def get_roles(self, resource):
        resource_name = resource.name
        resource_type = resource.resource_type.name.name
        resource_string = get_resource_string(resource_name, resource_type)
        with AuthorizedOperation('view_resource', resource_type, resource.id):
            current_roles = get_current_resource_roles(resource)
            message = (
                'Successfully retrieved a listing of all the roles for %s. '
                % resource_string
            )
            g.request_logger.debug(message)
            return current_roles


@after_roles_update.connect
def send_email(sender, existing_roles, new_roles):
    recepients = list(set(new_roles['userRoles']) - set(existing_roles['userRoles']))
    if sender.resource_type.name == ResourceTypeEnum.DASHBOARD and recepients:
        dashboard_url = url_for(
            'dashboard.grid_dashboard', name=sender.name, _external=True
        )
        try:
            for recepient in recepients:
                msg = current_app.email_renderer.create_add_dashboard_user_message(
                    recepient,
                    new_roles['userRoles'],
                    dashboard_url,
                    dashboard_name=sender.name,
                    dashboard_owner=current_user,
                    dashboard_slug=sender.name,
                )
                g.request_logger.info(
                    'Sending an email to: \'%s\' after granting them access', recepients
                )
                current_app.notification_service.send_email(msg)
        except NotificationError:
            g.request_logger.error(
                'Failed to send emails  to: \'%s\' after granting them access to dashboard',
                recepients,
            )


class BackendResourceRole(PrincipalResource):
    '''The potion class for performing CRUD operations on the `ResourceRole` class.'''

    class Meta:
        model = ResourceRole
        natural_key = 'name'

        filters = {
            'name': True,
            'resourceType': {None: ResourceTypeFilter, 'eq': ResourceTypeFilter},
        }

    class Schema:
        permissions = fields.List(
            PERMISSION_SCHEMA,
            title='Role Permissions',
            description='The permissions the role has.',
        )
        resourceType = fields.Custom(
            fields.String(),
            attribute='resource_type',
            converter=None,
            formatter=lambda rsc_type: rsc_type.name.name,
            title='resourceType',
            description='The resource type this role is associated with.',
            io='r',
        )


class RoleResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `Role` class.'''

    class Meta:
        model = Role
        natural_key = 'name'

        # Read Permissions are the defaults as defined in
        # `web.server.security.permissions.PERMISSION_DEFAULTS`
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`

        filters = {'name': True}
        manager = principals(RoleResourceManager)

    class Schema:
        permissions = fields.List(
            PERMISSION_SCHEMA,
            title='Role Permissions',
            description='The permissions the role has.',
        )
        alertResourceRoleName = fields.Custom(
            fields.String(),
            attribute='alert_resource_role',
            title='Alert resource name',
            description='Name of the dashboard resource role associated with this role',
            formatter=lambda role: role.name if role is not None else '',
        )
        dashboardResourceRoleName = fields.Custom(
            fields.String(),
            attribute='dashboard_resource_role',
            title='Dashboard resource name',
            description='Name of the dashboard resource role associated with this role',
            formatter=lambda role: role.name if role is not None else '',
        )
        queryPolicies = fields.List(
            fields.Inline(QueryPolicyResource),
            attribute='query_policies',
            title='Query policies',
            description='The query policies the role has permissions to.',
        )
        usernames = fields.List(
            fields.Custom(fields.String, formatter=lambda user: user.username),
            attribute='users',
            title='Users',
            description='The users who have permissions to this role',
        )
        dataExport = fields.Boolean(
            attribute='enable_data_export',
            description='Defines if a user has permissions to export data.',
        )

    # pylint: disable=E1101
    @Route.POST(
        '',
        rel='create',
        title='Create a role',
        schema=FRONTEND_ROLE_SCHEMA,
        response_schema=fields.Inline('self'),
    )
    def create_role(self, obj):
        if SuperUserPermission().can():
            unique_name = obj['label'].lower().replace(' ', '_')
            new_role = build_role(obj)
            new_role['name'] = unique_name
            return self.manager.create(new_role)
        return None, UNAUTHORIZED

    @ItemRoute.PATCH(
        '',
        rel='update',
        title='Update a role with new tools and permissions',
        schema=FRONTEND_ROLE_SCHEMA,
        response_schema=fields.Inline('self'),
    )
    def update_role(self, role, obj):
        if SuperUserPermission().can():
            return self.manager.update(role, build_role(obj))
        return None, UNAUTHORIZED

    # pylint: disable=E1101
    @ItemRoute.PATCH(
        '/permissions',
        title='Update Role Permissions',
        description='Updates the role\'s permissions with the values specified.',
        rel='updatePermissions',
        schema=fields.List(
            PERMISSION_SCHEMA,
            title='Updated Permissions',
            description='The updated role permissions.',
        ),
        response_schema=fields.Inline('self'),
    )
    def update_role_permissions(self, role, permission_list):
        with AuthorizedOperation('update_permissions', 'role', role.id):
            permission_id_list = [permission.id for permission in permission_list]
            permission_objects = Permission.query.filter(
                Permission.id.in_(permission_id_list)
            ).all()
            return self.manager.update(role, {'permissions': permission_objects})

    @ItemRoute.POST(
        '/permission',
        title='Add Role Permission',
        description='Adds a single permission to a Role.',
        rel='addPermission',
        schema=FieldSet(
            {
                'permissionId': fields.Integer(
                    description='The id of the new permission to be added to this role.'
                )
            }
        ),
        response_schema=UPDATE_ROLE_PERMISSIONS_RESPONSE_SCHEMA,
    )
    def add_single_permision(self, role, permissionId):
        with AuthorizedOperation('update_permissions', 'role', role.id):
            new_permission = find_by_id(Permission, permissionId)

            if not new_permission:
                raise ItemNotFound('permission', id=permissionId)

            exists = True
            if new_permission not in role.permissions:
                exists = False
                role.permissions.append(new_permission)
                self.manager.update(role, {'permissions': role.permissions})

            added_message = 'already exists for' if exists else 'has been added'
            success_message = 'Permission \'%s\' %s to Role \'%s\'.' % (
                new_permission.permission,
                added_message,
                role.name,
            )
            return StandardResponse(success_message, OK, True)

    @ItemRoute.DELETE(
        '/permission',
        title='Delete Role Permission',
        description='Deletes a single permission from a role.',
        schema=FieldSet(
            {
                'permissionId': fields.Integer(
                    description='The id of the new permission to be deleted from this role.'
                )
            }
        ),
        response_schema=UPDATE_ROLE_PERMISSIONS_RESPONSE_SCHEMA,
        rel='deletePermission',
    )
    def delete_individual_permission(self, role, permissionId):
        with AuthorizedOperation('update_permissions', 'role', role.id):
            old_permission = find_by_id(Permission, permissionId)

            if not old_permission:
                raise ItemNotFound('permission', id=permissionId)

            exists = True
            try:
                role.permissions.remove(old_permission)
                self.manager.update(role, {'permissions': role.permissions})
            except ValueError:
                exists = False

            deleted_message = (
                'has been removed from' if exists else 'does not exist for'
            )
            success_message = 'Permission \'%s\' %s Role \'%s\'.' % (
                old_permission.permission,
                deleted_message,
                role.name,
            )
            return StandardResponse(success_message, OK, True)

    # pylint: disable=R0201
    @Route.GET(
        '/num_users',
        title='Get number of users for each role.',
        description='Retrieves a mappping of role name to the number of users '
        'associated with the role.',
        response_schema=fields.Object(
            properties=fields.Integer(),
            pattern_properties={
                fields.String(
                    title='roleName', description='A role name.'
                ): fields.Integer(description='Number of users')
            },
            description='An object representing a mapping between role name'
            ' and number of users with permissions to that role.',
        ),
    )
    def get_roles_num_users(self):
        if SuperUserPermission().can():
            with Transaction() as transaction:
                user_roles = transaction.find_all_by_fields(UserRoles, {})
                role_id_to_user_roles_map = defaultdict(lambda: [])
                for user_role in user_roles:
                    role_id_to_user_roles_map[user_role.role_id].append(user_role)

                role_to_num_users_map = {}
                for role_id, user_role_list in role_id_to_user_roles_map.items():
                    role_name = transaction.find_by_id(Role, role_id).name
                    role_to_num_users_map[role_name] = len(user_role_list)

                return role_to_num_users_map
        return None, UNAUTHORIZED

    @ItemRoute.PATCH(
        '/users',
        title='Update Role Users',
        description='Updates the users that currently have permissions for this role.',
        schema=fields.List(
            fields.String(title='username', description='The user\'s username')
        ),
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='updateUsers',
    )
    def update_users(self, role, usernames):
        with AuthorizedOperation(
            'edit_resource', 'role', role.id
        ), Transaction() as transaction:
            update_role_users(role, usernames, transaction)
            return StandardResponse('Role usernames has been updated', OK, True)
        return None, UNAUTHORIZED


# pylint: disable=W0613
@after_roles_update.connect
def invalidate_roles_update(sender, existing_roles, new_roles):
    users = set(new_roles['userRoles'])
    cache = current_app.cache
    for username in users:
        if cache.has(username):
            cache.delete(username)
    g.request_logger.info('Invalidate cache for users %s after updating roles', users)


# TODO(david): Fix typing of this array
RESOURCE_TYPES = [
    BackendTypeResource,  # type: ignore
    BackendResource,  # type: ignore
    BackendResourceRole,  # type: ignore
    RoleResource,  # type: ignore
]
