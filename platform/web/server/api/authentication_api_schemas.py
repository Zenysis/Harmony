from flask_potion import fields
from flask_potion.schema import FieldSet
from web.server.api.model_schemas import (
    INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY,
)

from web.server.util.util import EMAIL_PATTERN

ALPHANUMERIC_AND_DELIMITER = r"(^[a-zA-Z0-9]+[a-zA-Z0-9-_.' ]*[a-zA-Z0-9]+)$"

USER_REGISTER_SCHEMA = FieldSet(
    {
        'email': fields.Email(
            nullable=False,
            description='The email address of the user. Must be unique and conform to the '
            f'following regex pattern: {EMAIL_PATTERN}',
            pattern=EMAIL_PATTERN,
        ),
        'firstname': fields.String(
            nullable=False,
            description='The first name of the user. Must be non-empty and conform to the '
            f'following regex pattern: {INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY}',
            pattern=INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY,
        ),
        'lastname': fields.String(
            nullable=False,
            description='The last name of the user. Must be non-empty and conform to the '
            f'following regex pattern: {INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY}',
            pattern=INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY,
        ),
        'password': fields.String(
            nullable=False,
            description='The password of the user. is required and must be alteast 8 '
            'characters long.',
            min_length=8,
        ),
        'invite_token': fields.String(
            nullable=False,
            description='The invite token for the user. Must be non-empty.',
        ),
    }
)

USER_LOGIN_SCHEMA = FieldSet(
    {
        'email': fields.Email(
            nullable=False,
            description='The email address of the user. Must be non-empty and conform to the '
            f'following regex pattern: {EMAIL_PATTERN}',
            pattern=EMAIL_PATTERN,
        ),
        'password': fields.String(
            nullable=False,
            description='The password of the user. Must be non-empty',
            min_length=1,
        ),
        'remember_me': fields.Boolean(
            default=False,
            description='Whether to remember the user for future sessions or not.',
        ),
    }
)

LOGIN_RESPONSE_SCHEMA = FieldSet(
    {
        'status': fields.String(
            enum=['success', 'error'], description='Status of the request'
        ),
        'message': fields.String(description='Descriptive message based on the status'),
        'access_token': fields.String(
            nullable=True, description='Access token for the user'
        ),
        'next_endpoint': fields.String(
            nullable=True, description='Next endpoint for the user to be directed to'
        ),
    }
)


USER_FORGOT_PASSWORD_SCHEMA = FieldSet(
    {
        'email': fields.Email(
            nullable=False,
            description='The email address of the user. Must be non-empty and conform to the '
            f'following regex pattern: {EMAIL_PATTERN}',
            pattern=EMAIL_PATTERN,
        ),
    }
)

USER_RESET_PASSWORD_SCHEMA = FieldSet(
    {
        'password': fields.String(
            nullable=False,
            min_length=8,
            max_length=128,
            description='The password of the user. is required and must be at least 8 '
            'and no more than 128 characters long.',
        ),
        'token': fields.String(
            nullable=False,
            max_length=256,
            description='The reset password token for the user. Must be non-empty.',
        ),
    }
)

USER_MANAGER_INFO_RESPONSE_SCHEMA = FieldSet(
    {
        'enableChangeUsername': fields.Boolean(
            description='Flag to enable change username functionality.'
        ),
        'enableChangePassword': fields.Boolean(
            description='Flag to enable change password functionality.'
        ),
        'enableRetypePassword': fields.Boolean(
            description='Flag to enable retype password functionality.'
        ),
        'enableEmail': fields.Boolean(
            description='Flag to enable email functionality.'
        ),
        'enableUsername': fields.Boolean(
            description='Flag to enable username functionality.'
        ),
    }
)
