# pylint: disable=C0103
from builtins import object
from collections import OrderedDict, defaultdict

from flask import current_app
from flask_potion import fields
from flask_potion.instances import Instances
from flask_potion.contrib.memory.manager import MemoryManager
from flask_potion.routes import Route

from data.query.models import (
    Dataset,
    Dimension,
    DimensionValue,
    Field,
    FieldMetadata,
    LinkedCategory,
)
from data.query.models.granularity import Granularity
from web.server.api.api_models import PrincipalResource
from web.server.api.query.calculation_schema import CALCULATION_SCHEMA
from web.server.api.query.dimension_schema import DIMENSION_SCHEMA
from web.server.api.query.query_filter_schema import QUERY_FILTER_SCHEMA
from web.server.routes.views.case_management import (
    CASE_MANAGEMENT_PII_DIMENSIONS,
    should_allow_pii_dimension,
    should_filter_pii_dimensions,
)


def _populate_manager(manager, values):
    '''Add the provided values into the in-memory manager's item storage.'''
    # Ensure a stable sorting of items.
    if not isinstance(manager.items, OrderedDict):
        manager.items = OrderedDict(manager.items)

    for value in values:
        manager.items[value.id] = value


# Use an in-memory manager since none of the query models are DB backed
# at this moment. Disable pagination because there is no good way to handle
# it on the frontend right now.
class QueryManager(MemoryManager):
    def _paginate(self, items, page, per_page):
        return super()._paginate(items, 1, 1000000)


class CategoryResource(PrincipalResource):
    class Meta(object):
        model = LinkedCategory
        name = 'query/categories'
        manager = QueryManager
        id_field_class = fields.String

    class Schema(object):
        id = fields.String(io='r')
        name = fields.String(description='The name of the provided category.')
        description = fields.String(description='Optional description.')
        parent = fields.ToOne(
            'self',
            attribute='parent',
            description='The parent category ID of this linked category.',
        )

    @staticmethod
    def init():
        _populate_manager(
            CategoryResource.manager, current_app.query_data.linked_categories
        )


class DatasetResource(PrincipalResource):
    class Meta(object):
        model = Dataset
        name = 'query/datasets'
        manager = QueryManager
        id_field_class = fields.String

    class Schema(object):
        id = fields.String(io='r')
        name = fields.String(description='The name of the dataset.')
        description = fields.String(description='Optional description.')
        validIntervals = fields.Array(fields.String(), attribute='valid_intervals')

    @staticmethod
    def init():
        _populate_manager(DatasetResource.manager, current_app.query_data.datasets)


class DimensionResource(PrincipalResource):
    class Meta(object):
        model = Dimension
        name = 'query/dimensions'
        manager = QueryManager
        id_field_class = fields.String

    class Schema(object):
        id = fields.String(io='r')
        name = fields.String(description='The human readable dimension name.')
        category = fields.ToOne(
            CategoryResource,
            description='The category ID this dimension is located within.',
        )
        description = fields.String(description='Optional description.')

    @staticmethod
    def init():
        dimensions = current_app.query_data.dimensions
        _populate_manager(DimensionResource.manager, dimensions)
        DimensionResource.pii_filtered_dimensions = [
            dimension
            for dimension in dimensions
            if dimension.id not in CASE_MANAGEMENT_PII_DIMENSIONS
        ]

    # pylint: disable=E1101
    @Route.GET(
        '/authorized',
        title='Get Dimensions a user can view',
        schema=Instances(),
        response_schema=fields.Array(fields.Inline('self')),
    )
    # pylint: disable=R0201,W0613
    def authorized_dimensions(self, page, per_page, where, sort):
        '''Returns the dimensions that a user can access.
        '''
        return (
            DimensionResource.pii_filtered_dimensions
            if should_filter_pii_dimensions()
            else self.manager.instances()
        )


class DimensionValueResource(PrincipalResource):
    # TODO(david): Add type
    filtered_dimension_values = []  # type: ignore

    class Meta(object):
        filters = True
        model = DimensionValue
        name = 'query/dimension_values'
        manager = QueryManager
        id_field_class = fields.String

    class Schema(object):
        id = fields.String(io='r')
        dimension = DIMENSION_SCHEMA
        filter = QUERY_FILTER_SCHEMA
        name = fields.String(description='The human readable dimension value.')
        description = fields.String(description='Optional description.')
        subtitle = fields.String(
            description='Optional data to help differentiate this dimension '
            'value from others.'
        )

    @staticmethod
    def init():
        dimension_values = current_app.query_data.dimension_values
        _populate_manager(DimensionValueResource.manager, dimension_values)

        # Some dimensions will have a very large number of values. To avoid loading too
        # much data on the frontend, exclude dimensions that have a value count larger
        # than the threshold.
        dimension_value_counts = defaultdict(int)
        for dimension_value in dimension_values:
            dimension_value_counts[dimension_value.dimension] += 1

        DimensionValueResource.filtered_dimension_values = [
            dimension_value
            for dimension_value in dimension_values
            if dimension_value_counts[dimension_value.dimension] < 3000
        ]

    # pylint: disable=E1101
    @Route.GET(
        '/frontend_cache',
        title='Get Dimension Values to be cached in the front end',
        schema=Instances(),
        response_schema=fields.Array(fields.Inline('self')),
    )
    # pylint: disable=R0201,W0613
    def frontend_cache(self, page, per_page, where, sort):
        '''Get Dimension Values to be cached in the front end
        '''
        return DimensionValueResource.filtered_dimension_values

    # pylint: disable=E1101
    @Route.GET(
        '/search/<dimension_id>',
        title='Search for dimension values for a specified dimension',
        schema=Instances(),
        response_schema=fields.Array(fields.Inline('self')),
    )
    # pylint: disable=R0201,W0613
    def search(self, dimension_id, page, per_page, where, sort):
        # HACK(david): Limit results to 1000 so that frontend filter select can
        # render all the items without hanging.
        if not should_allow_pii_dimension(dimension_id):
            return []
        results_limit = 1000
        dimension_values = self.manager.instances(where)
        return [val for val in dimension_values if val.dimension == dimension_id][
            :results_limit
        ]


class FieldMetadataResource(PrincipalResource):
    class Meta:
        model = FieldMetadata
        name = 'query/field_metadata'
        manager = QueryManager
        id_field_class = fields.String

    class Schema:
        id = fields.String(io='r')
        category = fields.ToOne(
            CategoryResource, description='The category ID this field is found under.'
        )
        constituents = fields.Array(
            fields.ToOne('web.server.api.query.api_models.FieldResource')
        )
        description = fields.String(description='Optional description.')
        dimensions = fields.Array(fields.ToOne(DimensionResource))
        source = fields.ToOne(
            DatasetResource,
            description='The dataset ID that this field is reported for.',
        )

    @staticmethod
    def init():
        _populate_manager(
            FieldMetadataResource.manager, current_app.query_data.field_metadata
        )


class FieldResource(PrincipalResource):
    class Meta(object):
        model = Field
        name = 'query/fields'
        manager = QueryManager
        id_field_class = fields.String

    class Schema(object):
        id = fields.String(io='r')

        canonicalName = fields.Custom(
            fields.String(),
            attribute='canonical_name',
            description='The official name for this field.',
        )

        shortName = fields.Custom(
            fields.String(),
            attribute='short_name',
            description='A shortened name that can be used when the full '
            'canonical name is too long or unnecessary.',
        )

        calculation = CALCULATION_SCHEMA
        label = fields.String(
            description='Optional custom name for this field that should be '
            'used instead of the canonical name.'
        )

    @staticmethod
    def init():
        _populate_manager(FieldResource.manager, current_app.query_data.fields)


class GranularityResource(PrincipalResource):
    class Meta(object):
        model = Granularity
        name = 'query/granularities'
        manager = QueryManager
        id_field_class = fields.String

    class Schema(object):
        id = fields.String(io='r')
        name = fields.String(description='The human readable dimension value.')
        category = fields.ToOne(
            CategoryResource,
            description='The category ID this granularity is located within.',
        )
        description = fields.String(description='Optional description.')

    @staticmethod
    def init():
        _populate_manager(
            GranularityResource.manager, current_app.query_data.granularities
        )


RESOURCE_TYPES = [
    CategoryResource,
    DatasetResource,
    DimensionResource,
    DimensionValueResource,
    FieldResource,
    FieldMetadataResource,
    GranularityResource,
]
