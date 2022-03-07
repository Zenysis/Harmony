'''SQLAlchemy models for dashboard related data
'''
from enum import Enum
from uuid import uuid4
import json
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import relationship
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict

from models.alchemy.base import Base
from models.alchemy.mixin import LastModifiedMixin

if TYPE_CHECKING:
    from models.alchemy.user import User
    from models.alchemy.permission import Resource
    from models.alchemy.security_group import Group

# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103

# Pylint fails to pick up the Integer/Column/ForeignKey/relationship
# attributes that denote columns in a SQLAlchemy field.
# pylint:disable=E1101

SEND_DASHBOARD_REPORT_TASK_NAME = 'send_dashboard_report_task'


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
    '''A class that represents a Dashboard.'''

    __tablename__ = 'dashboard'

    id = sa.Column(sa.Integer, primary_key=True)

    '''An optional URL slug that points directly to the UI representation
    of this dashboard.
    '''
    slug = sa.Column(sa.String(1000), unique=True)

    '''A description of the dashboard.
    '''
    description = sa.Column(sa.Text(), nullable=True)

    '''The JSON representation of the dashboard specification.
    '''
    specification = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)

    '''The JSON representation of the legacydashboard specification.

    TODO(stephen): Drop this column when users are no longer able to view the legacy
    dashboard.
    '''
    legacy_specification = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)

    '''Relationship to the resource entry (for AuthZ and Auditing purposes).
    '''
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource.id',
            ondelete='CASCADE',
            onupdate='CASCADE',
            name='valid_dashboard_resource',
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


class ScheduleCadenceEnum(Enum):
    '''An enumeration of possible DashboardReportSchedule cadence'''

    DAILY = 1
    WEEKLY = 2
    MONTHLY = 3
    YEARLY = 4


class DashboardReportSchedule(Base):
    '''A class that represents a dashboard report schedule table.
    It stores schedule information taken from the front end
    '''

    __tablename__ = 'dashboard_report_schedule'

    id = sa.Column(sa.Integer, primary_key=True)

    # The dashboard id of the associated dashboard
    dashboard_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'dashboard.id', ondelete='CASCADE', name='valid_dashboard_report_schedule'
        ),
        nullable=False,
    )

    # The scheduler entry id of the associated scheduler entry
    scheduler_entry_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'scheduler_entry.id', ondelete='CASCADE', name='valid_scheduler_entry'
        ),
        nullable=False,
    )

    # The user id of the associated owner/creator of the report
    owner_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='RESTRICT', name='valid_owner'),
        nullable=False,
    )

    # Cadence is the kind of schedule i.e Yearly, Monthly, Weekly or Daily that shows
    # how often to run this report
    cadence = sa.Column(
        sa.Enum(ScheduleCadenceEnum, name='schedule_cadence_enum'), nullable=False
    )

    # Number of days offset from the first day of the week or month depending on report cadence
    day_offset = sa.Column(sa.Integer(), nullable=True)

    # Month of the year (1-12) when yearly reports run/creation is triggered
    month = sa.Column(sa.String(), nullable=True)

    # Time in 24-hour when the report runs/creation is triggered e.g 01:30
    time_of_day = sa.Column(sa.String())

    # Email recipients to send the report to
    recipients = sa.Column(ARRAY(sa.String), nullable=False)

    # Email subject for the report
    subject = sa.Column(sa.String(100), nullable=False)

    # Email message to be sent with the report
    message = sa.Column(sa.Text(), nullable=False)

    # Check whether to attach dashboard as a PDF or not
    should_attach_pdf = sa.Column(sa.Boolean(), default=False)

    # Check whether to attach dashboard as a JPEG or not
    should_embed_image = sa.Column(sa.Boolean(), default=False)

    # Check to use a single email thread instead of sending multiple emails
    use_single_email_thread = sa.Column(
        sa.Boolean(), default=False, server_default='FALSE', nullable=False
    )

    # Check to respect user permissions
    use_recipient_query_policy = sa.Column(
        sa.Boolean(), default=True, server_default='TRUE', nullable=False
    )

    owner = relationship('User', viewonly=True)
    dashboard = relationship('Dashboard', viewonly=True)
    user_groups = relationship(
        'Group', secondary='dashboard_report_groups', viewonly=False
    )

    @hybrid_property
    def owner_username(self):
        '''Get report owner username i.e email
        To be used for notifying user when the report goes out
        '''
        return self.owner.username

    @hybrid_property
    def owner_name(self):
        '''Get report owner name
        To be displayed to show who created the report.
        '''
        return f'{self.owner.first_name} {self.owner.last_name}'

    def set_attrs(self, request_obj):
        '''Sets attributes on report schedule

        Args:
        report_schedule (DashboardReportSchedule): A dashboard report schedule object.
        request_obj(dict): Request body
        '''

        request_body = request_obj.copy()
        omitted_fields = set(['owner_username', 'owner_name', 'user_groups'])
        for name, value in request_body.items():
            if name not in omitted_fields and hasattr(self, name):
                setattr(self, name, value)

    @classmethod
    def set_report_groups(cls, transaction, user_groups, report):
        if not user_groups:
            transaction.run_raw().query(DashboardReportGroup).filter(
                DashboardReportGroup.dashboard_report_id == report.id
            ).delete(synchronize_session=False)
            return
        transaction.run_raw().bulk_insert_mappings(
            DashboardReportGroup,
            [
                {'group_id': grp.id, 'dashboard_report_id': report.id}
                for grp in user_groups
            ],
        )

    @classmethod
    def set_schedule_entry(cls, entry, request_obj, dashboard, user, user_group_emails):
        '''Sets attributes on a SchedulerEntry object

        Args:
        entry (SchedulerEntry): A scheduler entry object.
        request_obj(dict): Request body
        '''

        # pylint: disable=import-outside-toplevel
        # Importing CrontabSchedule here to avoid import errors when done from
        # the top level
        from flask import url_for
        from models.alchemy.schedule import CrontabSchedule

        cadence = request_obj.get('cadence')
        month = request_obj.get('month')
        day_offset = request_obj.get('day_offset')
        time_of_day = request_obj.get('time_of_day')
        request_obj.pop('user_groups')

        # make the name unique
        name = (
            f'{dashboard.slug}-{cadence}-{day_offset}-{time_of_day}-{uuid4().hex[:6]}'
        )
        request_args = request_obj.copy()
        dashboard_url = url_for(
            'dashboard.grid_dashboard', name=dashboard.slug, _external=True
        )
        request_args.update(
            {
                'dashboard_resource_id': dashboard.resource_id,
                'sender': user.username,
                'dashboard_url': dashboard_url,
                'user_group_recipients': user_group_emails,
            }
        )

        if not entry.name:
            entry.name = name
        entry.task = SEND_DASHBOARD_REPORT_TASK_NAME
        entry.arguments = '[]'
        entry.keyword_arguments = json.dumps(request_args)

        hour, minute = time_of_day.split(':')
        if not entry.crontab:
            crontab = CrontabSchedule(hour=hour, minute=minute, month_of_year=month)
            entry.crontab = crontab
        else:
            # pylint: disable=W0201
            # Disable declared attribute defined outside __init__
            entry.crontab.hour = hour
            entry.crontab.minute = minute
            # pylint: disable=W0201
            entry.crontab.month = month

        if cadence == ScheduleCadenceEnum.MONTHLY.name:
            entry.crontab.day_of_month = day_offset
        elif cadence == ScheduleCadenceEnum.WEEKLY.name:
            entry.crontab.day_of_week = day_offset


class DashboardSession(Base):
    '''Represents any data that's associated with a session for a particular
    dashboard and uuid.
    '''

    __tablename__ = 'dashboard_session'
    uuid = sa.Column(sa.String(), primary_key=True)
    dashboard_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('dashboard.id', name='valid_dashboard', ondelete='CASCADE'),
        nullable=False,
    )
    data_blob = sa.Column(JSONB())


class DashboardReportGroup(Base):
    '''A class that represents a mapping between a `DashboardReportSchedule` and a `Group`.'''

    __tablename__ = 'dashboard_report_groups'

    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'security_group.id',
            ondelete='CASCADE',
            name='valid_security_group_dashboard_report',
        ),
        nullable=False,
    )
    dashboard_report_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'dashboard_report_schedule.id',
            ondelete='CASCADE',
            name='valid_dashboard_report_group',
        ),
        nullable=False,
    )

    group = relationship('Group', viewonly=True)
    dashboard_report = relationship('DashboardReportSchedule', viewonly=True)
