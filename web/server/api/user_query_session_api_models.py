from flask_potion import fields
from flask_potion.routes import ItemRoute, Route
from flask_potion.schema import FieldSet

from web.server.routes.views.user_query_session import store_query_and_generate_link
from web.server.api.api_models import PrincipalResource
from models.alchemy.user_query_session.model import UserQuerySession

GET_BY_QUERY_UUID_RESPONSE_SCHEMA = FieldSet(
    {
        'queryBlob': fields.Any(),
        'queryUuid': fields.String(),
        'username': fields.String(),
    }
)


class UserQuerySessionResource(PrincipalResource):
    '''Potion class for interacting with saved queries.
    '''

    class Meta:
        model = UserQuerySession
        filters = {'queryUuid': True}

        id_attribute = 'query_uuid'
        id_field_class = fields.String()
        permissions = {'read': 'view_resource'}

    class Schema:
        queryUuid = fields.String(attribute='query_uuid', nullable=True)
        userId = fields.Integer(attribute='user_id')
        queryBlob = fields.Any(attribute='query_blob')

    # pylint: disable=E1101
    @ItemRoute.GET('/by_query_uuid')
    # pylint: disable=R0201
    def by_query_uuid(self, user_query_session):
        return {
            'queryBlob': user_query_session.query_blob,
            'queryUuid': user_query_session.query_uuid,
            'username': user_query_session.user.username,
        }

    # pylint: disable=E1101
    @Route.POST(
        '/generate_link',
        rel='generateLink',
        schema=fields.Inline('self'),
        response_schema=fields.String(),
    )
    # pylint: disable=R0201
    def generate_link(self, query_session):
        return store_query_and_generate_link(query_session)


RESOURCE_TYPES = [UserQuerySessionResource]
