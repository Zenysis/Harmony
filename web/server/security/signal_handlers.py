from builtins import str
from logging import LoggerAdapter
from uuid import uuid4

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
from models.alchemy.dashboard import Dashboard
from models.alchemy.permission import ResourceTypeEnum, SitewideResourceAcl
from models.alchemy.user import User
from web.server.data.data_access import Transaction
from web.server.errors.errors import JWTTokenError
from web.server.routes.views.authentication import try_authenticate_user
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.query_policy import construct_query_need_from_policy
from web.server.security.permissions import (
    SuperUserPermission,
    is_public_dashboard_user,
)
from web.server.util.util import get_user_string, get_remote_ip_address


class CookielessSessionInterface(SecureCookieSessionInterface):
    '''Prevent the setting of a session-cookie for API requests.'''

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
        with Transaction() as transaction:
            # Add specific permission claims to the identity object
            # (e.g.) 'edit_resource' on the 'jsc' dashboard
            for permission in enumerate_permissions(current_user, transaction):
                identity.provides.add(permission)

            # cache the user permissions added to the identity provider
            if not isinstance(identity, AnonymousIdentity):
                cache.set(
                    current_user.username,
                    identity.provides,
                    timeout=sender.config['CACHE_TIMEOUT_SECONDS'],
                )

    g.request_logger.debug(
        'Identity for User \'%s\' was loaded.',
        get_user_string(current_user),
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

    # Continuation of Work for T2148 but now allowing RO-access to all Potion APIs
    identity.provides.add(ItemNeed('view_resource', None, 'user'))
    identity.provides.add(ItemNeed('view_resource', None, 'group'))
    identity.provides.add(ItemNeed('view_resource', None, 'role'))
    identity.provides.add(ItemNeed('view_resource', None, 'resource'))
    identity.provides.add(ItemNeed('view_resource', None, 'configuration'))

    # For case management
    identity.provides.add(ItemNeed('view_resource', None, 'case_event'))
    identity.provides.add(ItemNeed('view_resource', None, 'case_status_type'))
    identity.provides.add(ItemNeed('view_resource', None, 'external_alert_type'))
    identity.provides.add(ItemNeed('view_resource', None, 'case_type'))
    identity.provides.add(ItemNeed('view_resource', None, 'case'))


def enumerate_permissions(user, transaction):
    '''For a given user, generates an enumeration of all the permissions that they have.'''
    # Public access case
    if is_public_dashboard_user():
        for need in _build_sitewide_needs(transaction, False):
            yield need
        return

    # If the user is unauthenticated, then do not attempt to look up any additional permissions
    # as they do not have any in the system.
    if not user.is_authenticated:
        return

    # TODO(vedant) - These will need to be cached at some point. They are constructed for each
    # request and with a large user-base and a large number of individual groups, re-building this
    # each time will introduce significant performance issues. For starters, we can employ a
    # really dumb cache and just store these in a dictionary in-memory in the current application
    # context.

    # Build out sitewide ACLs
    for need in _build_sitewide_needs(transaction, True):
        yield need

    # Look through all roles that the user directly possesses
    for need in _build_role_needs(user.roles):
        yield need

    # Go through User ACLs
    for user_acl in user.acls:
        for need in _build_acl_needs(
            user_acl.resource_role.permissions, user_acl.resource
        ):
            yield need

    # Look through all roles that are possessed by the groups that the user is a member of
    for group in user.groups:
        for need in _build_role_needs(group.roles):
            yield need

        # Go through Group ACLs
        for group_acl in group.acls:
            for need in _build_acl_needs(
                group_acl.resource_role.permissions, group_acl.resource
            ):
                yield need


def _build_sitewide_needs(transaction, is_registered):
    '''Builds Needs from SitewideResourceAcl, depending if the user is registered or
    not. Yields one Need per permission defined in the ResourceRole.
    '''
    all_sitewide_acls = transaction.find_all_by_fields(SitewideResourceAcl, {}) or []
    for sitewide_acl in all_sitewide_acls:
        resource_role = (
            sitewide_acl.registered_resource_role
            if is_registered
            else sitewide_acl.unregistered_resource_role
        )
        if not resource_role:
            continue
        for need in _build_acl_needs(resource_role.permissions, sitewide_acl.resource):
            yield need


def _build_acl_needs(permissions, resource):
    '''Builds Needs for a particular resource and a list of permissions.'''
    for permission in permissions:
        resource_type = resource.resource_type
        yield ItemNeed(
            permission.permission, resource.id, resource_type.name.name.lower()
        )
        resource_specific_needs = _maybe_build_alert_needs(
            resource_type, permission, resource
        )

        for need in resource_specific_needs:
            yield need


def _build_role_needs(roles):
    '''Builds Needs for a `Role` object.'''
    for role in roles:
        # Special case specifically for site admin role
        if role.name == 'admin':
            yield RoleNeed(role.name)
            continue

        # Add any query policies associated with the role.
        for query_policy in role.query_policies:
            yield construct_query_need_from_policy(query_policy)

        permissions = role.permissions
        for permission in permissions:
            resource_type = permission.resource_type.name.name.lower()
            yield ItemNeed(permission.permission, None, resource_type)

            # We need to translate 'alert' to 'alert_definitions'
            if resource_type == 'alert':
                yield ItemNeed(permission.permission, None, 'alert_definitions')

        dashboard_resource_role = role.dashboard_resource_role
        if dashboard_resource_role:
            dashboard_resource_type = ResourceTypeEnum.DASHBOARD.name.lower()
            for permission in dashboard_resource_role.permissions:
                yield ItemNeed(permission.permission, None, dashboard_resource_type)

        alert_resource_role = role.alert_resource_role
        if alert_resource_role:
            alert_resource_type = ResourceTypeEnum.ALERT.name.lower()
            for permission in alert_resource_role.permissions:
                yield ItemNeed(permission.permission, None, 'alert_definitions')


def _maybe_build_alert_needs(resource_type, permission, resource):
    if resource_type.name == ResourceTypeEnum.ALERT:
        resource_id = resource.id if resource else None
        yield ItemNeed(permission.permission, resource_id, 'alert_definitions')


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

        token = request.cookies.get('accessKey')
        if token:
            LOG.info('Received access token in cookie: %s', token)
            try:
                payload = app.jwt_manager.decode_token(token)
                auth_email = payload['email']
                LOG.info('Accessing %s with %s access token', request.path, auth_email)
                # pylint:disable=no-member
                with Transaction() as transaction:
                    authenticating_user = transaction.find_one_by_fields(
                        User, False, {'username': auth_email}
                    )
                    return authenticating_user
            except JWTTokenError as error:
                LOG.error('%s: %s', error.message, error.status_code)
                return None

        try:
            username = request.headers.get('X-Username')
            password = request.headers.get('X-Password')

            if not (username and password):
                # User and password are not provided via login headers
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
