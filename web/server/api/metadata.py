from builtins import object
from flask import current_app
from flask_potion.routes import Route
from flask_potion.resource import Resource

from db.druid.metadata import DruidMetadata

# NOTE(toshi): Version of the server API that should be updated whenver a major
# update is made that could break backward API compatibility
SERVER_API_VERSION = '2019-06-03'


class MetadataResource(Resource):
    class Meta(object):
        name = 'metadata'

    # pylint: disable=E1101
    @Route.GET('/server_version', title='Get current server API version')
    # pylint: disable=R0201
    def get_server_api_ver(self):
        return SERVER_API_VERSION

    # pylint: disable=E1101
    @Route.GET('/data_sources', title='Get list of all datasources for site')
    # pylint: disable=R0201
    def get_data_sources(self):
        return {
            'datasource_list': DruidMetadata.get_datasources_for_site(
                current_app.zen_config.general.DEPLOYMENT_NAME
            ),
            'current_datasource': current_app.druid_context.current_datasource.name,
        }


RESOURCE_TYPES = [MetadataResource]
