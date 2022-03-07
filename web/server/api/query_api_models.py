from typing import List, Any
from flask import current_app
from flask_potion import fields
from flask_potion.routes import Relation, Route

from models.alchemy.query_policy import QueryPolicy, QUERY_POLICY_TYPES
from web.server.api.api_models import PrincipalResource
from web.server.security.permissions import principals

EMPTY_LIST: List[Any] = []

CONFIG_FILTERS = current_app.zen_config.filters
DIMENSIONS = list(
    current_app.druid_context.dimension_values_lookup.get_dimension_value_map(
        False
    ).keys()
)

SPECIFIC_VALUES_SCHEMA = fields.List(
    fields.String(description='An individual dimension value.'),
    nullable=True,
    default=EMPTY_LIST,
    description='A list of dimension values that the policy holder will be allowed to or prevented '
    'from querying on. To allow the user to query against all values, you would omit '
    'this field and instead set `allowAllValues` to true.',
)

ALL_VALUES_SCHEMA = fields.Boolean(
    description='Set to true if the policy holder should be allowed to query across ALL values '
    'for the specified dimension.',
    default=False,
    nullable=True,
)

DIMENSION_VALUES_SCHEMA = fields.Object(
    {
        'excludeValues': SPECIFIC_VALUES_SCHEMA,
        'includeValues': SPECIFIC_VALUES_SCHEMA,
        'allValues': ALL_VALUES_SCHEMA,
    }
)

POLICY_FILTERS_SCHEMA = fields.Object(
    properties=DIMENSION_VALUES_SCHEMA,
    pattern_properties={
        fields.String(
            title='dimensionType', description='The dimension to filter on'
        ): DIMENSION_VALUES_SCHEMA
    },
    pattern='|'.join(DIMENSIONS),
    attribute='policy_filters',
    description='A mapping of dimension names to the discrete dimension values that the '
    'policy holder is allowed to query data for. Example: For dimension '
    '\'foo\', to allow the policy holder to query on values \'baz\' and '
    '\'baq\', one would specify the following request object: '
    '{ "foo": { "includeValues": ["baz", "baq"] } }',
)


class QueryPolicyResource(PrincipalResource):

    resource = Relation('resource', io='r')

    class Meta:
        model = QueryPolicy
        natural_key = 'name'
        excluded_fields = ('id',)

        permissions = {'view_resource': 'view_resource'}

        filters = {'name': True, 'description': True}

    class Schema:
        name = fields.String(
            description='A unique human-readable name to denote the query policy.'
        )

        description = fields.String(
            description='A description of what data the query policy is governing the access to.'
        )

        policyFilters = POLICY_FILTERS_SCHEMA

        resource = fields.ItemUri(
            'web.server.api.permission_api_models.BackendResource',
            attribute='resource_id',
        )

        queryPolicyTypeId = fields.Integer(attribute='query_policy_type_id')

    # pylint: disable=R0201
    # pylint: disable=E1101
    # Flask Potion does not allow class methods.

    @Route.GET(
        '/enabled_dimensions',
        rel='getAuthorizableDimensions',
        response_schema=fields.List(
            fields.String(
                description='A dimension for which authorization is enabled.',
                enum=CONFIG_FILTERS.AUTHORIZABLE_DIMENSIONS,
            ),
            description='The list of dimensions for which authorization filters will have effect.',
        ),
    )
    def get_authorizable_dimensions(self):
        return CONFIG_FILTERS.AUTHORIZABLE_DIMENSIONS

    @Route.GET(
        '/dimensions',
        rel='getAllDimensions',
        response_schema=fields.List(
            fields.String(description='A dimension in Druid.', enum=DIMENSIONS),
            description='The list of all Druid dimensions.',
        ),
    )
    def get_all_dimensions(self):
        return DIMENSIONS


RESOURCE_TYPES = [QueryPolicyResource]
