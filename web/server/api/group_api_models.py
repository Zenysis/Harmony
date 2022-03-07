from http.client import OK, CREATED, UNAUTHORIZED

from flask import g
from flask_login import current_user
from flask_potion import fields
from flask_potion.routes import ItemRoute, Relation, Route

from models.alchemy.security_group import Group, GroupAcl
from web.server.api.api_models import PrincipalResource
from web.server.api.model_schemas import (
    ACL_SCHEMA,
    CONCISE_USER_SCHEMA,
    GROUP_ROLES_SCHEMA,
    ROLE_MAP_SCHEMA,
    group_role_as_dictionary,
)
from web.server.api.permission_api_schemas import (
    RESOURCE_ROLE_SUMMARY,
    RESOURCE_SUMMARY,
)

# pylint:disable=C0413
from web.server.api.permission_api_models import RoleResource
from web.server.api.responses import STANDARD_RESPONSE_SCHEMA, StandardResponse
from web.server.potion.managers import GroupResourceManager
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.groups import (
    add_group_role,
    delete_group_role,
    update_group_roles_from_map,
    add_group_user,
    delete_group_user,
    update_group_users,
    build_group,
    update_group_acls,
    delete_group,
)
from web.server.security.permissions import SuperUserPermission, principals
from web.server.util.util import get_resource_string, get_user_string

FRONTEND_GROUP_SCHEMA = fields.Object(
    {
        '$uri': fields.String(),
        'name': fields.String(),
        'acls': fields.List(ACL_SCHEMA),
        'users': fields.List(fields.String(description='Users username')),
        'roles': fields.List(fields.String(description='Role uris')),
    }
)


class GroupAclResource(PrincipalResource):
    class Meta:
        name = 'group_acl'
        model = GroupAcl

    class Schema:
        resource = RESOURCE_SUMMARY
        resourceRole = RESOURCE_ROLE_SUMMARY


class GroupResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `Group` class.'''

    users = Relation('user', io='r')

    class Meta:
        name = 'group'
        title = 'Groups API'
        description = (
            'The API through which CRUD operations can be performed on User Groups.'
        )
        model = Group
        natural_key = 'name'
        filters = {'name': True}

        # Read Permissions are the defaults as defined in
        # `web.server.security.permissions.PERMISSION_DEFAULTS`
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`

        manager = principals(GroupResourceManager)

    class Schema:
        users = fields.List(
            CONCISE_USER_SCHEMA, description='The individual users in a group.', io='r'
        )
        roles = fields.Array(
            fields.Inline(RoleResource),
            description='The role(s) that all members of the group possess.',
        )
        acls = fields.Array(fields.Inline(GroupAclResource), attribute='acls')

    # pylint: disable=E1101
    @Route.POST(
        '',
        rel='create',
        title='Add New Group',
        description='Creates a new group',
        schema=FRONTEND_GROUP_SCHEMA,
        response_schema=fields.Inline('self'),
    )
    def create_group(self, group_obj):
        '''
        This endpoint creates a group and adds the creator to that group if the creator is not
        `Admin` like a `Manager`.
        '''
        with AuthorizedOperation('create_resource', 'group'):
            # We update users separately because self.manager.update cannot
            # hash users list.
            group = self.manager.create(build_group(group_obj))
            if current_user.is_superuser():
                update_group_users(group, group_obj.get('users', []))
            else:
                update_group_users(group, [current_user.username])
            update_group_acls(group, group_obj.get('acls', []))
            return None, OK

    @ItemRoute.PATCH(
        '',
        rel='update',
        title='Update group',
        description='Updates a group',
        schema=FRONTEND_GROUP_SCHEMA,
        response_schema=fields.Inline('self'),
    )
    def update_group(self, group, obj):
        with AuthorizedOperation('edit_resource', 'group'):
            # We update users separately because self.manager.update cannot
            # hash users list.
            updated_group = self.manager.update(group, build_group(obj))
            update_group_users(updated_group, obj.get('users', []))
            update_group_acls(updated_group, obj.get('acls', []))
            return None, OK

    # Overriding the default method here because Flask-Potion is unable to
    # serialize users. We manually remove group_users mappings before removing
    # the group.
    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    @ItemRoute.DELETE(
        '', rel='destroy', title='Delete group', description='Deletes a group'
    )
    def delete_group(self, group):
        with AuthorizedOperation('delete_resource', 'group'):
            delete_group(group)
            return None, OK

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    # pylint: disable=E1101
    @ItemRoute.POST(
        '/roles',
        title='Add Group Role',
        description='Adds a single role to a group.',
        schema=GROUP_ROLES_SCHEMA,
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='addRole',
    )
    def add_role_by_name(self, group, request):
        with AuthorizedOperation('edit_resource', 'group', group.id):
            role_name = request['roleName']
            resource_name = request.get('resourceName')
            resource_type = request['resourceType']
            (_, exists) = add_group_role(group, role_name, resource_type, resource_name)
            action = 'already exists' if exists else 'has been added'
            message = 'Role \'%s\' %s for %s' % (
                role_name,
                action,
                get_resource_string(resource_name, resource_type),
            )
            g.request_logger.info(message)
            response_code = OK if exists else CREATED
            return (StandardResponse(message, response_code, True), response_code)

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    # pylint: disable=E1101
    @ItemRoute.PATCH(
        '/roles',
        title='Update Group Roles',
        description='Updates all the roles for a group with the values specified.',
        schema=ROLE_MAP_SCHEMA,
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='updateRoles',
    )
    def update_roles(self, group, request):
        with AuthorizedOperation('edit_resource', 'group', group.id):
            roles = update_group_roles_from_map(group, request)
            message = (
                'Successfully updated the roles attached to group \'%s\'. '
                'New roles are now: \'%s\''
                % (group.name, [group_role_as_dictionary(role) for role in roles])
            )
            g.request_logger.info(message)
            return StandardResponse(message, OK, True)

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    # pylint: disable=E1101
    @ItemRoute.DELETE(
        '/roles',
        title='Delete Group Role',
        description='Deletes a single role from a group.',
        schema=GROUP_ROLES_SCHEMA,
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='deleteRole',
    )
    def delete_role_by_name(self, group, request):
        with AuthorizedOperation('edit_resource', 'group', group.id):
            role_name = request['roleName']
            resource_name = request['resourceName']
            resource_type = request['resourceType']
            (_, exists) = delete_group_role(
                group, role_name, resource_type, resource_name
            )
            action = 'has been deleted' if exists else 'does not exist'
            message = 'Role \'%s\' %s for %s' % (
                role_name,
                action,
                get_resource_string(resource_name, resource_type),
            )
            g.request_logger.info(message)
            return StandardResponse(message, OK, True)

    # pylint: disable=E1101
    @ItemRoute.PATCH(
        '/users',
        title='Update Group Users',
        description='Updates the users that are currently in the group with the values specified.',
        schema=fields.List(
            fields.String(title='username', description='The user\'s username')
        ),
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='updateUsers',
    )
    def update_users(self, group, request):
        with AuthorizedOperation('edit_resource', 'group', group.id):
            users = update_group_users(group, request)
            directory_listing = [
                get_user_string(user, include_ip=False) for user in users
            ]
            message = (
                'Updated the member list for group \'%s\'. The current users are \'%s\'.'
                % (group.name, directory_listing)
            )
            g.request_logger.info(message)
            return StandardResponse(message, OK, True)

    @ItemRoute.POST(
        '/users',
        title='Add Group User',
        description='Adds a user to the group.',
        schema=fields.String(title='username', description='The user\'s username'),
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='addUser',
    )
    def add_user_by_username(self, group, request):
        with AuthorizedOperation('edit_resource', 'group', group.id):
            user, exists = add_group_user(group, request)
            action = (
                'has been added to the member list of'
                if exists
                else 'is already a member of'
            )
            message = 'User \'%s\' %s group \'%s\'. ' % (
                get_user_string(user, include_ip=False),
                action,
                group.name,
            )
            g.request_logger.info(message)
            return StandardResponse(message, OK if exists else CREATED, True)

    @ItemRoute.DELETE(
        '/users',
        title='Delete Group User',
        description='Deletes a user from the group.',
        schema=fields.String(title='username', description='The user\'s username'),
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='deleteUser',
    )
    def delete_user_by_username(self, group, request):
        with AuthorizedOperation('edit_resource', 'group', group.id):
            user, exists = delete_group_user(group, request)
            action = (
                'has been deleted from the member list of'
                if exists
                else 'is not a member of'
            )
            message = 'User \'%s\' %s group \'%s\'. ' % (
                get_user_string(user, include_ip=False),
                action,
                group.name,
            )
            g.request_logger.info(message)
            return StandardResponse(message, OK, True)


RESOURCE_TYPES = [GroupAclResource, GroupResource]
