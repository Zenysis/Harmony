import related

from flask_potion import fields

from web.server.api.query.dimension_schema import DIMENSION_SCHEMA

# The QueryFilter is a polymorphic type. To handle the various concrete
# implementations of QueryFilter, we first create a basic schema. We then attach
# our own converter and formatter to the schema instance that will allow us to
# convert and format based on the `type` field of the filter. The `type` field
# must exist in the QUERY_FILTER_IMPL_SCHEMAS for all supported filter types.
QUERY_FILTER_SCHEMA = fields.Object(
    properties={'type': fields.String()}, additional_properties=True
)

QUERY_FILTER_IMPL_SCHEMAS = {
    'AND': fields.Object(
        properties={
            'type': fields.String(default='AND'),
            'fields': fields.Array(QUERY_FILTER_SCHEMA),
        }
    ),
    'OR': fields.Object(
        properties={
            'type': fields.String(default='OR'),
            'fields': fields.Array(QUERY_FILTER_SCHEMA),
        }
    ),
    'NOT': fields.Object(
        properties={'type': fields.String(default='NOT'), 'field': QUERY_FILTER_SCHEMA}
    ),
    'IN': fields.Object(
        properties={
            'type': fields.String(default='IN'),
            'dimension': DIMENSION_SCHEMA,
            'values': fields.Array(fields.String()),
        }
    ),
    'SELECTOR': fields.Object(
        properties={
            'type': fields.String(default='SELECTOR'),
            'dimension': DIMENSION_SCHEMA,
            'value': fields.String(),
        }
    ),
    'FIELD': fields.Object(
        properties={'type': fields.String(default='FIELD'), 'fieldId': fields.String()}
    ),
    'FIELD_IN': fields.Object(
        properties={
            'type': fields.String(default='FIELD_IN'),
            'fieldIds': fields.Array(fields.String()),
        }
    ),
    'INTERVAL': fields.Object(
        properties={
            'type': fields.String(default='INTERVAL'),
            # TODO(stephen): Figure outhow to pass date format.
            'start': fields.DateString(),
            'end': fields.DateString(),
        }
    ),
}


def get_query_filter_schema(value):
    if not value:
        return None

    if isinstance(value, dict):
        return QUERY_FILTER_IMPL_SCHEMAS[value['type']] if 'type' in value else None

    return QUERY_FILTER_IMPL_SCHEMAS[value.type]


def query_filter_converter(value):
    schema = get_query_filter_schema(value)
    return schema.converter(value) if schema else None


def query_filter_formatter(value):
    schema = get_query_filter_schema(value)
    return schema.formatter(related.to_dict(value)) if schema else None


QUERY_FILTER_SCHEMA.converter = query_filter_converter
QUERY_FILTER_SCHEMA.formatter = query_filter_formatter
