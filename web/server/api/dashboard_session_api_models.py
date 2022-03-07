from flask_potion import ModelResource, fields
from flask_potion.routes import Route

from models.alchemy.dashboard import DashboardSession
from web.server.routes.views.dashboard_session import get_dashboard_session_hash


class DashboardSessionResource(ModelResource):
    '''Potion class for interacting with dashboard filters.
    '''

    class Meta:
        model = DashboardSession
        filters = {'uuid': True}

        id_attribute = 'uuid'
        id_field_class = fields.String()

    class Schema:
        uuid = fields.String(attribute='uuid', nullable=True)
        dashboardId = fields.Integer(attribute='dashboard_id')
        dataBlob = fields.Any(attribute='data_blob')

    # pylint: disable=E1101
    @Route.POST(
        '/generate_link',
        rel='generateLink',
        schema=fields.Inline('self'),
        response_schema=fields.String(),
    )
    # pylint: disable=R0201
    def generate_link(self, session_req):
        return get_dashboard_session_hash(session_req)


RESOURCE_TYPES = [DashboardSessionResource]
