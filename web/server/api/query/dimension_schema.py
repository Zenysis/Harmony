from flask_potion import fields

# This schema is used to support the transition of calculations, query filters,
# and grouping dimension from referencing dimension objects to only holding the
# dimension id. The backend is updated to support dimension ids but the frontend
# may still send requests with the old dimension format {'$ref': 'ProvinceName'}.
# This supports both the old format (ref object) and new format (dimension id string)
# and returns the dimension id string.
# TODO(yitian): Remove after 12/2020 or sometime we feel that the frontend is no
# longer sending requests with the old dimension ref object.
DIMENSION_SCHEMA = fields.String(description='Dimension id')


def get_dimension_schema(serialized_value):
    if isinstance(serialized_value, str):
        return serialized_value
    return serialized_value['$ref'].rsplit('/', 1)[-1]


DIMENSION_SCHEMA.convert = get_dimension_schema
