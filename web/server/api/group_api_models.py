from future import standard_library

standard_library.install_aliases()
from builtins import object
from http.client import OK, CREATED

from flask import g
from flask_potion import fields
from flask_potion.routes import ItemRoute, Relation

from models.alchemy.security_group import Group
from web.server.api.api_models import PrincipalResource
from web.server.api.model_schemas import (
    CONCISE_USER_SCHEMA,
    GROUP_ROLES_SCHEMA,
    ROLE_MAP_SCHEMA,
    group_role_as_dictionary,
    role_list_as_map,
)
from web.server.api.responses import STANDARD_RESPONSE_SCHEMA, StandardResponse
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.groups import (
    add_group_role,
    delete_group_role,
    update_group_roles_from_map,
    add_group_user,
    delete_group_user,
    update_group_users,
)
from web.server.util.util import get_resource_string, get_user_string


class GroupResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `Group` class.
    '''

    users = Relation('user', io='r')

    class Meta(object):
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

    class Schema(object):
        users = fields.List(
            CONCISE_USER_SCHEMA, description='The individual users in a group.', io='r'
        )
        roles = fields.Custom(
            ROLE_MAP_SCHEMA,
            description='The role(s) that all members of the group possess',
            attribute='roles',
            formatter=role_list_as_map,
            default=[],
            io='r',
        )

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
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


RESOURCE_TYPES = [GroupResource]
