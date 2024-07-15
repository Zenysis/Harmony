import json
from http.client import OK, BAD_REQUEST
from datetime import timedelta
from http.client import OK

from flask import current_app, jsonify, make_response, request
from flask_potion import fields, Resource
from flask_potion.routes import Route
from flask_potion.schema import FieldSet
from flask_user.emails import send_password_changed_email
from flask_user.signals import user_registered, user_reset_password
from werkzeug.exceptions import BadRequest

from models.alchemy.user import User, UserStatusEnum
from web.server.api.authentication_api_schemas import (
    USER_FORGOT_PASSWORD_SCHEMA,
    USER_LOGIN_SCHEMA,
    USER_MANAGER_INFO_RESPONSE_SCHEMA,
    USER_REGISTER_SCHEMA,
    USER_RESET_PASSWORD_SCHEMA,
)
from web.server.data.data_access import Transaction
from web.server.errors import ItemNotFound
from web.server.routes.views.admin import send_reset_password
from web.server.routes.views.authentication import try_authenticate_user
from web.server.util.api_validation import GenericValidationError
from web.server.util.authentication import create_user_access_token, login_user


class AuthenticationResource(Resource):
    class Meta:
        name = 'authentication'

    @Route.POST(
        '/login',
        title='Login User',
        description='Logs in a user',
        schema=USER_LOGIN_SCHEMA,
        rel='login',
    )
    def login_user_route(self, **payload):
        # NOTE: `set_cookie` value will either be "true" or "false".
        # json.loads is used because `set_cookie` must be parsed as a boolean
        set_cookie = request.args.get('set_cookie', type=json.loads)

        email = payload['email']
        password = payload['password']
        remember_me = payload['remember_me']

        user_manager = current_app.user_manager
        user = user_manager.find_user_by_username(email)
        if not user:
            raise GenericValidationError(
                {
                    "__all__": "non_existent_user",
                }
            )

        user_authenticated = try_authenticate_user(email, password)

        if not user_authenticated:
            raise GenericValidationError(
                {
                    "__all__": "invalid_login_credentials",
                }
            )

        # We set a very long expiration time for now that guys without "Remember me" set
        # can have very long session and not being logged out. This is not the best way
        # but the whole refresh token magic is too complicated for now
        expires = timedelta(days=365)

        if set_cookie:
            return login_user("login_successful", email, remember_me, expires)

        access_token = create_user_access_token(email, expires)
        return jsonify(access_token=access_token)

    @Route.POST(
        '/register',
        title='Register User',
        description='Registers a user',
        schema=USER_REGISTER_SCHEMA,
        rel='register',
    )
    def register_user(self, **payload):
        user_manager = current_app.user_manager
        with Transaction() as transaction:
            email = payload['email']
            firstname = payload['firstname']
            lastname = payload['lastname']
            password = payload['password']
            invite_token = payload['invite_token']

            # if the token does not correspond to any user, do not allow registration
            pending_user = transaction.find_one_by_fields(
                User, True, {'reset_password_token': invite_token}
            )
            if not pending_user:
                raise BadRequest("Invalid invitation link")

            if email != pending_user.username:
                raise BadRequest("Registered email does not match the invited email")

            # Enable user account
            pending_user.status_id = UserStatusEnum.ACTIVE.value

            # Hash password field
            hashed_password = user_manager.hash_password(password)
            pending_user.password = hashed_password

            pending_user.firstname = firstname
            pending_user.lastname = lastname

            # Add User record using named arguments 'user_fields'
            transaction.add_or_update(pending_user)

        # Send user_registered signal
        # pylint: disable=protected-access
        user_registered.send(current_app._get_current_object(), user=pending_user)

        return login_user("registration_successful", email)

    @Route.POST(
        '/forgot_password',
        title='Forgot Password',
        description='Handle forgotten password request',
        schema=USER_FORGOT_PASSWORD_SCHEMA,
    )
    def forgot_password(self, **payload):
        email = payload['email']

        try:
            # Try to send a password reset email
            send_reset_password(email)
        except ItemNotFound:
            return {"message": "non_existent_user"}, BAD_REQUEST

        return {"message": "password_reset_email_sent"}, OK

    @Route.POST(
        '/reset_password',
        title='Reset Password',
        description='Handle reset password request',
        schema=USER_RESET_PASSWORD_SCHEMA,
    )
    def reset_password(self, **payload):
        token = payload['token']
        password = payload['password']
        user_manager = current_app.user_manager

        is_valid, has_expired, user_id = user_manager.verify_token(
            token, user_manager.reset_password_expiration
        )

        if not is_valid:
            raise GenericValidationError({"token": "invalid_reset_link"})

        if has_expired:
            raise GenericValidationError({"token": "expired_token"})

        user = user_manager.get_user_by_id(user_id)

        hashed_password = current_app.user_manager.hash_password(password)
        user.password = hashed_password

        with Transaction() as transaction:
            transaction.add_or_update(user)

        if user_manager.enable_email and user_manager.send_password_changed_email:
            send_password_changed_email(user)

        # Send user_reset_password signal
        # pylint: disable=protected-access
        user_reset_password.send(current_app._get_current_object(), user=user)

        if user_manager.auto_login_after_reset_password:
            return login_user("password_reset_success", user.username)

        return make_response(
            jsonify({"msg": "password_reset_success"}),
            OK,
        )

    @Route.GET(
        '/registration_data',
        title='Get Registration Data',
        description='Get registration data by invitation token',
        response_schema=FieldSet({'username': fields.String(description='Username')}),
    )
    def registration_data(self):
        token = request.args.get('token')

        if not token:
            raise GenericValidationError({"token": "no_invitation_link"})

        with Transaction() as transaction:
            pending_user = transaction.find_one_by_fields(
                User, True, {'reset_password_token': token}
            )

        if not pending_user:
            raise GenericValidationError({"token": "invalid_invitation_link"})

        data = {"username": pending_user.username}

        return data, OK

    @Route.GET(
        '/user_manager_info',
        title='Get User Manager Info',
        description='Gets user manager info',
        response_schema=USER_MANAGER_INFO_RESPONSE_SCHEMA,
        rel='get_user_manager_info',
    )
    def get_user_manager_info(self):
        user_manager = current_app.user_manager
        enable_change_username = user_manager.enable_change_username
        enable_change_password = user_manager.enable_change_password
        enable_retype_password = user_manager.enable_retype_password
        enable_email = user_manager.enable_email
        enable_username = user_manager.enable_username

        return {
            'enableChangeUsername': enable_change_username,
            'enableChangePassword': enable_change_password,
            'enableRetypePassword': enable_retype_password,
            'enableEmail': enable_email,
            'enableUsername': enable_username,
        }


RESOURCE_TYPES = [AuthenticationResource]
