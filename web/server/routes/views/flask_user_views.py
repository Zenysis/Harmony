# This file contains all flask_user default views that we override
# pylint: disable=C0103,W0212
from urllib.parse import quote

from flask import current_app, flash, redirect, request, url_for
from flask_login import current_user
from flask_user.views import _endpoint_url, _do_login_user
from flask_user.signals import user_registered
from flask_user.translations import gettext
from werkzeug.exceptions import BadGateway

from models.alchemy.user import User, UserStatusEnum
from web.server.configuration.settings import (
    get_configuration,
    AUTOMATIC_SIGN_OUT_KEY,
    DEFAULT_URL_KEY,
)
from web.server.data.data_access import Transaction
from web.server.routes.views.admin import send_reset_password
from web.server.errors import ItemNotFound

RESET_PASSWORD_SUCCESS_TEMPLATE = (
    "A reset password email has been sent to %s."
    + " Open that email and follow the instructions to reset your password."
)


def forgot_password():
    '''
    Display forgot_password form and initiate a password reset.
    This overrides flask_user's default register() view. This is only accessible
    when a user goes through the register URL. When an admin manually initiates
    a reset-password request for a user, that goes through our api.py (and hits
    send_reset_password directly) instead of going through flask_user's view
    '''
    user_manager = current_app.user_manager

    # Initialize form
    form = user_manager.forgot_password_form(request.form)

    # Process valid POST (when 'Send reset password email' is actually clicked)
    if request.method == 'POST' and form.validate():
        email = form.email.data

        reset_success = True
        try:
            send_reset_password(email)
        except ItemNotFound:
            reset_success = False
        except BadGateway:
            reset_success = False

        # Prepare one-time system message.
        if reset_success:
            flash(RESET_PASSWORD_SUCCESS_TEMPLATE % email, 'success')
        else:
            flash('Could not reset password with this email', 'error')

        # Redirect to the login page
        return redirect(_endpoint_url(user_manager.after_forgot_password_endpoint))

    template_renderer = current_app.template_renderer

    # Process GET or invalid POST (e.g. invalid email)
    template_params = {'form': form}
    return template_renderer.js_render_helper(
        user_manager.forgot_password_template,
        locale='en',
        js_params=_build_base_js_params(template_renderer),
        pass_to_template=template_params,
    )


def register():
    '''Display registration form and create new User'''
    with Transaction() as transaction:
        user_manager = current_app.user_manager

        # Initialize form
        register_form = user_manager.register_form(request.form)

        # invite token used to determine validity of registeree
        invite_token = request.values.get('token')

        # if there is no token, disallow the user from registering
        if not invite_token:
            flash('Registration is invite only', 'error')
            return redirect(url_for('user.login'))

        # if the token does not correspond to any user, do not allow registration
        pending_user = transaction.find_one_by_fields(
            User, True, {'reset_password_token': invite_token}
        )
        if pending_user:
            register_form.invite_token.data = invite_token
        else:
            flash('Invalid invitation link', 'error')
            return redirect(url_for('user.login'))

        next_endpoint = request.args.get(
            'next', _endpoint_url(user_manager.after_login_endpoint)
        )
        reg_next = request.args.get(
            'reg_next', _endpoint_url(user_manager.after_register_endpoint)
        )

        if request.method != 'POST':
            # GET request: register form is being loaded
            register_form.next.data = next_endpoint
            register_form.reg_next.data = reg_next
            # pre-fill username form data
            register_form.username.data = pending_user.username

        # Process valid POST (i.e. when they submit the Register form)
        if request.method == 'POST' and register_form.validate():
            # Enable user account
            pending_user.status_id = UserStatusEnum.ACTIVE.value

            # For all form fields
            for field_name, field_value in list(register_form.data.items()):
                if field_name == 'password':
                    # Hash password field
                    hashed_password = user_manager.hash_password(field_value)
                    pending_user.password = hashed_password
                elif field_name == 'username' and field_value != pending_user.username:
                    flash('Registered email does not match the invited email', 'error')
                    return redirect(url_for('user.register'))
                else:
                    setattr(pending_user, field_name, field_value)

            # Add User record using named arguments 'user_fields'
            transaction.add_or_update(pending_user)

            # Send user_registered signal
            user_registered.send(current_app._get_current_object(), user=pending_user)

            # Redirect to login page
            return redirect(url_for('user.login') + '?next=' + reg_next)

    template_renderer = current_app.template_renderer

    # Process GET or invalid POST
    template_params = {'form': register_form}
    return template_renderer.js_render_helper(
        user_manager.register_template,
        locale='en',
        js_params=_build_base_js_params(template_renderer),
        pass_to_template=template_params,
    )


def login():
    '''Prompt for username/email and password and sign the user in.'''
    user_manager = current_app.user_manager
    next_endpoint = request.args.get(
        'next', _endpoint_url(user_manager.after_login_endpoint)
    )
    # Check for session timeout param in query params
    session_timeout = True if request.args.get('timeout') else False

    # Immediately redirect already logged in users
    if current_user.is_authenticated:
        return redirect(next_endpoint)

    # Initialize form
    login_form = user_manager.login_form(request.form)

    if request.method != 'POST':
        # GET request: login form is being loaded
        login_form.next.data = next_endpoint
        if session_timeout:
            flash('Your session timed out. Log in to continue.')

    # Process valid POST (i.e. when they submit the Login form)
    if request.method == 'POST' and login_form.validate():
        # Find user record by username
        user = user_manager.find_user_by_username(login_form.username.data)
        if user:
            # Log user in
            return _do_login_user(
                user, login_form.next.data, login_form.remember_me.data
            )

    # Process GET or invalid POST
    login_form.remember_me.label.text = 'Keep me signed in'
    automatic_sign_out_enabled = get_configuration(AUTOMATIC_SIGN_OUT_KEY)
    if not automatic_sign_out_enabled:
        login_form.remember_me.data = True
    template_params = {
        'form': login_form,
        'login_form': login_form,
        'session_timeout': session_timeout,
    }
    template_renderer = current_app.template_renderer

    return template_renderer.js_render_helper(
        user_manager.login_template,
        locale='en',
        js_params=_build_base_js_params(template_renderer),
        pass_to_template=template_params,
    )


def _build_base_js_params(template_renderer):
    js_params = {
        'ui': template_renderer.build_ui_params(),
        'user': template_renderer.build_user_params(),
        'vendorScriptPath': current_app.config.get('VENDOR_SCRIPT_PATH'),
    }
    # flask-user pages shouldn't show data update time
    del js_params['ui']['lastDataUpdate']
    return js_params


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
