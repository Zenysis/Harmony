from related import to_model
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableList

from data.query.models.field import Field
from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103
Base = declarative_base()


class AlertDefinition(Base):
    '''Represents an alert definition.'''

    __tablename__ = 'alert_definitions'
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    dimension_name = sa.Column(sa.String(), nullable=True)
    filters = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    fields = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    time_granularity = sa.Column(sa.String(), nullable=False)
    user_id = sa.Column(sa.Integer(), nullable=False)
    title = sa.Column(sa.String(), nullable=False)
    authorization_resource_id = sa.Column(
        sa.Integer(),
        nullable=False,
        unique=True,
    )


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for alert_definition in transaction.find_all(AlertDefinition):
            if alert_definition.title is not None:
                continue

            check_titles = []
            for check in alert_definition.checks:
                # All check types are currently threshold, so take the first field
                field_name = to_model(Field, alert_definition.fields[0]).field_name()
                check_titles.append(
                    f'{field_name} {check["operation"]} {check["threshold"]}'
                )
            title = '; '.join(check_titles)

            alert_definition.title = title
            transaction.add_or_update(alert_definition)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for alert_definition in transaction.find_all(AlertDefinition):
            check_titles = []
            for check in alert_definition.checks:
                # All check types are currently threshold, so take the first field
                field_name = to_model(Field, alert_definition.fields[0]).field_name()
                check_titles.append(
                    f'{field_name} {check["operation"]} {check["threshold"]}'
                )
            title = '; '.join(check_titles)

            # If the alert title matches the default title, then set it to null
            if alert_definition.title == title:
                alert_definition.title = None
                transaction.add_or_update(alert_definition)
