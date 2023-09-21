# This file contains all flask_user default views that we override
# pylint: disable=C0103,W0212
from urllib.parse import quote

from flask import current_app, flash, redirect, request, url_for, make_response
from flask_login import logout_user
from flask_user.views import _endpoint_url
from flask_user.translations import gettext

from web.server.configuration.settings import (
    get_configuration,
    DEFAULT_URL_KEY,
)


def unauthenticated():
    """Prepare a Flash message and redirect to USER_UNAUTHENTICATED_ENDPOINT"""
    user_manager = current_app.user_manager

    # Prepare Flash message
    # Do not flash an error message for default pages as users already know they need
    # to log in.
    url = request.url
    if not (request.path == '/' or request.path == get_configuration(DEFAULT_URL_KEY)):
        flash(gettext("You must be signed in to access '%(url)s'.", url=url), 'error')

    # Redirect to USER_UNAUTHENTICATED_ENDPOINT
    safe_next = user_manager.make_safe_url_function(url)
    return redirect(
        _endpoint_url(user_manager.unauthenticated_endpoint)
        + '?next='
        + quote(safe_next)
    )


def logout():
    """Sign the user out."""
    response = make_response(redirect(url_for('user.login')))

    # remove the cookie
    response.delete_cookie('accessKey')

    # NOTE: The following line should be removed when all old sessions (using JWTs) are gone.
    # This is expected to be safe to remove after August 1, 2023, given all sessions by then
    # will be using the new session cookie after this lands on prod by June 1, 2023.
    logout_user()

    return response
