from flask_potion import fields
from flask_potion.routes import Route

from models.alchemy.data_upload.model import SourceConfig
from web.server.api.api_models import PrincipalResource
from web.server.api.pipeline_config_api_schema import PIPELINE_CONFIG_SCHEMA
from web.server.routes.views.pipeline_config import get_latest_config_by_source_id


class SourceConfigResource(PrincipalResource):
    class Meta:
        model = SourceConfig
        exclude = ['id']

    class Schema:
        config = fields.Any()
        source = fields.Integer(attribute='source_id')

    @Route.GET(
        '/source/<source_id>',
        title='Get latest active config for the source',
        description='Get latest active config for the source',
        response_schema=PIPELINE_CONFIG_SCHEMA,
    )
    def get_config_by_source(self, source_id: int):
        '''Fetch the latest configuration for this source

        Args
        ------
        source_id: int - The ID for the source
        '''
        return get_latest_config_by_source_id(source_id)


RESOURCE_TYPES = [SourceConfigResource]
