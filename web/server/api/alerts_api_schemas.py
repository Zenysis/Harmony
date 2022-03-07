import operator
from related import to_model

from flask_potion import fields
from flask_potion.schema import FieldSet

from data.query.models.field import Field
from web.server.api.query.calculation_schema import CALCULATION_SCHEMA


# NOTE(toshi): Required for APIs that take in objects as dicts, in which case
# potion does not convert attribute names. Move this to a common location if
# required across multiple API endpoints.
def convert_attribute_names(resource, obj_dict):
    '''Converts the attributes of a JSON representation of an object from the
    schema names to their SQLAlchemy counterparts.
    '''
    return {
        resource.schema.fields[attribute_name].attribute: value
        for attribute_name, value in list(obj_dict.items())
    }


FIELD_PROPERTIES = {
    'id': fields.String(),
    'calculation': CALCULATION_SCHEMA,
    'canonicalName': fields.String(),
    'shortName': fields.String(),
    'userDefinedLabel': fields.String(),
}

# NOTE(toshi): This is really referring to the authorization id, may
# want to change this in the future
ALERT_DEFINITION = fields.ToOne(
    'web.server.api.alerts_api_models.AlertDefinitionResource',
    attribute='alert_definition',
    default='',
)
DIMENSION_NAME = fields.Custom(
    fields.String(),
    attribute='alert_definition',
    formatter=operator.attrgetter('dimension_name'),
    io='r',
    default='',
)
DIMENSION_INFO = fields.Any(attribute='dimension_info', default={})
FIELD_NAMES = fields.Custom(
    fields.Array(fields.String()),
    attribute='alert_definition',
    formatter=lambda alert_def: [
        to_model(Field, field).field_name() for field in alert_def.fields
    ],
    io='r',
)
TIME_GRANULARITY = fields.Custom(
    fields.String(),
    attribute='alert_definition',
    formatter=operator.attrgetter('time_granularity'),
    io='r',
)
TITLE = fields.Custom(
    fields.String(),
    attribute='alert_definition',
    formatter=operator.attrgetter('title'),
    io='r',
)
GENERATION_DATE = fields.String(attribute='generation_date', default='')
QUERY_INTERVAL = fields.String(attribute='query_interval', default='')
REPORTED_VAL = fields.String(attribute='reported_val', default='')
COMPARED_VAL = fields.String(attribute='compared_val', nullable=True)
CHECKS = fields.Custom(
    fields.List(fields.Object()),
    attribute="alert_definition",
    formatter=operator.attrgetter('checks'),
    io='r',
)
PATCH_NOTIFICATION_SCHEMA = FieldSet(
    {
        '$uri': fields.String(),
        'alertDefinition': ALERT_DEFINITION,
        'dimensionInfo': DIMENSION_INFO,
        'generationDate': GENERATION_DATE,
        'reportedVal': REPORTED_VAL,
        'comparedVal': COMPARED_VAL,
        'queryInterval': QUERY_INTERVAL,
    },
    required_fields=('$uri',),
)
