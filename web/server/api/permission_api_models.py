'''Flask-Potion API models for permissions-related functionality.

Resource APIs Accessible via http://<server_uri>:5000/api2/resource
Role APIs Accessible via http://<server_uri>:5000/api2/role
'''

from future import standard_library

standard_library.install_aliases()
from builtins import object
from http.client import BAD_REQUEST, METHOD_NOT_ALLOWED, OK, NO_CONTENT

from flask import g, current_app, url_for
from flask_potion import fields
from flask_potion.contrib.alchemy import fields as alchemy_fields
from flask_potion.routes import ItemRoute, Relation, Route
from flask_potion.schema import FieldSet

from models.alchemy.permission import (
    Permission,
    Resource,
    ResourceType,
    RESOURCE_TYPES,
    Role,
    ResourceTypeEnum,
)
from web.server.api.api_models import PrincipalResource
from web.server.api.model_schemas import (
    CONCISE_GROUP_SCHEMA,
    CONCISE_USER_SCHEMA,
    PERMISSION_SCHEMA,
    RESOURCE_TYPE_FIELDS,
    ROLE_NAME_SCHEMA,
)
from web.server.api.responses import StandardResponse, augment_standard_schema
from web.server.data.data_access import find_by_id
from web.server.errors import ItemNotFound, NotificationError
from web.server.potion.filters import ResourceTypeFilter
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.resource import (
    update_resource_roles,
    get_current_resource_roles,
)
from web.server.util.util import get_resource_string
from web.server.potion.signals import after_roles_update

# The schema of the response object returned when trying to update the permissions of a `Role`
ROLE_PERMISSIONS_FIELDS = {
    'roleResourceType': alchemy_fields.InlineModel(
        RESOURCE_TYPE_FIELDS,
        description='The Resource type corresponding to the Role.',
        model=ResourceType,
        nullable=True,
    ),
    'permissionResourceType': alchemy_fields.InlineModel(
        RESOURCE_TYPE_FIELDS,
        description='The Resource type corresponding to the Permission.',
        model=ResourceType,
        nullable=True,
    ),
}

UPDATE_ROLE_PERMISSIONS_RESPONSE_SCHEMA = augment_standard_schema(
    ROLE_PERMISSIONS_FIELDS
)
ROLE_LIST_SCHEMA = fields.List(
    ROLE_NAME_SCHEMA,
    title='roles',
    description='A listing of roles held by a user or security group on an '
    'indvidual resource or all resources of a specific type.',
)

DEFAULT_ROLE_SCHEMA = fields.Object(
    {
        'roleName': ROLE_NAME_SCHEMA,
        'applyToUnregistered': fields.Boolean(
            nullable=False,
            description='Indicates whether or not this role only applies to registered users. If '
            'set to `false` it only applies to registered users. If set to `false`, it '
            'applies to unregistered/anonymous users as well as long as public access '
            'is enabled.',
        ),
    }
)


USER_ROLES_MAPPING = fields.Object(
    properties=ROLE_LIST_SCHEMA,
    pattern_properties={
        fields.String(
            title='username', description='The user\'s username'
        ): ROLE_LIST_SCHEMA
    },
    default=None,
    nullable=True,
    description='A mapping of usernames to a list of roles that a user should have for a given '
    'resource. Do not specify if user roles for the resource are not to be updated. '
    'Specify an empty list to delete ALL user roles for this resource.',
)

GROUP_ROLES_MAPPING = fields.Object(
    properties=ROLE_LIST_SCHEMA,
    pattern_properties={
        fields.String(title='name', description='The group\'s name'): ROLE_LIST_SCHEMA
    },
    nullable=True,
    default=None,
    description='An object defining the roles that a group should have for a given resource. '
    'Do not specify if group roles for the resource are not to be updated. '
    'Specify an empty list to delete ALL group roles for this resource. ',
)

DEFAULT_ROLES_MAPPING = fields.Object(
    properties=DEFAULT_ROLE_SCHEMA,
    pattern_properties={ROLE_NAME_SCHEMA: DEFAULT_ROLE_SCHEMA},
    nullable=True,
    default=None,
    description='The role(s) that all registered users and optionally, unregistered users hold on '
    'this resource.',
)

RESOURCE_ROLES_FIELDS = {
    'userRoles': USER_ROLES_MAPPING,
    'groupRoles': GROUP_ROLES_MAPPING,
    'defaultRoles': DEFAULT_ROLES_MAPPING,
}

# The schema for the request object when trying to update the roles that users and groups hold
# for a Resource
RESOURCE_ROLES_SCHEMA = fields.Object(
    RESOURCE_ROLES_FIELDS,
    description='The permissions mapping describing which roles should be assigned to users '
    '(registered and unregistered) and groups for this particular resource. '
    'All parameters are optional. Specify an empty list for a parameter to delete all '
    'respective roles for authorization that type (e.g. an empty list for `user_roles` '
    'will delete ALL roles for ALL users on the given resource). A `null` value for a '
    'parameter will result in no permissions being changed for that authorization '
    'type (e.g. specifying a null value for `user_roles` will result in no changes '
    'being made to user roles for the given resource).',
)

RESPECTIVE_APIS = {
    'user': 'api2/user',
    'group': 'api2/group',
    'dashboard': 'api2/dashboard',
    'query_policy': 'api2/query_policy',
}
READ_ONLY_API_MESSAGE = (
    'Method is not supported. This is a read-only API. '
    'Direct all CRUD operations for a given resource type to its '
    'respective URI. They are as follows: %s' % RESPECTIVE_APIS
)


class BackendTypeResource(PrincipalResource):
    class Meta(object):
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

    class Schema(object):
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
    '''The potion class for performing CRUD operations on the `Resource` class.
    '''

    users = Relation('user', io='r')
    groups = Relation('group', io='r')
    resourceType = Relation('resource-type', attribute='resource_type', io='r')

    class Meta(object):
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
        # `web.server.security.permissions.PERMISSION_DEFAULTS`
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

    class Schema(object):
        name = fields.String(description='The unique name of the resource.')
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
    def update_roles(self, resource, request):
        resource_name = resource.name
        type_name = resource.resource_type.name.name
        resource_string = get_resource_string(resource_name, type_name)
        with AuthorizedOperation('update_users', type_name, resource.id):
            user_roles = request.get('userRoles')
            group_roles = request.get('groupRoles')
            default_roles = request.get('defaultRoles')
            for (_, role_object) in list(default_roles.items()):
                if role_object['applyToUnregistered']:
                    with AuthorizedOperation(
                        'publish_resource', type_name, resource.id
                    ):
                        pass

            (existing_roles, new_roles) = update_resource_roles(
                resource, user_roles, group_roles, default_roles
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
                    recepient, new_roles['userRoles'], dashboard_url
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


class RoleResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `Role` class.
    '''

    resourceType = Relation('resource-type', attribute='resource_type', io='r')

    class Meta(object):
        model = Role
        natural_key = 'name'

        # Read Permissions are the defaults as defined in
        # `web.server.security.permissions.PERMISSION_DEFAULTS`
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`

        filters = {
            'name': True,
            'resourceType': {None: ResourceTypeFilter, 'eq': ResourceTypeFilter},
        }

    class Schema(object):
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
    )
    def update_role_permissions(self, role, new_permissions):
        with AuthorizedOperation('update_permissions', 'role', role.id):
            self.manager.update(role, {'permissions': new_permissions})
            return None, NO_CONTENT

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

            if new_permission.resource_type_id != role.resource_type_id:
                error_message = (
                    'The resource type associated with the permission '
                    'must match the resource type of the role.'
                )
                return (
                    StandardResponse(
                        error_message,
                        BAD_REQUEST,
                        False,
                        roleResourceType=new_permission.resource_type,
                        permissionResourceType=role.resource_type,
                    ),
                    BAD_REQUEST,
                )

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

            if old_permission.resource_type_id != role.resource_type_id:
                error_message = (
                    'The resource type associated with the permission '
                    'must match the resource type of the role.'
                )
                return (
                    StandardResponse(
                        error_message,
                        BAD_REQUEST,
                        False,
                        roleResourceType=old_permission.resource_type,
                        permissionResourceType=role.resource_type,
                    ),
                    BAD_REQUEST,
                )

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


# pylint: disable=W0613
@after_roles_update.connect
def invalidate_roles_update(sender, existing_roles, new_roles):
    users = set(new_roles['userRoles'])
    cache = current_app.cache
    for username in users:
        if cache.has(username):
            cache.delete(username)
    g.request_logger.info('Invalidate cache for users %s after updating roles', users)


RESOURCE_TYPES = [BackendTypeResource, BackendResource, RoleResource]
