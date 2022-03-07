from flask_potion import ModelResource, fields
from flask_potion.routes import ItemRoute, Route
from flask_potion.schema import FieldSet

from models.alchemy.user_query_session.model import UserQuerySession
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import authorization_required
from web.server.routes.views.user_query_session import store_query_and_generate_link
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID

GET_BY_QUERY_UUID_RESPONSE_SCHEMA = FieldSet(
    {
        'queryBlob': fields.Any(),
        'queryUuid': fields.String(),
        'username': fields.String(),
    }
)


class UserQuerySessionResource(ModelResource):
    '''Potion class for interacting with saved queries.
    '''

    class Meta:
        model = UserQuerySession
        filters = {'queryUuid': True}

        id_attribute = 'query_uuid'
        id_field_class = fields.String()

    class Schema:
        queryUuid = fields.String(attribute='query_uuid', nullable=True)
        userId = fields.Integer(attribute='user_id')
        queryBlob = fields.Any(attribute='query_blob')

    # pylint: disable=E1101
    @ItemRoute.GET('/by_query_uuid')
    @authentication_required(force_authentication=True)
    @authorization_required('view_query_form', 'site', None)
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
