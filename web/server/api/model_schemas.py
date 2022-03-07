# -*- coding: utf-8 -*-

'''A module containing definitions for SQL Alchemy Models that are used by Flask-Potion in the
generation of JSON Hyper Schemas.
'''

from flask_potion import fields
from flask_potion.contrib.alchemy import fields as alchemy_fields

from models.alchemy.permission import (
    Permission,
    Resource,
    ResourceType,
    Role,
    RESOURCE_TYPES,
)
from models.alchemy.user import User, UserRoles
from models.alchemy.history import HistoryRecord
from models.alchemy.dashboard import DashboardReportSchedule, ScheduleCadenceEnum
from models.alchemy.security_group import Group, GroupRoles
from web.server.util.util import as_dictionary, EMAIL_PATTERN

SCHEDULE_PERIODS = {cadence.name for cadence in ScheduleCadenceEnum}


def user_role_as_dictionary(user_role, camelcase_keys=False):
    '''Converts an instance of `UserRoles` to a dictionary object that matches the schema defined
    in `USER_ROLES_SCHEMA`.

    Parameters
    ----------
    user_role : `web.server.api.user_models.UserRoles`
        The `UserRoles` instance that will be converted to a dictionary.


    camelcase_keys: bool (optional)
        Indicates whether or not the resulting object should have camel-cased string
        keys (i.e. have the output keys changed from 'snake_case' to 'camelCase')

    Returns
    -------
    dict
        The dictionary representation of `user_role`.

    '''
    resource_type_key = 'resourceType' if camelcase_keys else 'resource_type'

    role_fields = [Role.name.name]
    role_field_overrides = {
        Role.name.name: 'roleName' if camelcase_keys else 'role_name'
    }

    resource_fields = [Resource.name.name]
    resource_field_overrides = {
        Resource.name.name: 'resourceName' if camelcase_keys else 'resource_name'
    }

    resource_type_fields = [ResourceType.name.name]
    resource_type_field_overrides = {ResourceType.name.name: resource_type_key}

    output = as_dictionary(
        user_role.role, keys=role_fields, name_overrides=role_field_overrides
    )
    resource_data = as_dictionary(
        user_role.resource,
        keys=resource_fields,
        name_overrides=resource_field_overrides,
    )

    output.update(resource_data)
    return output


def group_role_as_dictionary(group_role, camelcase_keys=False):
    '''Converts an instance of `GroupRole` to a dictionary object that matches the schema defined
    in `GROUP_ROLES_SCHEMA`.

    Parameters
    ----------
    group_role : `web.server.api.group_models.GroupRole`
        The `GroupRole` instance that will be converted to a dictionary.

    camelcase_keys: bool (optional)
        Indicates whether or not the resulting object should have camel-cased string
        keys (i.e. have the output keys changed from 'snake_case' to 'camelCase')

    Returns
    -------
    dict
        The dictionary representation of `group_role`.

    '''
    return user_role_as_dictionary(group_role, camelcase_keys)


_TYPE_TO_CONVERTER = {
    UserRoles: user_role_as_dictionary,
    GroupRoles: group_role_as_dictionary,
}


def role_list_as_map(roles):
    '''Converts an enumeration of `UserRoles`, `GroupRoles` to a dictionary
    object that matches the schema defined in `ROLE_MAP_SCHEMA`.

    Parameters
    ----------
    roles : iter
        The enumeration of role instances.

    Returns
    -------
    dict
        The output role map.

    '''
    output = {}

    # TODO(toshi): Fix this, and decide whether is makes sense to also send
    # group IDs
    return output
    for role in roles:
        converter_method = _TYPE_TO_CONVERTER[type(role)]
        role_entity = converter_method(role)

        resource_type = role_entity['resource_type']
        resource_name = role_entity.get('resource_name')
        role_name = role_entity['role_name']

        is_sitewide = True if not resource_name else False

        roles_by_resource_type = output.get(
            resource_type, {'sitewideRoles': [], 'resources': {}}
        )

        if is_sitewide:
            roles_by_resource_type['sitewideRoles'].append(role_name)
        else:
            resources = roles_by_resource_type['resources']
            roles = resources.get(resource_name, [])
            roles.append(role_name)

            resources[resource_name] = roles

        if resource_type not in output:
            output[resource_type] = roles_by_resource_type

    return output


# The fields of the `Resource` model.
RESOURCE_FIELDS = fields.Object(
    properties={
        '$uri': fields.String(description='Resource URI'),
        'label': fields.String(description='Resource label'),
        'name': fields.String(description='Resource slug name'),
        'resourceType': fields.String(description='Resource type name'),
    },
    description='Field properties for a resource.',
)


# The fields of the `ResourceRole` model.
RESOURCE_ROLE_FIELDS = fields.Object(
    properties={
        '$uri': fields.String(description='Resource role uri'),
        'name': fields.String(description='Resource role name.'),
        'resourceType': fields.String(description='Resource role type'),
    }
)


# The schema of an acl model, i.e. GroupAcl, UserAcl.
ACL_SCHEMA = fields.Object(
    properties={
        '$uri': fields.String(),
        'resource': RESOURCE_FIELDS,
        'resourceRole': RESOURCE_ROLE_FIELDS,
    },
    description='An individual entry of an acl model. Returns a mapping of '
    'resource and resource role.',
)


'''The schema of the `Permission` model.
'''
PERMISSION_SCHEMA = alchemy_fields.InlineModel(
    {
        'id': fields.Integer(
            minimum=1, description='The ID of the permission.', nullable=True
        ),
        'permission': fields.String(description='The type of permission.'),
        'resource_type_id': fields.Integer(),
    },
    title='Permission',
    description='An individual role permission.',
    model=Permission,
)

'''The schema for the `ResourceType` model.
'''
RESOURCE_TYPE_FIELDS = {
    'id': fields.Integer(minimum=1, description='The id of the resource type.'),
    'name': fields.String(
        description='The string representation of the resource type.'
    ),
}

ROLE_NAME_SCHEMA = fields.String(
    title='roleName',
    description='The string representation of a role name. (e.g. `dashboard_admin`)',
)

# The schema for a mapping of resource names to role names
# Structure should be
# { <resourceName>: [<roleName>, <otherRoleName>], <otherResourceName>: [<roleName>], ... }
RESOURCE_MAP_SCHEMA = fields.Object(
    properties=fields.List(
        ROLE_NAME_SCHEMA,
        description='A list of all the roles held for a given resource.',
    ),
    pattern_properties={
        fields.String(
            title='resourceName', description='An individual resource.'
        ): fields.List(ROLE_NAME_SCHEMA)
    },
    nullable=False,
    description='A mapping of resource names to role names. ',
)

# The schema representing the role assignments for an individual resource type
# Structure should be
# {
#   'resources': {
#     <resourceName>: [<roleName>, <otherRoleName>],
#     <otherResourceName>: [<roleName>], ...
#   },
#   'sitewideRoles': [<roleName>, <otherRoleName>, ...]
# }
ROLES_BY_RESOURCE_TYPE_SCHEMA = fields.Object(
    properties={
        'sitewideRoles': fields.List(
            ROLE_NAME_SCHEMA,
            description='The sitewide roles held by the parent entity for the defined '
            'resource type',
            default={},
        ),
        'resources': RESOURCE_MAP_SCHEMA,
    },
    description='A grouping of sitewide roles for a specific resource type as '
    'well as resource-specific roles for resources of that type.',
    nullable=False,
)

# The schema representing role assignments for all resource types and
# individual resources
#
# Structure should be:
# {
#     <resourceType>: {
#       'resources': {
#           <resourceName>: [<roleName>, <otherRoleName>],
#           <otherResourceName>: [<roleName>], ...
#       },
#       'sitewideRoles': [<roleName>, <otherRoleName>, ...]
#     },
#     <otherResourceType>: {
#       'resources': {
#           <resourceName>: [<roleName>, <otherRoleName>],
#           <otherResourceName>: [<roleName>], ...
#       },
#       'sitewideRoles': [<roleName>, <otherRoleName>, ...]
#     }
# }
#
# Full example is:
# {
#     "DASHBOARD": {
#         "resources": {
#             "jsc": [
#                 "dashboard_viewer"
#             ]
#         },
#         "sitewideRoles": []
#     },
#     "SITE": {
#         "resources": {},
#         "sitewideRoles": [
#             "directory_reader"
#         ]
#     }
# }
ROLE_MAP_SCHEMA = fields.Object(
    properties=ROLES_BY_RESOURCE_TYPE_SCHEMA,
    pattern_properties={
        fields.String(
            title='resourceType', description='An individual resource type'
        ): ROLES_BY_RESOURCE_TYPE_SCHEMA
    },
    pattern='|'.join(RESOURCE_TYPES),
    nullable=False,
    description='A mapping of resource types and individual resources to roles. ',
)

# NOTE(vedant): This model is not directly exposed because it has many relations and we don't
# need to expose the exact structure. Instead we offer a nice JSONified version of it for
# easy consumption on the client side. Clients are able to change Roles that a User/Group is
# a member of via the APIs and as such, don't need to interact with
# `UserRoles`/`GroupRoles` directly.
'''The schema for the `UserRoles` model.
'''
USER_ROLES_SCHEMA = fields.Custom(
    fields.Object(
        {
            'roleName': fields.String(io='r', description='The name of the role. '),
            'resourceName': fields.String(
                io='r',
                description='The resource that the role is tied to. If null, this role is applicable '
                'sitewide on all resources of the specified type.',
                nullable=True,
            ),
            'resourceType': fields.String(
                io='r', description='The type of resource the role is associated with.'
            ),
        }
    ),
    converter=None,
    formatter=lambda user_role: user_role_as_dictionary(user_role, True),
)

# NOTE(vedant): The structure of `GroupRoles` is identical to `UserRoles` although the models
# have different Primary Key constraints which is why they are represented separately.
'''The schema for the `GroupRoles` model.
'''
GROUP_ROLES_SCHEMA = USER_ROLES_SCHEMA

USERNAME_SCHEMA = fields.Email(
    description='The e-mail address/username that the user uses to sign-in.',
    pattern=EMAIL_PATTERN,
)

_USER_FIELDS = {
    'username': USERNAME_SCHEMA,
    'firstName': fields.String(
        description='The user\'s first name.', attribute='first_name'
    ),
    'lastName': fields.String(
        description='The user\'s last name.', attribute='last_name'
    ),
    'roles': fields.List(
        USER_ROLES_SCHEMA, description='The individual roles that this user possesses.'
    ),
}
_CONCISE_USER_FIELDS = dict(_USER_FIELDS)
_CONCISE_USER_FIELDS.pop('roles')

'''The schema for the `User` model.
'''
USER_SCHEMA = alchemy_fields.InlineModel(
    _USER_FIELDS, description='An individual user.', model=User
)

'''The 'concise' schema for the `User` model (omitting the roles that the User has).
'''
CONCISE_USER_SCHEMA = alchemy_fields.InlineModel(
    _CONCISE_USER_FIELDS, description='An individual user.', model=User
)

_GROUP_FIELDS = {
    'name': fields.String(description='The name of the group.'),
    'users': fields.List(USER_SCHEMA, description='The individual users in a group.'),
    'roles': fields.List(
        GROUP_ROLES_SCHEMA,
        description='The individual roles that all members of this group possess.',
    ),
}
_CONCISE_GROUP_FIELDS = dict(_GROUP_FIELDS)
_CONCISE_GROUP_FIELDS.pop('roles')
_CONCISE_GROUP_FIELDS.pop('users')

'''The schema for the `Group` model.
'''
GROUP_SCHEMA = alchemy_fields.InlineModel(
    _GROUP_FIELDS,
    description='An individual group with its constituent users and roles.',
    model=Group,
)

'''The 'concise' schema for the `Group` model (omitting the roles and users that the Group has).
'''
CONCISE_GROUP_SCHEMA = alchemy_fields.InlineModel(
    _CONCISE_GROUP_FIELDS,
    description='An individual group with its constituent users and roles.',
    model=Group,
)

''' A regex pattern that only allows alphanumeric characters, dashes, underscores
spaces, and select special characters (e.g. apostrophes, periods). Ideal for regex
validation of names.
'''
ALPHANUMERIC_AND_DELIMITER = r"(^[a-zA-Z0-9]+[a-zA-Z0-9-_.' ]*[a-zA-Z0-9]+)$"

INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER = (
    r"(^[A-zÀ-ÿ0-9]+[A-zÀ-ÿ0-9-_.' ]*[A-zÀ-ÿ0-9]*)$"
)
INTERNATIONALIZED_ALPHANUMERIC_AND_DELIMITER_OR_EMPTY = (
    r"(^([A-zÀ-ÿ0-9]+[A-zÀ-ÿ0-9-_.' ]*[A-zÀ-ÿ0-9]*))|(\s*)$"
)

HISTORY_CHANGE_FIELDS = {
    'user': fields.ItemUri(
        'web.server.api.user_api_models.UserResource', attribute='user_id'
    ),
    'revisionId': fields.Integer(
        attribute='id', description='The unique history identifier'
    ),
    'objectUri': None,
    'changes': fields.Any(attribute='changes', description='History item changes'),
    'revisionDate': fields.DateTimeString(
        attribute='created', description='History item created date'
    ),
}


def generate_history_record_schema(uri_field, resource_name):
    updated_fields = HISTORY_CHANGE_FIELDS.copy()
    updated_fields['objectUri'] = uri_field
    return alchemy_fields.InlineModel(
        updated_fields,
        description='A history record for {resource_name}'.format(
            resource_name=resource_name
        ),
        model=HistoryRecord,
    )


SHARE_ANALYSIS_EMAIL_SCHEMA = {
    'subject': fields.String(description='Email subject'),
    'sender': fields.Email(description='Reply to email'),
    'message': fields.String(description='Email body'),
    'imageUrl': fields.String(
        nullable=True,
        description='Base64 URL encoded string for the image to embed in the mail',
        attribute='image_url',
    ),
    'recipients': fields.List(
        fields.Email(nullable=False),
        nullable=False,
        description='A list of emails to share an analysis with',
    ),
    'attachments': fields.List(
        fields.Object(
            {
                'filename': fields.String(description='Name of the attachment file'),
                'content': fields.String(
                    description='Content inform of CSV or JSON strings for the attachment file'
                ),
            }
        )
    ),
    'queryUrl': fields.Uri(
        description='Url for the current query', attribute='query_url'
    ),
    'isPreview': fields.Boolean(
        description='Flag for sending preview email', attribute='is_preview'
    ),
}

DASHBOARD_REPORT_SCHEDULE_PROPERTIES = {
    'id': fields.Integer(nullable=True),
    'cadence': fields.Custom(
        fields.String(enum=SCHEDULE_PERIODS), formatter=lambda cadence: cadence.name
    ),
    'dayOffset': fields.Custom(
        fields.String(nullable=True), formatter=str, attribute='day_offset'
    ),
    'timeOfDay': fields.String(attribute='time_of_day'),
    'month': fields.String(nullable=True),
    'recipients': fields.Array(fields.String(), min_items=0),
    'subject': fields.String(),
    'message': fields.String(),
    'shouldAttachPdf': fields.Boolean(attribute='should_attach_pdf', default=False),
    'useSingleEmailThread': fields.Boolean(
        attribute='use_single_email_thread', default=False, nullable=True
    ),
    'useRecipientQueryPolicy': fields.Boolean(
        attribute='use_recipient_query_policy', default=True, nullable=True
    ),
    'shouldEmbedImage': fields.Boolean(attribute='should_embed_image', default=False),
    'ownerUsername': fields.String(nullable=True, attribute='owner_username'),
    'ownerName': fields.String(nullable=True, attribute='owner_name'),
    'recipientUserGroups': fields.Array(
        alchemy_fields.InlineModel(
            {'name': fields.String(description='The name of the group.')}, model=Group
        ),
        attribute='user_groups',
    ),
}

DASHBOARD_REPORT_SCHEDULE = fields.Object(
    properties=DASHBOARD_REPORT_SCHEDULE_PROPERTIES
)

DASHBOARD_SCHEDULED_REPORTS = fields.Array(
    alchemy_fields.InlineModel(
        DASHBOARD_REPORT_SCHEDULE_PROPERTIES, model=DashboardReportSchedule
    )
)
