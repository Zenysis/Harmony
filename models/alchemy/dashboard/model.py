'''SQLAlchemy models for dashboard related data
'''
import sqlalchemy as sa
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship

from models.alchemy.base import Base
from models.alchemy.mixin import LastModifiedMixin

# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103

# Pylint fails to pick up the Integer/Column/ForeignKey/relationship
# attributes that denote columns in a SQLAlchemy field.
# pylint:disable=E1101


class DashboardUserMetadata(Base):
    '''Metadata corresponding to view/update statistics for an individual
    dashboard and user.
    '''

    __tablename__ = 'dashboard_user_metadata'

    '''
    The last time when the dashboard was viewed by the user.
    '''
    last_viewed = sa.Column(
        sa.DateTime(), nullable=True, server_default=func.now(), onupdate=func.now()
    )

    '''
    The last time the dashboard was edited by the user. If the user has never
    edited the dashboard, the field will be null.
    '''
    last_edited = sa.Column(sa.DateTime(), nullable=True, server_default=None)

    '''
    The total number of times the user has viewed the dashboard.
    '''
    views_by_user = sa.Column(sa.Integer(), nullable=False, server_default='0')

    '''
    Indicates whether or not the user has marked the dashboard as favorite
    or not.
    '''
    is_favorite = sa.Column(sa.Boolean(), server_default='false', nullable=False)

    '''
    The Dashboard associated with the metadata object.
    '''
    dashboard_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('dashboard.id', ondelete='CASCADE', name='valid_dashboard'),
        primary_key=True,
        nullable=False,
    )

    '''
    The User associated with the metadata object.
    '''
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        primary_key=True,
        nullable=False,
    )

    '''
    Summarize dashboard metadata statistics for a single user and dashboard.
    '''

    @classmethod
    def summary_by_dashboard_for_user(cls, session, user_id):
        # NOTE(stephen): `*_real` columns are a workaround for bad practice in
        # the Dashboard model which stores a redundant `total_views`
        # and `last_modified` column.
        return session.query(
            cls.dashboard_id,
            func.sum(cls.views_by_user).label('total_views_real'),
            func.max(cls.last_edited).label('last_modified_real'),
            func.sum(cls.views_by_user)
            .filter(cls.user_id == user_id)
            .label('total_views_by_user'),
            func.max(cls.last_viewed)
            .filter(cls.user_id == user_id)
            .label('last_accessed_by_user'),
            func.max(cls.last_edited)
            .filter(cls.user_id == user_id)
            .label('last_modified_by_user'),
            func.max(cls.is_favorite.cast(sa.Integer))
            .filter(cls.user_id == user_id)
            .cast(sa.Boolean)
            .label('is_favorite'),
        ).group_by(cls.dashboard_id)


class Dashboard(Base, LastModifiedMixin):
    '''A class that represents a Dashboard.
    '''

    __tablename__ = 'dashboard'

    id = sa.Column(sa.Integer, primary_key=True)

    '''An optional URL slug that points directly to the UI representation
    of this dashboard.
    '''
    slug = sa.Column(sa.String(100), unique=True)

    '''A description of the dashboard.
    '''
    description = sa.Column(sa.Text(), nullable=True)

    '''The JSON representation of the dashboard specification.
    '''
    specification = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)

    '''Relationship to the resource entry (for AuthZ and Auditing purposes).
    '''
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource.id', ondelete='CASCADE', name='valid_dashboard_resource'
        ),
        nullable=False,
        unique=True,
    )

    '''Relationship to the user entry who authored the dashboard
    '''
    author_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='RESTRICT', name='valid_user'),
        nullable=False,
    )

    '''A flag that indicates whether or not this dashboard is marked as
    'official' or not.
    '''
    is_official = sa.Column(sa.Boolean(), server_default='false', nullable=False)

    '''
    The total number of times the dashboard has been viewed.
    '''
    total_views = sa.Column(sa.Integer(), nullable=False, server_default='0')

    resource = relationship('Resource', viewonly=True)
    author = relationship('User', viewonly=True)

    @hybrid_property
    def author_username(self):
        return self.author.username
