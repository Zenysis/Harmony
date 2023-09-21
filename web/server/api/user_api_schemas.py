from flask_potion import fields

from models.alchemy.user import USER_STATUSES, UserStatusEnum
from web.server.api.model_schemas import (
    ACL_SCHEMA,
    INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER,
    INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY,
    USERNAME_SCHEMA,
)
from web.server.routes.views.users import Invitee

# The schema for an invite user request
INVITE_OBJECT_FIELDS = {
    'name': fields.String(
        description='The invited user\'s name.',
        pattern=INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER,
    ),
    'email': USERNAME_SCHEMA,
}

INVITE_OBJECT_SCHEMA = fields.Custom(
    fields.Object(INVITE_OBJECT_FIELDS), converter=lambda value: Invitee(**value)
)

FIRST_NAME_SCHEMA = fields.String(
    description='The first name of the user.',
    attribute='first_name',
    pattern=INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER,
)

LAST_NAME_SCHEMA = fields.String(
    description='The last name of the user.',
    attribute='last_name',
    pattern=INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY,
)

PHONE_NUMBER_SCHEMA = fields.String(
    description='The phone number of the user.', attribute='phone_number'
)

STATUS_SCHEMA = fields.Custom(
    fields.String(enum=USER_STATUSES),
    attribute='status_id',
    formatter=lambda status_id: UserStatusEnum(status_id).name.lower(),
    converter=lambda status_value: UserStatusEnum[status_value.upper()].value,
    default=UserStatusEnum.ACTIVE.value,
    nullable=False,
)

API_TOKEN_SCHEMA = fields.Object(
    {
        '$uri': fields.String(),
        'isRevoked': fields.Boolean(attribute='is_revoked'),
        # NOTE: these 3 should not be here, but I didn't find a way to serialize
        # without them in JS
        'id': fields.String(nullable=True),
        'created': fields.DateString(nullable=True),
        'revoked': fields.DateString(nullable=True),
    }
)

FRONTEND_USER_UPDATE_SCHEMA = fields.Object(
    {
        '$uri': fields.String(),
        'username': USERNAME_SCHEMA,
        'firstName': FIRST_NAME_SCHEMA,
        'lastName': LAST_NAME_SCHEMA,
        'phoneNumber': PHONE_NUMBER_SCHEMA,
        'status': STATUS_SCHEMA,
        'acls': fields.List(ACL_SCHEMA),
        'apiTokens': fields.List(API_TOKEN_SCHEMA),
        'roles': fields.List(fields.String()),
        'groups': fields.List(fields.String()),
    }
)
