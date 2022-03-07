from typing import List, TypedDict

from builtins import object
from flask import current_app
from flask_potion import fields
from flask_potion.routes import Route
from flask_potion.resource import Resource
from web.server.routes.views.pipeline_data_digest import (
    get_bucket_tree,
    get_mapping_files,
    get_object,
)
from db.druid.metadata import DruidMetadata

# NOTE(toshi): Version of the server API that should be updated whenver a major
# update is made that could break backward API compatibility
SERVER_API_VERSION = '2020-07-20'


class Datasources(TypedDict):
    datasource_list: List[str]
    current_datasource: str


class MetadataResource(Resource):
    class Meta:
        name = 'metadata'

    # pylint: disable=E1101
    @Route.GET('/server_version', title='Get current server API version')
    # pylint: disable=R0201
    def get_server_api_ver(self) -> str:
        return SERVER_API_VERSION

    # pylint: disable=E1101
    @Route.GET('/data_sources', title='Get list of all datasources for site')
    # pylint: disable=R0201
    def get_data_sources(self) -> Datasources:
        return {
            'datasource_list': DruidMetadata.get_datasources_for_site(
                current_app.zen_config.general.DEPLOYMENT_NAME
            ),
            'current_datasource': current_app.druid_context.current_datasource.name,
        }


class DataDigestResource(Resource):
    deployment_name = current_app.zen_config.general.DEPLOYMENT_NAME

    class Meta:
        name = 'data_digest'

    # pylint: disable=E1101
    # pylint: disable=R0201
    @Route.GET('/tree', title='Get tree of S3 digest directory')
    def get_data_digest_tree(self):
        return get_bucket_tree()

    # pylint: disable=E1101
    # pylint: disable=R0201
    @Route.GET('/canonical_mappings', title='Get canonical mapping files')
    def get_canonical_mappings(self):
        return get_mapping_files()

    # pylint: disable=E1101
    # pylint: disable=R0201
    @Route.POST('/object', title='View object by key and bucket', schema=fields.Any())
    def get_data_digest_object(self, file_key):
        return get_object(file_key)


RESOURCE_TYPES = [MetadataResource, DataDigestResource]
