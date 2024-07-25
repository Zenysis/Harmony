# pylint: disable=C0103
import functools
import operator
from collections import OrderedDict

from flask import current_app
from flask_potion import fields
from flask_potion.instances import Instances
from flask_potion.contrib.memory.manager import MemoryManager
from flask_potion.routes import Route
from sqlalchemy import select, func

from data.query.models.granularity import Granularity
from models.alchemy.query.model import DimensionValue, DruidDatasource
from web.server.api.api_models import PrincipalResource
from web.server.api.query.query_filter_schema import QUERY_FILTER_SCHEMA
from web.server.data.data_access import Transaction
from web.server.util.util import CachedRoute


def _populate_manager(manager, values):
    '''Add the provided values into the in-memory manager's item storage.'''
    # Ensure a stable sorting of items.
    if not isinstance(manager.items, OrderedDict):
        manager.items = OrderedDict(manager.items)

    for value in values:
        manager.items[value.id] = value


def _dimension_resource_populate_manager(manager, values):
    '''Add the provided values into the in-memory manager's item storage.'''
    # Ensure a stable sorting of items.
    if not isinstance(manager.items, OrderedDict):
        manager.items = OrderedDict(manager.items)

    for value in values:
        manager.items.setdefault(value.id, []).append(value)


# Use an in-memory manager since none of the query models are DB backed
# at this moment. Disable pagination because there is no good way to handle
# it on the frontend right now.
class QueryManager(MemoryManager):
    def _paginate(self, items, page, per_page):
        return super()._paginate(items, 1, 1000000)

    def instances(self, where=None, sort=None):
        items = list(self.items.values())
        if not items or not isinstance(items[0], list):
            return super().instances(where=where, sort=sort)
        items = functools.reduce(operator.iconcat, items, [])
        if where is not None:
            items = self._filter_items(items, where)
        if sort is not None:
            items = self._sort_items(items, sort)
        return items


class DimensionValueResource(PrincipalResource):
    # TODO: Add type
    filtered_dimension_values = []  # type: ignore

    class Meta:
        filters = True
        model = DimensionValue
        name = 'query/dimension_values'
        id_field_class = fields.String

    class Schema:
        id = fields.String(io='r')
        dimension = fields.String(description='Dimension id.')
        filter = QUERY_FILTER_SCHEMA
        name = fields.String(description='The human readable dimension value.')
        description = fields.String(description='Optional description.')
        subtitle = fields.String(
            description='Optional data to help differentiate this dimension '
            'value from others.'
        )

    @CachedRoute.GET(
        '/frontend_cache',
        title='Get Dimension Values to be cached in the front end',
        schema=Instances(),
        response_schema=fields.Array(fields.Inline('self')),
        cache_kwargs={
            'timeout': 0,
            'make_name': lambda name: f'{name}-{current_app.druid_context.current_db_datasource.last_modified}',
        },
    )
    # pylint: disable=W0613
    def frontend_cache(self, page, per_page, where, sort):
        '''Get Dimension Values to be cached in the front end'''
        # Some dimensions will have a very large number of values. To avoid loading too
        # much data on the frontend, exclude dimensions that have a value count larger
        # than the threshold.
        with Transaction() as transaction:
            session = transaction.run_raw()
        (datasource_id,) = (
            session.query(DruidDatasource.id)
            .filter(
                DruidDatasource.datasource
                == current_app.druid_context.current_datasource.name,
            )
            .one()
        )
        subquery = (
            select([DimensionValue.dimension])
            .where(DimensionValue.datasources.contains([datasource_id]))
            .group_by(DimensionValue.dimension)
            .having(func.count() < 3000)
        )
        return session.query(DimensionValue).filter(
            DimensionValue.datasources.contains([datasource_id]),
            DimensionValue.dimension.in_(subquery),
        )

    @Route.GET(
        '/search/<dimension_id>',
        title='Search for dimension values for a specified dimension',
        schema=Instances(),
        response_schema=fields.Array(fields.Inline('self')),
    )
    # pylint: disable=W0613
    def search(self, dimension_id, page, per_page, where, sort):
        # NOTE: Limit results to 1000 so that frontend filter select can
        # render all the items without hanging.
        results_limit = 1000
        with Transaction() as transaction:
            (datasource_id,) = (
                transaction.run_raw()
                .query(DruidDatasource.id)
                .filter(
                    DruidDatasource.datasource
                    == current_app.druid_context.current_datasource.name,
                )
                .one()
            )
        return (
            self.manager.instances(where)
            .filter(
                DimensionValue.datasources.contains([datasource_id]),
                DimensionValue.dimension == dimension_id,
            )
            .paginate(1, results_limit, results_limit)
            .items
        )


class GranularityResource(PrincipalResource):
    class Meta:
        model = Granularity
        name = 'query/granularities'
        manager = QueryManager
        id_field_class = fields.String

    class Schema:
        id = fields.String(io='r')
        name = fields.String(description='The human readable dimension value.')
        category = fields.Object(
            properties={
                'id': fields.String(),
            }
        )
        description = fields.String(description='Optional description.')

    @staticmethod
    def init():
        _populate_manager(
            GranularityResource.manager, current_app.query_data.granularities
        )


RESOURCE_TYPES = [
    DimensionValueResource,
    GranularityResource,
]
