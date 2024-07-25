from flask_potion import fields

PIPELINE_CONFIG_SCHEMA = fields.Object(
    {"version": fields.Integer(attribute="id"), "config": fields.Any()}
)
