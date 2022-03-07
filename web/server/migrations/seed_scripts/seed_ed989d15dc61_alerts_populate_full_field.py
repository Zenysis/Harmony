from related import to_dict
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import relationship

import config.aggregation as aggregation
import config.aggregation_rules as aggregation_rules
import config.calculated_indicators as calculated_indicators
import config.indicators as indicators
from data.query.mock import QueryData, build_dimensions, build_fields
from data.query.models.field import Field
from log import LOG
from scripts.data_catalog.populate_query_models_from_config import (
    build_final_calculation,
)
from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103
Base = declarative_base()


class Resource(Base):
    '''Represents a resource on the site (e.g. a Dashboard, Database, User or
    even the website itself)
    '''

    __tablename__ = 'resource'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    resource_type_id = sa.Column(sa.Integer())
    name = sa.Column(sa.String(1000), nullable=False)
    label = sa.Column(sa.String(1000), nullable=False)


class AlertDefinition(Base):
    '''Represents an alert definition.
    '''

    __tablename__ = 'alert_definitions'
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()))
    dimension_name = sa.Column(sa.String())
    dimension_values = sa.Column(ARRAY(sa.String()))
    field_id = sa.Column(sa.String())
    field = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)
    time_granularity = sa.Column(sa.String())
    user_id = sa.Column(sa.Integer())
    authorization_resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_alert_resource'),
        nullable=False,
        unique=True,
    )

    resource = relationship('Resource', viewonly=True)


# These are very similar to how the data catalog script to populate those tables works.
# Build Field objects without current_app
def build_query_data():
    # Build the query data
    query_data = QueryData()
    query_data.dimensions = build_dimensions(
        query_data.categories, aggregation.DIMENSION_CATEGORIES
    )
    dimension_id_map = {dimension.id: dimension for dimension in query_data.dimensions}
    query_data.fields = build_fields(
        query_data.datasets,
        query_data.categories,
        indicators.DATA_SOURCES,
        aggregation_rules.CALCULATIONS_FOR_FIELD,
        query_data.dimensions,
        query_data.field_metadata,
        calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS,
        {},
    )
    query_data.id_to_fields = {f.id: f for f in query_data.fields}
    return query_data.id_to_fields, dimension_id_map


def build_full_fields(fields):
    id_to_fields, dimension_id_map = build_query_data()
    field_map = {}
    for field_id in fields:
        if field_id not in field_map:
            if field_id not in id_to_fields:
                LOG.info(
                    'Alert definitions with field %s cannot be converted to a full field',
                    field_id,
                )
                continue

            field = id_to_fields[field_id]
            calculation = build_final_calculation(
                field_id, field.calculation, id_to_fields, dimension_id_map
            )
            field_map[field_id] = Field(
                id=field_id,
                calculation=calculation,
                canonical_name=field.canonical_name,
                short_name=field.short_name,
            )
    return field_map


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        # For every field in the alert_definitions database, create a full field object
        fields = transaction.find_distinct_field_values(AlertDefinition.field_id)
        field_map = build_full_fields(fields)

        # Save the field json blobs to the database
        for alert_definition in transaction.find_all(AlertDefinition):
            # NOTE(abby): this will fail for deployments with alerts that can't be converted
            if alert_definition.field_id in field_map:
                field = field_map[alert_definition.field_id]
                # Customize the field to be unique as the calculations can change
                unique_field = Field(
                    id=f'{field.id}__{alert_definition.id}',
                    calculation=field.calculation,
                    canonical_name=field.canonical_name,
                    short_name=field.short_name,
                )
                alert_definition.field = to_dict(unique_field)
                transaction.add_or_update(alert_definition)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for alert_definition in transaction.find_all(AlertDefinition):
            # Ids have been customized
            field_id = alert_definition.field['id'].split('__')[0]
            alert_definition.field_id = field_id
            transaction.add_or_update(alert_definition)
