'''Flask-Potion API models for user-related functionality.

User APIs Accessible via http://<server_uri>:5000/api2/user
'''
from http.client import BAD_REQUEST, OK, NO_CONTENT, UNAUTHORIZED

from flask import current_app, g
from flask_potion import fields
from flask_potion.routes import ItemRoute, Route
from flask_potion.schema import FieldSet
from flask_potion.signals import before_delete, after_delete
from flask_user import current_user
from werkzeug.exceptions import BadRequest

from models.alchemy.user import User, UserAcl, USER_STATUSES, UserStatusEnum
from web.server.api.api_models import PrincipalResource
from web.server.api.model_schemas import (
    ACL_SCHEMA,
    USER_ROLES_SCHEMA,
    USERNAME_SCHEMA,
    INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER,
    INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY,
    ROLE_MAP_SCHEMA,
    role_list_as_map,
    user_role_as_dictionary,
)
from web.server.api.permission_api_schemas import (
    RESOURCE_ROLE_SUMMARY,
    RESOURCE_SUMMARY,
)

# pylint:disable=C0413
from web.server.api.permission_api_models import RoleResource
from web.server.api.responses import STANDARD_RESPONSE_SCHEMA, StandardResponse
from web.server.errors import UserAlreadyInvited
from web.server.routes.views.authorization import (
    AuthorizedOperation,
    authorization_required,
)
from web.server.routes.views.admin import send_reset_password
from web.server.api.user_api_schemas import (
    FRONTEND_USER_UPDATE_SCHEMA,
    INVITE_OBJECT_SCHEMA,
    FIRST_NAME_SCHEMA,
    LAST_NAME_SCHEMA,
    PHONE_NUMBER_SCHEMA,
    STATUS_SCHEMA,
)
from web.server.routes.views.users import (
    add_user_role_api,
    build_user_updates,
    delete_user_role_api,
    force_delete_user,
    get_user_owned_resources,
    invite_users,
    Invitee,
    update_user_acls,
    update_user_groups,
    update_user_roles_from_map,
)
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID, SuperUserPermission
from web.server.util.util import (
    EMAIL_REGEX,
    get_resource_string,
    get_user_string,
    Success,
)
from web.server.potion.signals import after_user_role_change


class UserAclResource(PrincipalResource):
    class Meta:
        name = 'user_acl'
        model = UserAcl

    class Schema:
        resource = RESOURCE_SUMMARY
        resourceRole = RESOURCE_ROLE_SUMMARY


class UserResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `User` class.'''

    class Meta(object):
        title = 'Users API'
        description = (
            'The API through which CRUD operations can be performed on User(s).'
        )
        model = User
        natural_key = 'username'

        permissions = {'read': 'yes'}
        # Read Permissions are the defaults as defined in
        # `web.server.security.permissions.PERMISSION_DEFAULTS`
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`

        # Allow users to filter resources by name, username, status, and phone
        filters = {
            'username': True,
            'status': True,
            'firstName': True,
            'lastName': True,
            'phoneNumber': True,
        }

        exclude_fields = ('password', 'reset_password_token')

    class Schema(object):
        username = USERNAME_SCHEMA
        roles = fields.Array(
            fields.Inline(RoleResource),
            description='The role(s) that the user currently possesses.',
        )
        firstName = FIRST_NAME_SCHEMA
        lastName = LAST_NAME_SCHEMA
        phoneNumber = PHONE_NUMBER_SCHEMA
        # Disabling this warning because Hyper-Schema is enforcing
        # that the value of this field MUST match one of the values
        # of the Enum.
        # pylint:disable=E1136
        # pylint: disable=E1101
        status = STATUS_SCHEMA
        acls = fields.Array(fields.Inline(UserAclResource), attribute='acls')

    # TODO(toshi): Combine schemas
    # pylint: disable=R0201
    # pylint: disable=E1101
    @ItemRoute.PATCH(
        '',
        rel='update',
        title='Update user',
        description='Updates a user',
        schema=FRONTEND_USER_UPDATE_SCHEMA,
        response_schema=fields.Inline('self'),
    )
    def update_user(self, db_user, obj):
        with AuthorizedOperation('edit_user', 'site'):
            updates = build_user_updates(obj)
            updated_user = self.manager.update(db_user, updates)
            update_user_acls(updated_user, obj.get('acls', []))
            update_user_groups(updated_user, obj.get('groups', []))
            return update_user_groups, OK

    # The parameter is coming directly from the API which uses camelCase instead of
    # snake_case
    # pylint: disable=C0103
    # pylint: disable=E1101
    @ItemRoute.POST(
        '/password',
        title='Update User Password',
        description='Updates the user\'s password with the new value specified.',
        rel='updatePassword',
        schema=FieldSet(
            {
                'newPassword': fields.String(
                    min_length=10,
                    max_length=255,
                    description='The new password for the user.',
                )
            }
        ),
    )
    def update_password(self, user, newPassword):
        # TODO(vedant) Refactor this into a separate module like
        # we do for the Groups API
        with AuthorizedOperation('change_password', 'user', user.id):
            hashed_password = current_app.user_manager.hash_password(newPassword)
            self.manager.update(user, {'password': hashed_password})
            return None, NO_CONTENT

    @ItemRoute.POST(
        '/reset_password',
        title='Reset User Password',
        description='Resets the user\'s password and sends them a password reset email.',
        rel='resetPassword',
        schema=None,
        response_schema=None,
    )
    def reset_password(self, user):
        with AuthorizedOperation('reset_password', 'user', user.id):
            # TODO(vedant) - Change the return value of `reset_password` to convey a value
            # with more resolution than True/False
            username = user.username

            # TODO(vedant) - This is for legacy users who signed up with usernames that do
            # not represent an e-mail address
            if not EMAIL_REGEX.match(username):
                message = (
                    'User {username} does not have a valid e-mail address.'.format(
                        username=username
                    )
                )
                return StandardResponse(message, BAD_REQUEST, False), BAD_REQUEST

            send_reset_password(username)

            message = (
                'User password has been reset and instructions '
                'e-mailed to {username}.'.format(username=username)
            )
            g.request_logger.info(message)
            return None, NO_CONTENT

    @ItemRoute.DELETE(
        '/force',
        rel='forceDestroy',
        title='Force Delete User',
        description='Force delete a User and ALL their created artifacts (Dashboards, etc.)',
    )
    def force_delete(self, user):
        with AuthorizedOperation('delete_user', 'site'):
            before_delete.send(user)
            force_delete_user(user)
            after_delete.send(user)
            return None, NO_CONTENT

    @Route.POST(
        '/invite',
        title='Invite New User',
        description='',
        rel='inviteUser',
        schema=fields.List(INVITE_OBJECT_SCHEMA),
        response_schema=fields.List(
            fields.Inline('self'), description='A listing of all the invited users'
        ),
    )
    def invite_user(self, invitees):
        with AuthorizedOperation('invite_user', 'site'):
            invited_users = [invitee.email for invitee in invitees]
            try:
                pending_users = invite_users(invitees)
                emails = [user.username for user in pending_users]
                g.request_logger.info(
                    'Successfully invited the following users: \'%s\'.', emails
                )
                return pending_users
            except UserAlreadyInvited as e:
                g.request_logger.error(
                    'Attempt to invite the following users has failed: \'%s\'. '
                    'The following users already have platform accounts: \'%s\'',
                    invited_users,
                    e.already_registered_users,
                )
                raise

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    # pylint: disable=E1101
    @ItemRoute.POST(
        '/roles',
        title='Add User Role',
        description='Adds a single role to a user.',
        schema=USER_ROLES_SCHEMA,
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='addRole',
    )
    def add_role_by_name(self, user, request):
        with AuthorizedOperation('edit_resource', 'user', user.id):
            # TODO(vedant) Refactor this into a separate module like
            # we do for the Groups API
            role_name = request['roleName']
            resource_type = request['resourceType']
            resource_name = request.get('resourceName')

            result = add_user_role_api(
                user, role_name, resource_type, resource_name, commit=True
            )
            success = False
            if isinstance(result, Success):
                success = True

            response_code = OK if success else BAD_REQUEST
            return (
                StandardResponse(result['data']['message'], response_code, success),
                response_code,
            )

    # Flask-Potion requires that these be methods and NOT functions
    # pylint: disable=R0201
    @ItemRoute.DELETE(
        '/roles',
        title='Delete User Role',
        description='Deletes a single role from a user.',
        schema=USER_ROLES_SCHEMA,
        response_schema=STANDARD_RESPONSE_SCHEMA,
        rel='deleteRole',
    )
    def delete_role_by_name(self, user, request):
        with AuthorizedOperation('edit_resource', 'user', user.id):
            # TODO(vedant) Refactor this into a separate module like
            # we do for the Groups API
            role_name = request['roleName']
            resource_type = request['resourceType']
            resource_name = request.get('resourceName')

            result = delete_user_role_api(
                user, role_name, resource_type, resource_name, commit=True
            )

            return StandardResponse(result['data']['message'], OK, True)

    @ItemRoute.PATCH(
        '/roles',
        title='Update User Roles',
        description='Updates all the roles for a user with the values specified.',
        schema=ROLE_MAP_SCHEMA,
        response_schema=fields.Inline('self'),
        rel='updateRoles',
    )
    def update_roles(self, user, request):
        with AuthorizedOperation('edit_resource', 'user', user.id):
            roles = update_user_roles_from_map(user, request)
            message = (
                'Successfully updated the roles attached to user \'%s\'. '
                'New roles are now: \'%s\''
                % (user.username, [user_role_as_dictionary(role) for role in roles])
            )
            g.request_logger.info(message)
            return self.manager.read(user.id)

    @ItemRoute.GET(
        '/can_export_data',
        description='Returns if a user can export data',
        rel='canExport',
        response_schema=fields.Boolean(),
    )
    def can_export_data(self, user):
        '''Returns if a user can export data by checking all roles through
        direct or group assignment for this user.
        '''
        if SuperUserPermission().can():
            return True
        all_roles = list(user.roles)
        for group in user.groups:
            all_roles += group.roles

        for role in all_roles:
            if role.enable_data_export:
                return True
        return False

    @ItemRoute.GET(
        '/ownership',
        rel='ownership',
        description='Gets ACLs that a particular user owns',
        response_schema=fields.Array(RESOURCE_SUMMARY),
    )
    def get_ownership(self, user):
        with AuthorizedOperation('view_user', 'site'):
            if user.is_superuser() and not current_user.is_superuser():
                return None, UNAUTHORIZED
            return get_user_owned_resources(user)

    @ItemRoute.GET(
        '/is_user_in_group',
        rel='is_user_in_group',
        description='Gets groups user is in',
        schema=FieldSet({'group_name': fields.String()}),
        response_schema=fields.Boolean(),
    )
    def get_is_user_in_group(self, user, group_name):
        group_names = [group.name for group in user.groups]
        return group_name in group_names


@before_delete.connect_via(UserResource)
def before_delete_user(sender, item):
    if current_user.is_authenticated and item.id == current_user.id:
        g.request_logger.warning(
            'User \'%s\' attempted to delete their own user account.',
            get_user_string(item),
        )
        raise BadRequest('You are unable to delete your own user account.')


# pylint: disable=W0613
@after_user_role_change.connect
def invalidate_user_identity_cache(sender, role):
    '''This will invalidate the user identity role after any
    user role change (deletion, addition)
    '''
    cache = current_app.cache
    if cache.has(sender.username):
        cache.delete(sender.username)
        g.request_logger.info('Invalidated identity cache for user %s', sender.username)


RESOURCE_TYPES = [UserAclResource, UserResource]
