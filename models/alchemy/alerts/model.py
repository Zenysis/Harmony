# pylint: disable=C0103
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import relationship

from models.alchemy.base import Base


if TYPE_CHECKING:
    from models.alchemy.user import User
    from models.alchemy.permission import Resource

ALERT_DEFINITION_TABLES_NAME = 'alert_definitions'
ALERT_NOTIFICATIONS_TABLE_NAME = 'alert_notifications'


class AlertDefinition(Base):
    '''Represents an alert definition.'''

    __tablename__ = ALERT_DEFINITION_TABLES_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    # NOTE(abby): This refers to the dimension id
    dimension_name = sa.Column(sa.String(), nullable=True)
    filters = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    fields = sa.Column(MutableList.as_mutable(JSONB()), nullable=False)
    time_granularity = sa.Column(sa.String(), nullable=False)
    user_id = sa.Column(
        sa.Integer(), sa.ForeignKey('user.id', name='valid_user'), nullable=False
    )
    title = sa.Column(sa.String(), nullable=False)

    # TODO(toshi): Is this necessary?
    alert_notification = relationship('AlertNotification', viewonly=True)
    user = relationship('User', viewonly=True)

    '''Relationship to the authorization resource entry (for AuthZ and Auditing purposes).
    '''
    authorization_resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_alert_resource'),
        nullable=False,
        unique=True,
    )
    resource = relationship('Resource', viewonly=True)

    @hybrid_property
    def author_username(self):
        return self.user.username


class AlertNotification(Base):
    '''Represents an alert notification.'''

    __tablename__ = ALERT_NOTIFICATIONS_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    # TODO(david): fix type error
    alert_definition_id = sa.Column(  # type: ignore[call-overload]
        sa.Integer(),
        sa.ForeignKey('alert_definitions.id', ondelete='CASCADE'),
        name='alert_definition_id',
    )
    # Object representing dimension values that triggered this notification. It
    # will contain as much as it can represent, so access is using .get(<name>)
    dimension_info = sa.Column(JSONB())
    generation_date = sa.Column(sa.String())
    reported_val = sa.Column(sa.String())
    compared_val = sa.Column(sa.String())
    query_interval = sa.Column(sa.String())

    alert_definition = relationship('AlertDefinition')

    @hybrid_property
    def authorization_resource_id(self):
        return self.alert_definition.authorization_resource_id
