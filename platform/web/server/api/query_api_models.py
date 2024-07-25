from typing import List, Any, Dict
from flask import current_app
from flask_potion import fields
from flask_potion.routes import Relation, Route

from models.alchemy.query import Dimension
from models.alchemy.query_policy import QueryPolicy
from web.server.api.api_models import PrincipalResource
from web.server.data.data_access import Transaction
from web.server.potion.managers import QueryPolicyResourceManager
from web.server.security.permissions import principals

EMPTY_LIST: List[Any] = []

CONFIG_FILTERS = current_app.zen_config.filters

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


class QueryPolicyResource(PrincipalResource):

    resource = Relation('resource', io='r')

    class Meta:
        model = QueryPolicy
        excluded_fields = ('id',)
        manager = principals(QueryPolicyResourceManager)

        filters: Dict[str, bool] = {}

    class Schema:
        dimension = fields.String(description='Dimension that access is given to')
        dimensionValue = fields.String(
            nullable=True,
            description='Dimension Value to allow access to, or null if access is granted for all '
            'values in the given dimension',
            attribute='dimension_value',
        )

        resource = fields.ItemUri(
            'web.server.api.permission_api_models.BackendResource',
            attribute='resource_id',
        )

        queryPolicyTypeId = fields.Integer(attribute='query_policy_type_id')

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
            fields.String(description='A dimension in Druid.'),
            description='The list of all Druid dimensions.',
        ),
    )
    def get_all_dimensions(self):
        with Transaction() as transaction:
            return [dim for dim, in transaction.run_raw().query(Dimension.id).all()]


RESOURCE_TYPES = [QueryPolicyResource]
