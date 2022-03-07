import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import relationship

from log import LOG
from models.alchemy.base import Base
from web.server.data.data_access import Transaction
from . import get_session

Base = declarative_base()


class AlertDefinition(Base):
    '''Represents an alert definition.
    '''

    __tablename__ = 'alert_definitions'
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()))
    dimension_name = sa.Column(sa.String())
    field_id = sa.Column(sa.String())
    time_granularity = sa.Column(sa.String())
    user_id = sa.Column(sa.Integer())
    alert_notification = relationship('AlertNotification', viewonly=True)
    authorization_resource_id = sa.Column(sa.Integer())


class AlertNotification(Base):
    '''Represents an alert notification.
    '''

    __tablename__ = 'alert_notifications'
    id = sa.Column(sa.Integer(), primary_key=True)
    alert_definition_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('alert_definitions.id', ondelete='CASCADE'),
        name='alert_definition_id',
    )
    # Object representing dimension values that triggered this notification
    dimension_info = sa.Column(JSONB())
    dimension_val = sa.Column(sa.String())
    generation_date = sa.Column(sa.String())
    message = sa.Column(sa.String())
    reported_val = sa.Column(sa.String())
    query_interval = sa.Column(sa.String())

    alert_definition = relationship('AlertDefinition')


def upvert_data(alembic_operation):
    # Go through all AlertNotifications, convert `dimension_val` to `dimension_info`
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for notification in transaction.find_all_by_fields(AlertNotification, {}):
            dimension_name = notification.alert_definition.dimension_name
            notification.dimension_info = {
                dimension_name: {
                    'dimension_name': dimension_name,
                    'dimension_val': notification.dimension_val,
                }
            }
            transaction.add_or_update(notification, flush=True)


def downvert_data(alembic_operation):
    # Go through all AlertNotifications, pull out appropriate dimension val from
    # dimension_info
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for notification in transaction.find_all_by_fields(AlertNotification, {}):
            dimension_name = notification.alert_definition.dimension_name
            extracted_dimension_obj = notification.dimension_info.get(
                dimension_name, {}
            )
            if not extracted_dimension_obj:
                LOG.warning(
                    'No associated dimension found for notification_id: %s',
                    notification.id,
                )

            notification.dimension_val = extracted_dimension_obj.get('dimension_name')
