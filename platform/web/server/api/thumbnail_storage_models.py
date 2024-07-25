from flask import request
from flask_potion.routes import Route
from flask_potion.resource import Resource

from models.alchemy.dashboard import Dashboard
from web.server.redis.thumbnail_storage_service import retrieve_item
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.data.data_access import Transaction


class ThumbnailStorageResource(Resource):
    class Meta:
        name = 'storage'

    @Route.GET('/retrieve', title='Retrieve value from redis.')
    def retrieve_from_storage(self):
        with Transaction() as transaction:
            key = request.args.get('key')
            dashboard = transaction.find_one_by_fields(
                Dashboard, case_sensitive=True, search_fields={'slug': key}
            )
            with AuthorizedOperation(
                'view_resource', 'dashboard', dashboard.resource_id
            ):
                return retrieve_item(key)


RESOURCE_TYPES = [ThumbnailStorageResource]
