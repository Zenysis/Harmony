import related

from flask_potion import fields

from data.query.models import GroupingDimension, GroupingGranularity
from web.server.api.query.api_models import GranularityResource
from web.server.api.query.dimension_schema import DIMENSION_SCHEMA

# The grouping item is a disjoint type that combines the Granularity and
# GroupingDimension types into a single field.

GROUPING_ITEM_SCHEMA = fields.Object(additional_properties=True)

GROUPING_DIMENSION_SCHEMA = fields.Object(
    properties={
        'dimension': DIMENSION_SCHEMA,
        'includeAll': fields.Boolean(),
        'includeNull': fields.Boolean(),
        'includeTotal': fields.Boolean(),
    }
)

GROUPING_GRANULARITY_SCHEMA = fields.Object(
    properties={
        'granularity': fields.String(description='Granularity ID'),
        'includeTotal': fields.Boolean(),
    }
)


def grouping_dimension_converter(value) -> GroupingDimension:
    '''Convert the serialized value into a full `GroupingDimension` instacne that can be
    used for querying.
    '''
    deserialized_value = GROUPING_DIMENSION_SCHEMA.converter(value)
    return related.to_model(GroupingDimension, deserialized_value)


def granularity_converter(value) -> GroupingGranularity:
    '''Convert the serialized value into the full `GroupingGranularity` instance that
    can be used for querying.
    '''
    # Need to handle the case where the frontend has not yet been refreshed after the
    # release has been pushed which migrates from Granularity to GroupingGranularity for
    # the query selections.
    # TODO(stephen): Remove this after 2021-04-01 or sometime that we feel that the
    # frontend will no longer send requests with the old granularity ref object.
    granularity_id = value.get('granularity')
    if '$ref' in value:
        granularity_id = value['$ref'].rsplit('/', 1)[-1]

    # We need the full Granularity instance since we do not know whether the granularity
    # provided is a Granularity or GranularityExtraction type since we only have the ID.
    # We can use the Potion resource to get the full type.
    instance = GranularityResource.manager.read(granularity_id)
    return related.to_model(
        GroupingGranularity,
        {'granularity': instance, 'includeTotal': value.get('includeTotal', False)},
    )


def grouping_item_converter(value):
    if 'dimension' in value:
        return grouping_dimension_converter(value)

    return granularity_converter(value)


GROUPING_ITEM_SCHEMA.converter = grouping_item_converter
