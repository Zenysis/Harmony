from functools import wraps
from flask import current_app, request
from flask_login import current_user
from werkzeug.exceptions import Unauthorized

from log import LOG
from web.server.util.util import get_user_string
from web.server.configuration.settings import get_configuration, PUBLIC_ACCESS_KEY


def authentication_required(is_api_request=False, force_authentication=False):
    '''
    A decorator that enforces that the currently loaded be authenticated prior
    to calling the underlying method. If the public access has been enabled as
    defined by getting the value of `PUBLIC_ACCESS_KEY` from the Configuration Store,
    the decorator will no longer enforce the authentication requirement.

    Parameters
    ----------
    is_api_request (optional): boolean
        Indicates whether or not this decorator is being used for an API route or a UI route.
        If set to `True`, an exception is thrown instead of invoking the
        `unauthenticated_view_function`.

    force_authentication (optional): boolean
        Indicates whether or not this decorator will respect the value for the public access
        setting or not. If set to `True`, the decorator will not allow the underlying operation
        to be run unless the user has logged in as a registered user.

    Returns
    -------
    func
        A function that directs the user to the unauthenticated view function
        if the user is unauthenticated or returns the value from the underlying
        function call if the user is unauthorized and `is_api_request` is set to `False`.

    Raises
    -------
    werkzeug.exceptions.Forbidden
        In the event that the user is not authorized to perform the operation and `is_api_request`
        is set to `True`.
    '''

    def auth_decorator(protected_operation):
        @wraps(protected_operation)
        def auth_decorator_inner(*args, **kwargs):
            user_is_authenticated = current_user.is_authenticated
            public_access_enabled = get_configuration(PUBLIC_ACCESS_KEY)
            user_string = get_user_string(current_user)

            # User must be authenticated
            if not user_is_authenticated:
                # Redirect to unauthenticated page
                if force_authentication or not public_access_enabled:
                    LOG.info(
                        'Unauthenticated user \'%s\' attempted to access %s but was denied.',
                        user_string,
                        request.full_path,
                    )

                    if is_api_request:
                        # Contrary to the name, this is actually the appropriate HTTP
                        # Error Code to raise when the user is unauthenticated.
                        raise Unauthorized()
                    else:
                        return current_app.user_manager.unauthenticated_view_function()

            if user_is_authenticated:
                LOG.debug('User \'%s\' accessed %s.', user_string, request.full_path)
            else:
                LOG.debug(
                    'Unauthenticated user \'%s\' will be allowed to access '
                    'resource \'%s\' because public access is enabled. ',
                    user_string,
                    request.full_path,
                )

            # Call the actual view
            return protected_operation(*args, **kwargs)

        return auth_decorator_inner

    return auth_decorator


def try_authenticate_user(username, password):
    '''
    Given a username and password, attempts to authenticate the user.

    Parameters
    ----------
    username : string
        The username of the user to login

    password : string
        The user's password

    Returns
    -------
    `models.user_models.User`
        The object representation of the user if the authentication was succesful and None
        otherwise.
    '''

    user_manager = current_app.user_manager
    user = None
    user = user_manager.find_user_by_username(username)

    # Handle successful authentication
    if (
        user
        and user_manager.get_password(user)
        and user_manager.verify_password(password, user)
    ):
        return user

    # Unsuccessful authentication
    return None
