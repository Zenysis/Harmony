from flask_potion import fields
from flask_potion.contrib.alchemy import fields as alchemy_fields
from flask_potion.schema import FieldSet

from models.alchemy.permission import ResourceType, RESOURCE_TYPES
from web.server.api.model_schemas import (
    PERMISSION_SCHEMA,
    RESOURCE_TYPE_FIELDS,
    ROLE_NAME_SCHEMA,
)
from web.server.api.query_api_models import POLICY_FILTERS_SCHEMA
from web.server.api.responses import augment_standard_schema

RESOURCE_SUMMARY = fields.Object(
    properties={
        '$uri': fields.ItemUri(
            'web.server.api.permission_api_models.BackendResource', attribute='id'
        ),
        'label': fields.String(),
        'name': fields.String(),
        'resourceType': fields.Custom(
            fields.String(enum=RESOURCE_TYPES),
            formatter=lambda rsc_type: rsc_type.name.name,
            attribute='resource_type',
            description='The string representation of the resource type.',
        ),
    },
    attribute='resource',
)

RESOURCE_ROLE_SUMMARY = fields.Object(
    properties={
        '$uri': fields.ItemUri(
            'web.server.api.permission_api_models.BackendResourceRole', attribute='id'
        ),
        'name': fields.String(),
        'resourceType': fields.Custom(
            fields.String(enum=RESOURCE_TYPES),
            formatter=lambda rsc_type: rsc_type.name.name,
            attribute='resource_type',
            description='The string representation of the resource type.',
        ),
    },
    attribute='resource_role',
)

# The schema of the response object returned when trying to update the permissions of a `Role`
ROLE_PERMISSIONS_FIELDS = {
    'roleResourceType': alchemy_fields.InlineModel(
        RESOURCE_TYPE_FIELDS,
        description='The Resource type corresponding to the Role.',
        model=ResourceType,
        nullable=True,
    ),
    'permissionResourceType': alchemy_fields.InlineModel(
        RESOURCE_TYPE_FIELDS,
        description='The Resource type corresponding to the Permission.',
        model=ResourceType,
        nullable=True,
    ),
}

UPDATE_ROLE_PERMISSIONS_RESPONSE_SCHEMA = augment_standard_schema(
    ROLE_PERMISSIONS_FIELDS
)
ROLE_LIST_SCHEMA = fields.List(
    ROLE_NAME_SCHEMA,
    title='roles',
    description='A listing of roles held by a user or security group on an '
    'indvidual resource or all resources of a specific type.',
)

USER_ROLES_MAPPING = fields.Object(
    properties=ROLE_LIST_SCHEMA,
    pattern_properties={
        fields.String(
            title='username', description='The user\'s username'
        ): ROLE_LIST_SCHEMA
    },
    default=None,
    nullable=True,
    description='A mapping of usernames to a list of roles that a user should have for a given '
    'resource. Do not specify if user roles for the resource are not to be updated. '
    'Specify an empty list to delete ALL user roles for this resource.',
)

GROUP_ROLES_MAPPING = fields.Object(
    properties=ROLE_LIST_SCHEMA,
    pattern_properties={
        fields.String(title='name', description='The group\'s name'): ROLE_LIST_SCHEMA
    },
    nullable=True,
    default=None,
    description='An object defining the roles that a group should have for a given resource. '
    'Do not specify if group roles for the resource are not to be updated. '
    'Specify an empty list to delete ALL group roles for this resource. ',
)

SITEWIDE_RESOURCE_ACL_SCHEMA = fields.Object(
    {
        'registeredResourceRole': ROLE_NAME_SCHEMA,
        'unregisteredResourceRole': ROLE_NAME_SCHEMA,
    },
    description='SitewideResourceAcl ResourceRoles for a specific resource',
    default=None,
    nullable=True,
)

RESOURCE_ROLES_FIELDS = {
    'groupRoles': GROUP_ROLES_MAPPING,
    'sitewideResourceAcl': SITEWIDE_RESOURCE_ACL_SCHEMA,
    'userRoles': USER_ROLES_MAPPING,
}

# The schema for the request object when trying to update the roles that users and groups hold
# for a Resource
RESOURCE_ROLES_SCHEMA = fields.Object(
    RESOURCE_ROLES_FIELDS,
    description='The permissions mapping describing which roles should be assigned to users '
    '(registered and unregistered) and groups for this particular resource. '
    'All parameters are optional. Specify an empty list for a parameter to delete all '
    'respective roles for authorization that type (e.g. an empty list for `user_roles` '
    'will delete ALL roles for ALL users on the given resource). A `null` value for a '
    'parameter will result in no permissions being changed for that authorization '
    'type (e.g. specifying a null value for `user_roles` will result in no changes '
    'being made to user roles for the given resource).',
)

RESPECTIVE_APIS = {
    'user': 'api2/user',
    'group': 'api2/group',
    'dashboard': 'api2/dashboard',
    'query_policy': 'api2/query_policy',
}
READ_ONLY_API_MESSAGE = (
    'Method is not supported. This is a read-only API. '
    'Direct all CRUD operations for a given resource type to its '
    'respective URI. They are as follows: %s' % RESPECTIVE_APIS
)

FRONTEND_ROLE_SCHEMA = fields.Object(
    {
        'alertResourceRoleName': fields.String(),
        'dashboardResourceRoleName': fields.String(),
        'label': fields.String(),
        'name': fields.String(),
        'permissions': fields.Array(PERMISSION_SCHEMA),
        '$uri': fields.String(),
        'queryPolicies': fields.Array(
            FieldSet(
                {
                    'name': fields.String(
                        description='A unique human-readable name to denote the '
                        'query policy.'
                    ),
                    'description': fields.String(
                        description='A description of what data the query '
                        'policy is governing the access to.'
                    ),
                    'policyFilters': POLICY_FILTERS_SCHEMA,
                    'queryPolicyTypeId': fields.Integer(
                        description='The query policy type id for this policy.'
                    ),
                    '$uri': fields.String(description="Uri of the query policy"),
                }
            ),
            description='Array of query policies of the role.',
        ),
        'usernames': fields.Array(fields.String(), description='Array of usernames'),
        'dataExport': fields.Boolean(
            description='Defines if a user has permissions to export data.'
        ),
    },
    description='The frontend role mapping',
)
