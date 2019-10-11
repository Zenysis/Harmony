from builtins import str
from logging import LoggerAdapter
from uuid import uuid4

import global_config
from flask import g, request, request_started
from flask.sessions import SecureCookieSessionInterface
from flask_login import user_loaded_from_header
from flask_user import user_logged_in, user_logged_out, current_user, user_registered
from flask_potion.signals import before_create, before_update, before_delete
from flask_principal import (
    Identity,
    AnonymousIdentity,
    UserNeed,
    RoleNeed,
    ItemNeed,
    identity_changed,
    identity_loaded,
)
from werkzeug.exceptions import BadRequest

from log import LOG
from models.alchemy.permission import ResourceTypeEnum
from models.alchemy.query_policy import QueryPolicy
from models.alchemy.user import User
from web.server.configuration.settings import get_configuration, PUBLIC_ACCESS_KEY
from web.server.data.data_access import Transaction
from web.server.routes.views.authentication import try_authenticate_user
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.default_users import list_default_roles
from web.server.routes.views.query_policy import construct_query_need_from_policy
from web.server.security.access_keys import KeyManager
from web.server.util.util import get_user_string, get_remote_ip_address


class CookielessSessionInterface(SecureCookieSessionInterface):
    '''Prevent the setting of a session-cookie for API requests.
    '''

    def save_session(self, *args, **kwargs):
        if g.get('login_via_header'):
            return
        return super(CookielessSessionInterface, self).save_session(*args, **kwargs)


def register_for_signals(app, principals):
    install_user_events_handlers(app)
    install_identity_loader(principals)
    install_login_manager_signal_handlers(app, app.user_manager.login_manager)
    request_started.connect(initialize_request_logger, app)


# This is the signature of the signal handler.
# pylint:disable=W0613


def initialize_request_logger(app, **kwargs):
    '''Creates an augmented logger that lasts for the lifetime of a flask request. Enables
    additional data to be logged during the request context including username, user id,
    the user's ip address and a unique request-specific ID that can be used to debug all the
    messages associated with a specific request by a user.
    '''

    # Generate a unique Request ID
    request_id = uuid4()
    username = ''
    user_id = -1
    ip_address = get_remote_ip_address()

    if current_user.is_authenticated:
        username = current_user.username
        user_id = current_user.id

    log_fields = {
        'username': username,
        'ip_address': ip_address,
        'request_id': str(request_id),
        'user_id': user_id,
    }

    request_logger = LoggerAdapter(LOG, log_fields)
    g.request_logger = request_logger
    g.request_id = request_id


def on_identity_loaded(sender, identity):
    '''A signal handler that updates the current user's identity with claims
    from the database.
    '''

    # If the user is authenticated and registered in the system,
    # install the default user permissions.
    if not isinstance(identity, AnonymousIdentity):
        # Set the identity user object
        identity.user = current_user
        install_default_user_permissions(identity)

    # sender is a flask app that has cache service
    cache = sender.cache

    cached_permissions = (
        cache.get(current_user.username)
        if not isinstance(identity, AnonymousIdentity)
        else None
    )

    if cached_permissions:
        identity.provides = cached_permissions
    else:
        # Add specific permission claims to the identity object
        # (e.g.) 'edit_resource' on the 'jsc' dashboard
        for permission in enumerate_permissions(current_user):
            identity.provides.add(permission)

        # cache the user permissions added to the identity provider
        if not isinstance(identity, AnonymousIdentity):
            cache.set(
                current_user.username,
                identity.provides,
                timeout=sender.config['CACHE_TIMEOUT_SECONDS'],
            )

    g.request_logger.debug(
        'Identity for User \'%s\' was loaded. ' 'Permissions are: \'%s\'',
        get_user_string(current_user),
        identity.provides,
    )


def install_default_user_permissions(identity):
    '''
    Add permisisons that the current user should be able to perform
    regardless of whatever other roles they possess.
    '''
    identity.provides.add(UserNeed(identity.user.id))

    # TODO(vedant) - This should not be hardcoded.
    # Always allow the user to view their profile
    identity.provides.add(ItemNeed('view_resource', identity.user.id, 'user'))

    # HACK(vedant) - Fixed as part of a short term solution for T2113
    # The long term solution is to define default permissions or a default user group that all new
    # users should be added to.
    identity.provides.add(ItemNeed('create_resource', None, 'dashboard'))

    # Continuation of Work for T2148 but now allowing RO-access to all Potion APIs
    identity.provides.add(ItemNeed('view_resource', None, 'user'))
    identity.provides.add(ItemNeed('view_resource', None, 'group'))
    identity.provides.add(ItemNeed('view_resource', None, 'role'))
    identity.provides.add(ItemNeed('view_resource', None, 'resource'))
    identity.provides.add(ItemNeed('view_resource', None, 'configuration'))


def enumerate_permissions(user):
    '''For a given user, generates an enumeration of all the permissions that they have.
    '''

    user_authenticated = user.is_authenticated
    public_access_enabled = get_configuration(PUBLIC_ACCESS_KEY)

    # We should only assign permissions to an anonymous user if public access is enabled
    if not user_authenticated and not public_access_enabled:
        return

    # TODO(vedant) - These will need to be cached at some point. They are constructed for each
    # request and with a large user-base and a large number of individual groups, re-building this
    # each time will introduce significant performance issues. For starters, we can employ a
    # really dumb cache and just store these in a dictionary in-memory in the current application
    # context.

    # List any `public` permissions regardless of whether the current user is
    # authenticated or not.
    default_roles = list_default_roles()
    for default_role in default_roles:
        apply_to_unregistered = default_role.apply_to_unregistered

        # This particular role ONLY applies to registered users. If the user is
        # unauthenticated, then we will not grant them the role.
        if not user_authenticated and not apply_to_unregistered:
            continue

        yield RoleNeed(default_role.role.name)
        for permission in default_role.role.permissions:
            resource = default_role.resource
            yield permission.build_permission(resource)

            resource_specific_needs = _build_resource_specific_needs(
                default_role.role.resource_type, permission, resource
            )
            for need in resource_specific_needs:
                yield need

    # If the user is unauthenticated, then do not attempt to look up any additional permissions
    # as they do not have any in the system.
    if not user_authenticated:
        return

    # Look through all roles that the user directly possesses
    for user_role in user.roles:
        # Add any user role claims to the identity object
        # (e.g.) The superuser role
        yield RoleNeed(user_role.role.name)
        permissions = user_role.role.permissions
        for permission in permissions:
            resource = user_role.resource
            yield permission.build_permission(resource)

            resource_specific_needs = _build_resource_specific_needs(
                user_role.role.resource_type, permission, resource
            )
            for need in resource_specific_needs:
                yield need

    # Look through all roles that are possessed by the groups that the user is a member of
    for group in user.groups:
        for group_role in group.roles:
            yield RoleNeed(group_role.role.name)
            permissions = group_role.role.permissions
            for permission in permissions:
                resource = group_role.resource
                yield permission.build_permission(resource)

                resource_specific_needs = _build_resource_specific_needs(
                    group_role.role.resource_type, permission, resource
                )
                for need in resource_specific_needs:
                    yield need


def _build_resource_specific_needs(resource_type, permission, resource):
    '''Yields any authorization needs that are specifically related to an individual authorization
    resource or authorization resource type.
    '''
    # $CycloneIdaiHack(vedant)
    if resource_type.name == ResourceTypeEnum.ALERT:
        resource_id = resource.id if resource else None
        yield ItemNeed(permission.permission, resource_id, 'alert_definitions')

    if not resource:
        return

    if resource.resource_type.name == ResourceTypeEnum.QUERY_POLICY:
        with Transaction() as transaction:
            query_policy_entity = transaction.find_by_id(
                QueryPolicy, resource.id, 'resource_id'
            )
            query_need = construct_query_need_from_policy(query_policy_entity)
            yield query_need


def install_identity_loader(principals):
    @principals.identity_loader
    def read_identity_from_flask_login():
        if current_user.is_authenticated:
            return Identity(current_user.id)
        return AnonymousIdentity()

    return read_identity_from_flask_login


def install_user_events_handlers(app):
    # These are the signal method signatures
    # pylint:disable=W0612

    @user_registered.connect_via(app)
    def on_user_registered(sender, user):
        g.request_logger.info(
            'Invited user \'%s\' has successfully registered for an account. ',
            get_user_string(user),
        )

    @identity_loaded.connect_via(app)
    def on_user_identity_loaded(sender, identity):
        on_identity_loaded(sender, identity)

    @user_logged_in.connect_via(app)
    def on_user_logged_in(sender, user):
        g.request_logger.info('User \'%s\' logged in', get_user_string(user))
        identity_changed.send(sender, identity=Identity(user.id))

    @user_logged_out.connect_via(app)
    def on_user_logged_out(sender, user):
        if user.is_authenticated:
            g.request_logger.info('User \'%s\' logged out', get_user_string(user))
        identity_changed.send(sender, identity=AnonymousIdentity())
        sender.cache.delete(user.username)


def install_login_manager_signal_handlers(app, login_manager):
    app.session_interface = CookielessSessionInterface()

    @login_manager.request_loader
    def login_from_request(request_object=None):
        request_object = request_object or request

        access_key = request.cookies.get('accessKey')
        if access_key:
            LOG.info('Received access key in cookie: %s' % access_key)
            if KeyManager.is_valid_key(access_key):
                LOG.info('Accessing %s with renderbot access key', request.path)
                bot = User.query.filter_by(
                    username=global_config.RENDERBOT_EMAIL
                ).first()
                return bot
            else:
                LOG.warn('Received invalid access key')

        try:
            username = request.headers.get('X-Username')
            password = request.headers.get('X-Password')

            if not (username and password):
                LOG.debug('Username or Password not provided via Login Headers. ')
                return None

            LOG.debug('Attempting to authenticate user: \'%s\'.', username)
            user = try_authenticate_user(username, password)

            if user:
                LOG.debug(
                    'User: \'%s\' authenticated successfully.', get_user_string(user)
                )
                return user
            else:
                LOG.warn('User: \'%s\' failed to authenticate.', username)
                return None
        except BadRequest:
            return None
        return None

    # This function is a signal handler. It is not called in this method
    # but this is where we are registering it.
    # pylint:disable=W0612
    @user_loaded_from_header.connect
    def on_user_loaded_from_header(self, user=None):
        g.login_via_header = True


def install_potion_signal_handlers(potion_resource_class):
    '''
    Installs Signal Handlers on Potion's CRUD routes for a given resource class
    to ensure that the user performing the change has the authorization to do so.
    '''

    resource_type = potion_resource_class.meta.name

    # This function is a signal handler. It is not called in this method
    # but this is where we are registering it.
    # pylint:disable=W0612

    # Pylint fails to pick up the connect_via method in the Signals class.
    # pylint:disable=E1101
    @before_create.connect_via(potion_resource_class)
    def before_create_resource(sender, item):
        id_attribute = potion_resource_class.meta.id_attribute
        if resource_type == 'configuration':
            id_attribute = 'id'

        verify_authorization('create_resource', resource_type, item, id_attribute)

    @before_update.connect_via(potion_resource_class)
    def before_update_resource(sender, item, changes):
        id_attribute = potion_resource_class.meta.id_attribute
        if resource_type == 'configuration':
            id_attribute = 'id'

        verify_authorization('edit_resource', resource_type, item, id_attribute)

    @before_delete.connect_via(potion_resource_class)
    def before_delete_resource(sender, item):
        id_attribute = potion_resource_class.meta.id_attribute
        if resource_type == 'configuration':
            id_attribute = 'id'

        verify_authorization('delete_resource', resource_type, item, id_attribute)


def verify_authorization(permission, resource_type, item, id_attribute):
    with AuthorizedOperation(
        permission, resource_type, getattr(item, id_attribute) if item else None
    ):
        return
