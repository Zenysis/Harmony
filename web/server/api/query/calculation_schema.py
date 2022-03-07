import related

from flask_potion import fields

from web.server.api.query.dimension_schema import DIMENSION_SCHEMA
from web.server.api.query.query_filter_schema import QUERY_FILTER_SCHEMA


# The Calculation model is polymorphic type. To handle the various concrete
# implementations of Calculation, we first create a base schema to be imported.
# We then attach a custom converter and formatter to the base schema. These
# methods use the `type` field of the model to determine which concrete schema
# implementation should be used during serialization / deserialization.
CALCULATION_SCHEMA = fields.Object(
    properties={
        'filter': fields.Raw(QUERY_FILTER_SCHEMA, nullable=True),
        'type': fields.String(),
    },
    additional_properties=True,
)

COHORT_NUMERIC_VALUE_FILTER_SCHEMA = fields.Object(
    properties={
        'lowerBound': fields.Integer(default=0),
        'lowerBoundStrict': fields.Boolean(default=True),
        'upperBound': fields.Integer(nullable=True),
        'upperBoundStrict': fields.Boolean(default=False),
    },
    nullable=True,
)

COHORT_SEGMENT_SCHEMA = fields.Object(
    properties={
        'filter': QUERY_FILTER_SCHEMA,
        'invert': fields.Boolean(default=False),
        'numericValueCohortFilter': COHORT_NUMERIC_VALUE_FILTER_SCHEMA,
    },
    # NOTE(abby): The front end serialization includes a `name` property, but removes it when
    # serializing for querying. Using additional properties to allow these types to be reused.
    additional_properties=True,
)

COHORT_GROUP_SCHEMA = fields.Object(
    properties={
        'additionalSegments': fields.Array(COHORT_SEGMENT_SCHEMA),
        'innerOperation': fields.String(default='INTERSECT'),
        'outerOperation': fields.String(default='INTERSECT'),
        'primarySegment': COHORT_SEGMENT_SCHEMA,
    }
)

COHORT_CALCULATION_SCHEMA = fields.Object(
    properties={
        'cohorts': fields.Array(
            fields.Object(
                properties={'cohortGroups': fields.Array(COHORT_GROUP_SCHEMA)}
            )
        ),
        'dimension': DIMENSION_SCHEMA,
        'filter': QUERY_FILTER_SCHEMA,
        'type': fields.String(default='COHORT'),
    }
)

CONSTITUENT_SCHEMA = fields.Object(
    properties={'calculation': CALCULATION_SCHEMA, 'id': fields.String()},
    # NOTE(abby): The front end serialization includes a `name` property, but removes it when
    # serializing for querying. Using additional properties to allow these types to be reused.
    additional_properties=True,
)

CALCULATION_IMPL_SCHEMAS = {
    'SUM': fields.Object(
        properties={'type': fields.String(default='SUM'), 'filter': QUERY_FILTER_SCHEMA}
    ),
    'COUNT': fields.Object(
        properties={
            'type': fields.String(default='COUNT'),
            'filter': QUERY_FILTER_SCHEMA,
        }
    ),
    'MIN': fields.Object(
        properties={'type': fields.String(default='MIN'), 'filter': QUERY_FILTER_SCHEMA}
    ),
    'MAX': fields.Object(
        properties={'type': fields.String(default='MAX'), 'filter': QUERY_FILTER_SCHEMA}
    ),
    'AVG': fields.Object(
        properties={'type': fields.String(default='AVG'), 'filter': QUERY_FILTER_SCHEMA}
    ),
    'COUNT_DISTINCT': fields.Object(
        properties={
            'type': fields.String(default='COUNT_DISTINCT'),
            'dimension': DIMENSION_SCHEMA,
            'filter': QUERY_FILTER_SCHEMA,
        },
        nullable=True,
    ),
    'COHORT': COHORT_CALCULATION_SCHEMA,
    'WINDOW': fields.Object(
        properties={
            'type': fields.String(default='WINDOW'),
            'operation': fields.Custom(
                fields.String(default='sum').schema(), default='sum'
            ),
            'size': fields.Integer(default=7),
            'filter': QUERY_FILTER_SCHEMA,
        }
    ),
    'LAST_VALUE': fields.Object(
        properties={
            'type': fields.String(default='LAST_VALUE'),
            'operation': fields.Custom(
                fields.String(default='sum').schema(), default='sum'
            ),
            'filter': QUERY_FILTER_SCHEMA,
        }
    ),
    'AVERAGE_OVER_TIME': fields.Object(
        properties={
            'type': fields.String(default='AVERAGE_OVER_TIME'),
            'filter': QUERY_FILTER_SCHEMA,
        }
    ),
    'FORMULA': fields.Object(
        properties={
            'type': fields.String(default='FORMULA'),
            'constituents': fields.Array(CONSTITUENT_SCHEMA),
            'expression': fields.String(),
            'filter': QUERY_FILTER_SCHEMA,
        }
    ),
    'COMPLEX': fields.Object(
        properties={
            'type': fields.String(default='COMPLEX'),
            'calculation_id': fields.String(),
            'filter': QUERY_FILTER_SCHEMA,
        }
    ),
}


def get_calculation_schema(value):
    if not value:
        return None

    if isinstance(value, dict):
        return CALCULATION_IMPL_SCHEMAS[value['type']] if 'type' in value else None

    return CALCULATION_IMPL_SCHEMAS[value.type]


def calculation_converter(value):
    schema = get_calculation_schema(value)
    return schema.converter(value) if schema else None


def calculation_formatter(value):
    schema = get_calculation_schema(value)
    return schema.formatter(related.to_dict(value)) if schema else None


CALCULATION_SCHEMA.converter = calculation_converter
CALCULATION_SCHEMA.formatter = calculation_formatter
