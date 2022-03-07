import datetime
import json

import sqlalchemy as sa
from celery import schedules
from sqlalchemy.orm import relationship

from models.alchemy.base import Base


class CrontabSchedule(Base):
    '''CrontabSchedule crontab schedule type used for executing
    a task at a particular time of day, day of the week, month or year
    '''

    __tablename__ = 'crontab_schedule'

    # pylint: disable=C0103
    # disable invalid-name id used on table
    id = sa.Column(sa.Integer(), primary_key=True)

    # This 30 represents the default minute interval on the frontend
    # We schedule reports with time options having an interval of 30 minutes.
    # i.e 00:00, 00:30, 01:00, 01:30
    minute = sa.Column(sa.String(2), default='30')
    hour = sa.Column(sa.String(2), default='*')
    day_of_week = sa.Column(sa.String(2), default='*')
    day_of_month = sa.Column(sa.String(2), default='*')
    month_of_year = sa.Column(sa.String(2), default='*')

    @property
    def schedule(self):
        '''Return celery crontab for celery beat
        '''
        return schedules.crontab(
            minute=self.minute,
            hour=self.hour,
            day_of_week=self.day_of_week,
            day_of_month=self.day_of_month,
            month_of_year=self.month_of_year,
        )

    @classmethod
    def from_schedule(cls, schedule):
        ''' Create a CrontabSchedule from celery beat schedule
        '''
        # pylint: disable=W0212
        # Need to access these protected properties
        spec = {
            'minute': schedule._orig_minute,
            'hour': schedule._orig_hour,
            'day_of_week': schedule._orig_day_of_week,
            'day_of_month': schedule._orig_day_of_month,
            'month_of_year': schedule._orig_month_of_year,
        }
        return cls(**spec)


class SchedulerEntry(Base):
    '''Model stores entries for the celery beat scheduler that
        defines the task that needs to run.

    Note(solo): Celery Schedule Entry requires queue, exchange and routing_key as options.
    We don't make use of them for our use case yet and you can read more here
    https://docs.celeryproject.org/en/stable/userguide/routing.html#exchanges-queues-and-routing-keys
    '''

    __tablename__ = 'scheduler_entry'

    # pylint: disable=C0103
    # disable invalid-name id used on table
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(255), unique=True)
    task = sa.Column(sa.String(255))

    # Crontab schedule id of the related CrontabSchedule
    crontab_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('crontab_schedule.id', ondelete='CASCADE', name='valid_crontab'),
    )

    # Positional arguments to apply to the task
    arguments = sa.Column(sa.Text(), default='[]')

    # Keyword arguments to apply to the task
    keyword_arguments = sa.Column(sa.Text(), default='{}')

    # Queue holds messages until they are consumed
    queue = sa.Column(sa.Text())

    # An exchange routes messages to one or more queues
    exchange = sa.Column(sa.Text())

    # routing_key is the key used to send the message.
    routing_key = sa.Column(sa.Text())

    # Time when the entry expires
    expires = sa.Column(sa.DateTime())

    # Defines an entry enabled to run
    enabled = sa.Column(sa.Boolean(), default=True)

    # The time and date of when this task was last scheduled.
    last_run_at = sa.Column(sa.DateTime())

    # Total number of times this task has been scheduled.
    total_run_count = sa.Column(sa.Integer(), default=0)

    # Datetime when the entry was changed
    date_changed = sa.Column(sa.DateTime())

    crontab = relationship('CrontabSchedule')

    @property
    def args(self):
        return json.loads(self.arguments)

    @args.setter
    def args(self, value):
        self.arguments = json.dumps(value)

    @property
    def kwargs(self):
        return json.loads(self.keyword_arguments)

    @kwargs.setter
    def kwargs(self, kwargs_):
        self.keyword_arguments = json.dumps(kwargs_)

    @property
    def schedule(self):
        if self.crontab:
            return self.crontab.schedule
        return None


# pylint: disable=W0613
# disbable unused arguments on _set_entry_changed_date
# arguments are passed as part of function signature though unused here
@sa.event.listens_for(SchedulerEntry, 'before_insert')
def _set_entry_changed_date(mapper, connection, target):
    target.date_changed = datetime.datetime.utcnow()
