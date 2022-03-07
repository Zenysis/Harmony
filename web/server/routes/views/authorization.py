from functools import wraps
from typing import Optional

from flask import current_app, g, request
from flask_user import current_user
from flask_principal import ItemNeed
from werkzeug.exceptions import Unauthorized

from web.server.routes.views.resource import get_resource_by_type_and_name
from web.server.security.permissions import (
    SuperUserPermission,
    QueryPermission,
    WhitelistedPermission,
)
from web.server.util.util import (
    Success,
    unauthorized_error,
    get_user_string,
    get_resource_string,
)


class AuthorizedQuery:
    '''A class that makes it possible to encapsulate a query operation inside an
    authorization check that ensures that the user is authorized to perform
    the operation before executing the code inside the block.
    '''

    def __init__(self, log_request=True, *query_needs):
        '''Class constructor for AuthorizedOperation.

        Parameters
        ----------
        log_request (optional): string
            Whether or not to log the authorization check. This should generally be true unless
            the user is simply querying whether or not they have the permission to do so.

        query_needs: iter
            An enumeration of `QueryNeed` instances any of which the user must possess in order
            to run the protected query.

        Raises
        -------
        werkzeug.exceptions.Forbidden
            In the event that the user is not authorized to perform the operation.
        '''
        self.query_needs = query_needs
        self.log_request = log_request

    def __enter__(self):
        required_permission = QueryPermission(self.query_needs)

        if not required_permission.can():
            if self.log_request:
                g.request_logger.info(
                    'User \'%s\' attempted to execute query defined by: \'%s\' but was '
                    'unauthorized.',
                    get_user_string(current_user),
                    self.query_needs,
                )

            message = (
                'You do not have the permission to run this query. '
                'One of the following needs is required: {needs}.'
            ).format(needs=self.query_needs)
            raise Unauthorized(description=message)
        else:
            g.request_logger.debug(
                'User \'%s\' authorized to run query defined by: \'%s\'.',
                get_user_string(current_user),
                self.query_needs,
            )

    def __exit__(self, exception_type, exception_value, traceback):
        return


class AuthorizedOperation:
    '''A class that makes it possible to encapsulate an operation inside an
    authorization check that ensures that the user is authorized to perform
    the operation before executing the code inside the block.
    '''

    def __init__(self, permission, resource_type, resource_id=None, log_request=True):
        '''Class constructor for AuthorizedOperation.

        Parameters
        ----------
        permission : string
            The desired object permission that the user must possess (e.g. 'edit_resource')

        resource_type : string
            The type of resource that the operation is being performed on (e.g. 'dashboard')

        resource_id (optional): int
            The id of the resource in question (based on the `id` attribute of the `Resource`
            model). Do not specify if you are attempting to determine whether the user has a
            sitewide permission for a given resource type.

        log_request (optional): string
            Whether or not to log the authorization check. This should generally be true unless
            the user is simply querying whether or not they have the permission to do so.

        Raises
        -------
        werkzeug.exceptions.Forbidden
            In the event that the user is not authorized to perform the operation.
        '''
        self.permission = permission
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.log_request = log_request

    def __enter__(self):
        if not is_authorized(
            self.permission, self.resource_type, self.resource_id, self.log_request
        ):
            resource_string = get_resource_string(self.resource_id, self.resource_type)
            message = ('You do not have the \'%s\' permission on %s. ') % (
                self.permission,
                resource_string,
            )
            raise Unauthorized(description=message)

    def __exit__(self, exception_type, exception_value, traceback):
        return


def current_user_can_edit_user(user):
    '''
    Determines whether or not the currently loaded user can edit the specified user

    Parameters
    ----------
    user : `models.user_models.User
        The user object that the current user wants to modify

    Returns
    -------
    bool
        True if the user is authorized and False otherwise
    '''

    # If we create an administrator type who can perform most administrative tasks,
    # ensure that they cannot edit superusers unless they are also superusers.
    if user.is_superuser() and not current_user_is_superuser():
        g.request_logger.warning(
            'User \'%s\' attempted to edit '
            'Superuser \'%s\' but was not a superuser.',
            get_user_string(current_user),
            get_user_string(user),
        )
        return False
    return True


def current_user_is_superuser():
    '''
    Determines whether or not the currently loaded user is a superuser or not.

    Returns
    -------
    bool
        True if the user is a superuser and False otherwise
    '''

    return SuperUserPermission().can()


def is_authorized(permission, resource_type, resource_id=None, log_request=True):
    '''
    Determines whether or not the currently loaded user can perform the specified operation
    on the specified resource.

    Parameters
    ----------
    permission : string
        The desired object permission that the user must possess (e.g. 'edit_resource')

    resource_type : string
        The type of resource that the operation is being performed on (e.g. 'dashboard')

        resource_id (optional): int
            The id of the resource in question (based on the `id` attribute of the `Resource`
            model). Do not specify if you are attempting to determine whether the user has a
            sitewide permission for a given resource type.

    log_request (optional): string
        Whether or not to log the authorization check. This should generally be true unless
        the user is simply querying whether or not they have the permission to do so.

    Returns
    -------
    bool
        True if the user is authorized and False otherwise
    '''

    # WARNING: Please be careful what changes you make to this function. It is ultimately
    # the function that decides whether or not to authorize ANY action on the website.
    permission = str(permission).lower()
    resource_type = str(resource_type).lower()
    resource_name = int(resource_id) if resource_id else None
    resource_specific_need = [ItemNeed(permission, resource_name, resource_type)]
    required_permission = WhitelistedPermission(resource_specific_need)

    if required_permission.can():
        if log_request:
            g.request_logger.debug(
                'User \'%s\' successfully authorized to perform '
                '\'%s\' on resource \'%s\' of type \'%s\'.',
                get_user_string(current_user),
                permission,
                resource_id,
                resource_type,
            )
        return True

    if log_request:
        g.request_logger.info(
            'User \'%s\' attempted to perform '
            '\'%s\' on resource \'%s\' of type \'%s\' but was unauthorized.',
            get_user_string(current_user),
            permission,
            resource_id,
            resource_type,
        )
    return False


def is_authorized_api(
    permission: str,
    resource_type: str,
    resource_name: Optional[str] = None,
    log_request: bool = False,
) -> bool:
    '''
    Determines whether or not the currently loaded user can perform the specified
    operation on the specified resource (if specified). Data is taken from request_object

    Parameters
    ----------
    request_object (optional): flask.ctx.RequestContext
        The request context object.

    log_request (optional): string
        Whether or not to log the authorization check. This should generally be true unless
        the user is simply querying whether or not they have the permission to do so.

    Returns
    -------
    bool
        True if the user is authorized and False otherwise
    '''

    # We don't want to log requests to the Web API for
    # for authorization since these requests are not malicious
    resource_id = None

    if resource_name:
        resource = get_resource_by_type_and_name(resource_type, resource_name)
        resource_id = resource.id

    return is_authorized(permission, resource_type, resource_id, log_request)


def authorization_required(
    permission, resource_type, resource_id=None, log_request=True, is_api_request=False
):
    '''
    A decorator that enforces that the currently loaded be authorized to perform an operation prior
    to calling the underlying method.

    Parameters
    ----------
    permission : string
        The desired object permission that the user must possess (e.g. 'edit_resource')

    resource_type : string
        The type of resource that the operation is being performed on (e.g. 'dashboard')

    resource_id (optional): int
        The id of the resource in question (based on the `id` attribute of the `Resource`
        model). Do not specify if you are attempting to determine whether the user has a
        sitewide permission for a given resource type.

    is_api_request (optional): boolean
        Indicates whether or not this decorator is being used for an API route or a UI route.
        If this is set to false, then the unauthorized view of the current application
        context's user manager is invoked as opposed to an exception being thrown.

    Returns
    -------
    object
        The result of `current_app.user_manager.unauthorized_view_function()` if the user is
        unauthorized and `is_api_request` is `False`. If the user is authorized, the value from
        the underlying function call is returned.

    Raises
    -------
    werkzeug.exceptions.Forbidden
        In the event that the user is not authorized to perform the operation and `is_api_request`
        is set to `True`.
    '''

    def auth_decorator(protected_operation):
        @wraps(protected_operation)
        def auth_decorator_inner(*args, **kwargs):
            user_string = get_user_string(current_user)
            resource_string = get_resource_string(resource_id, resource_type)

            if is_authorized(permission, resource_type, resource_id, False):
                if log_request:
                    g.request_logger.debug(
                        'User \'%s\' successfully authorized to perform \'%s\' on %s.',
                        user_string,
                        permission,
                        resource_string,
                    )
                return protected_operation(*args, **kwargs)

            if log_request:
                g.request_logger.info(
                    'User \'%s\' attempted to perform \'%s\' on %s but was unauthorized.',
                    user_string,
                    permission,
                    resource_string,
                )

            if is_api_request:
                message = ('You do not have the \'%s\' permission on %s. ') % (
                    permission,
                    resource_string,
                )
                raise Unauthorized(description=message)
            else:
                return current_app.user_manager.unauthorized_view_function()

        return auth_decorator_inner

    return auth_decorator
