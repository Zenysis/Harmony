from functools import reduce
import importlib
import re
from operator import add

from flask_potion import ModelResource
from werkzeug.exceptions import BadRequest

from log import LOG
from models.alchemy.permission import Resource
from web.server.potion.managers import SQLAlchemyManager
from web.server.security.permissions import PERMISSION_DEFAULTS, principals

URI_REGEX = r'^{}/\d+$'


class ModelResourceMixin:
    def read_uri(self, uri):
        regex_pattern = URI_REGEX.format(self.route_prefix)
        if not re.match(regex_pattern, uri):
            LOG.error('URI does not match expected format. %s', uri)
            raise BadRequest

        return self.read(int(uri.split('/')[-1]))


class PrincipalResource(ModelResourceMixin, ModelResource):
    """The base class that all Flask-Potion API models should derive from."""

    class Meta:
        manager = principals(SQLAlchemyManager)
        permissions = PERMISSION_DEFAULTS

        '''The SQLAlchemy model to use that represents the Authorization Type to tie
        this particular Resource to.
        '''
        # NOTE - You should never need to change this. All our authorization checks
        # are done off of the `Resource`
        authorization_model = Resource

        '''The column on the Authorization Model that serves as the a unique
        identifier of an entry.
        '''
        authorization_model_id_attribute = 'id'

        '''The column on the type this Resource is backing which has a foreign key relationship
        with the Authorization table.
        '''
        target_model_authorization_attribute = 'resource_id'


def list_query_resource_types():
    # pylint: disable=import-outside-toplevel
    import web.server.api.query.api_models
    import web.server.api.query.query_models

    output = (
        web.server.api.query.api_models.RESOURCE_TYPES
        + web.server.api.query.query_models.RESOURCE_TYPES
    )

    # Query models are backed by an in-memory resource manager since they
    # do not use a database at the moment. Initialize those resources before
    # adding their routes.
    for resource_type in output:
        if hasattr(resource_type, 'init'):
            resource_type.init()

    return output


def list_all_resource_types():
    # NOTE: List ordering matters here
    modules = (
        importlib.import_module(f'web.server.api.{module}')
        for module in (
            'user_api_models',
            'group_api_models',
            'permission_api_models',
            'configuration_api_models',
            'dashboard_api_models',
            'alerts_api_models',
            'query_api_models',
            'share_analysis_api_models',
            'metadata',
            'user_query_session_api_models',
            'thumbnail_storage_models',
            'feed_api_models',
            'dashboard_session_api_models',
            'pipeline_runs_api_models',
            'data_upload_api_models',
            'pipeline_config_api_models',
            'api_token_models',
        )
    )

    return (
        reduce(add, (getattr(module, 'RESOURCE_TYPES') for module in modules), [])
        + list_query_resource_types()
    )
