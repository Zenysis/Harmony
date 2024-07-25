# pylint: disable=C0103
from enum import Enum

import datetime
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from models.alchemy.base import Base

FEED_UPDATE_TABLE_NAME = 'feed_update'
FEED_UPDATE_TYPE_TABLE_NAME = 'feed_update_type'


class FeedUpdateTypeEnum(Enum):
    '''An internal representation of the various feed update types. They are
    defined here for convenience.
    '''

    # Indicates new field ids.
    NEW_FIELD_IDS = 1

    # Indicates deleted field ids.
    DELETED_FIELD_IDS = 2

    # Indicates dashboard updates of existing dashboards with visualizations
    # using fields that have been updated. Updates are grouped by day.
    DASHBOARD_DATA_UPDATE = 3

    # Notification that an AQT analysis has been shared
    ANALYSIS_SHARED = 4

    # Notification that a dashboard has been shared
    DASHBOARD_SHARED = 5

    # Notification that new users and groups have been given dashboard permissions
    DASHBOARD_PERMISSIONS = 6


class FeedUpdateType(Base):
    '''Represents all feed update types.'''

    __tablename__ = FEED_UPDATE_TYPE_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String())


class FeedUpdate(Base):
    '''Represents each feed update.'''

    __tablename__ = FEED_UPDATE_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    feed_update_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'feed_update_type.id', name='feed_update_type_id', ondelete='CASCADE'
        ),
    )
    notification_payload = sa.Column(JSONB())
    datasource = sa.Column(sa.String())
    generation_datetime = sa.Column(sa.DateTime(), default=datetime.datetime.utcnow)
    user_id = sa.Column(sa.Integer(), nullable=True)

    feed_update_type = relationship('FeedUpdateType')
