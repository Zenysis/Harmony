from enum import Enum
from related import to_dict
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict, MutableList

from data.query.models import DimensionValue, DimensionValueFilterItem
from data.query.models.query_filter import SelectorFilter
from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103
Base = declarative_base()


class ResourceTypeEnum(Enum):
    SITE = 1
    DASHBOARD = 2
    USER = 3
    GROUP = 4
    ALERT = 6


class ResourceType(Base):
    __tablename__ = 'resource_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(
        sa.Enum(ResourceTypeEnum, name='resource_type_enum'),
        unique=True,
        nullable=False,
    )


class Resource(Base):
    __tablename__ = 'resource'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_resource_type',
        ),
        nullable=False,
    )
    name = sa.Column(sa.String(1000), nullable=False)
    label = sa.Column(sa.String(1000), nullable=False)


class AlertDefinition(Base):
    '''Represents an alert definition.'''

    __tablename__ = 'alert_definitions'
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()), nullable=True)
    dimension_name = sa.Column(sa.String(), nullable=True)
    filters = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    fields = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    time_granularity = sa.Column(sa.String(), nullable=True)
    user_id = sa.Column(sa.Integer(), nullable=True)
    authorization_resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_alert_resource'),
        nullable=False,
        unique=True,
    )

    dimension_values = sa.Column(ARRAY(sa.String()), nullable=True)
    field = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)


# Multiple changes happen here:
#   - field column is changed to a list as the fields column
#   - dimension_values column values are changed to DimensionValueFilterItems and moved to the
#     filters column
#   - ensuring none of the new non-nullable constraints will fail by adding default values if null
#   - mutating the existing checks to have a type THRESHOLD
def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for alert_definition in transaction.find_all(AlertDefinition):
            # Populate fields from field
            alert_definition.fields = [alert_definition.field]

            # Populate filters from dimension_values
            dimension_name = alert_definition.dimension_name
            dimension_values = alert_definition.dimension_values
            if dimension_values:
                dimension_values = [
                    DimensionValue(
                        f'{value}__{index}',
                        dimension_name,
                        SelectorFilter(dimension_name, value),
                        value,
                    )
                    for (index, value) in enumerate(dimension_values)
                ]
                filter_item = DimensionValueFilterItem(
                    f"{dimension_name}__1",
                    dimension_name,
                    dimension_values,
                )
                alert_definition.filters = [to_dict(filter_item)]
            else:
                alert_definition.filters = []

            # Check non-nullable constraints won't fail. These should already be fine, but
            # double check.
            if alert_definition.checks is None:
                alert_definition.checks = []
            if alert_definition.time_granularity is None:
                alert_definition.time_granularity = 'month'
            if alert_definition.user_id is None:
                transaction.delete(alert_definition)
                continue

            # Add threshold type to existing checks
            alert_definition.checks = [
                {**check, 'type': 'THRESHOLD'} for check in alert_definition.checks
            ]

            transaction.add_or_update(alert_definition)


# Multiple changes reverted here:
#   - first value from the fields column is used as the field column
#   - filters column values on the dimension are moved to the dimension_values column
#   - mutating the existing checks to remove the type
def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for alert_definition in transaction.find_all(AlertDefinition):
            # fields back to field
            alert_definition.field = alert_definition.fields[0]

            # filters back to dimension_values
            dimension_values = []
            for filter_item in alert_definition.filters:
                if (
                    alert_definition.dimension_name == filter_item['dimension']
                    and not filter_item['invert']
                ):
                    dimension_values.extend(
                        (
                            dimension_value['name']
                            for dimension_value in filter_item['dimensionValues']
                        )
                    )
            alert_definition.dimension_values = dimension_values

            # Remove type from checks
            checks = []
            for check in alert_definition.checks:
                checks.append(
                    {key: value for (key, value) in check.items() if key != 'type'}
                )
            alert_definition.checks = checks

            transaction.add_or_update(alert_definition)
