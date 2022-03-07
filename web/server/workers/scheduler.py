import datetime
import time

from celery import schedules, current_app
from celery.beat import Scheduler, ScheduleEntry
from celery.utils.time import is_naive
from sqlalchemy.orm.session import sessionmaker

from log import LOG
from models.alchemy.schedule import SchedulerEntry, CrontabSchedule

# Maximum number of seconds between checking the schedule
DEFAULT_MAX_INTERVAL = 5  # seconds

# When schedule entry is not enabled, allow a delay to renable to run
TASK_DELAY = 5.0  # seconds

# We can't use get_db_adapter().session here because Celery app is decoupled
# from the flask app and there is no SQLAlchemy database access object configured for it.
def get_db_session(engine):
    # pylint: disable=C0103
    Session = sessionmaker(bind=engine)
    session = Session()
    return session


# pylint: disable=too-many-instance-attributes
class CeleryScheduleEntry(ScheduleEntry):
    '''An entry in the celery beat scheduler that
    defines the task that needs to run, when it should run(crontab schedule)

    Arguments:
        name (str):  The task name.
        schedule (CrontabSchedule): The schedule .
        args (Tuple):  Positional arguments to apply.
        kwargs (Dict): Keyword arguments to apply..
        options (Dict): Task execution options..
        last_run_at (datetime.datetime):  The time and date of when this task was last scheduled.
        total_run_count (int): Total number of times this task has been scheduled.
        relative (bool): Time relative to when the server starts.
    '''

    # model_schedules is a tuple of tuples.
    # There are different model schedules that celery can run.
    # e.g we can create an IntervalSchedule and adding it like
    # model_schedules = (
    #     (schedules.crontab, CrontabSchedule, 'crontab'),
    #     (schedules.schedule, IntervalSchedule, 'interval'),
    # )
    model_schedules = ((schedules.crontab, CrontabSchedule, 'crontab'),)

    def __init__(self, model):

        # pylint: disable=W0231
        self.app = current_app._get_current_object()
        self.name = model.name
        self.task = model.task
        self.schedule = model.schedule
        self.args = model.args
        self.kwargs = model.kwargs
        self.options = dict(
            queue=model.queue,
            exchange=model.exchange,
            routing_key=model.routing_key,
            expires=model.expires,
        )
        self.total_run_count = model.total_run_count
        self.model = model

        if not model.last_run_at:
            model.last_run_at = datetime.datetime.utcnow()
        self.last_run_at = model.last_run_at
        if not is_naive(self.last_run_at):
            self.last_run_at = self.last_run_at.replace(tzinfo=None)

    def is_due(self):
        if not self.model.enabled:
            # When model schedule is not enabled, allow a 5 seconds delay to renable
            return False, TASK_DELAY
        return self.schedule.is_due(self.last_run_at)

    def __next__(self):
        self.model.last_run_at = datetime.datetime.utcnow()
        self.model.total_run_count += 1
        return self.__class__(self.model)

    next = __next__

    @classmethod
    def to_model_schedule(cls, schedule):
        for schedule_type, model_type, model_field in cls.model_schedules:
            schedule = schedules.maybe_schedule(schedule)
            if isinstance(schedule, schedule_type):
                model_schedule = model_type.from_schedule(schedule)
                return model_schedule, model_field
        raise ValueError('Cannot convert schedule type {0!r} to model'.format(schedule))

    @classmethod
    def from_entry(cls, name, **entry):
        # pylint: disable=W0212
        # Need to access the protected _get_current_object property
        # Query by name since name is unique for each entry
        app = current_app._get_current_object()
        session = get_db_session(app.conf.engine)
        # pylint: disable=no-member
        db_entry = session.query(SchedulerEntry).filter_by(name=name).first()
        if not db_entry:
            # create schedule entry using fields from the celery config(CELERYBEAT_SCHEDULE)
            options = entry.get('options') or {}
            fields = dict(entry)
            for skip_field in ('relative', 'options'):
                fields.pop(skip_field, None)
            schedule = fields.pop('schedule')
            model_schedule, model_field = cls.to_model_schedule(schedule)
            fields[model_field] = model_schedule
            fields['args'] = fields.get('args') or []
            fields['kwargs'] = fields.get('kwargs') or {}
            fields['queue'] = options.get('queue')
            fields['exchange'] = options.get('exchange')
            fields['routing_key'] = options.get('routing_key')
            new_entry = SchedulerEntry(**fields)
            new_entry.name = name

            session.add(new_entry)
            session.commit()
            db_entry = new_entry
        # pylint: disable=no-member
        session.close()
        return cls(db_entry)


class CeleryDatabaseScheduler(Scheduler):
    '''Database Scheduler for periodic tasks.
    This will override that default celery scheduler that uses a file.
    It reads crontab schedule entries from our Postgres database.
    '''

    Entry = CeleryScheduleEntry
    _last_entry = None
    _schedule = None
    _initial_read = False

    def __init__(self, app, **kwargs):
        # pylint: disable=no-member
        session = self.get_session()
        self._last_entry = (
            session.query(SchedulerEntry.date_changed)
            .order_by(SchedulerEntry.date_changed.desc())
            .first()
        )
        self.max_interval = DEFAULT_MAX_INTERVAL
        session.close()
        Scheduler.__init__(self, app, **kwargs)

    def get_session(self):
        '''Get a new database session
        '''
        # pylint: disable=W0212
        # Need to access the protected _get_current_object property
        app = current_app._get_current_object()
        session = get_db_session(app.conf.engine)
        return session

    def setup_schedule(self):
        self.install_default_entries(self.schedule)
        self.update_from_dict(self.app.conf.CELERYBEAT_SCHEDULE)

    def schedule_changed(self):
        session = self.get_session()
        # pylint: disable=no-member
        newest_entry = (
            session.query(SchedulerEntry.date_changed)
            .order_by(SchedulerEntry.date_changed.desc())
            .first()
        )
        session.close()
        if newest_entry and self._last_entry and newest_entry > self._last_entry:
            self._last_entry = newest_entry
            return True
        return False

    def update_from_dict(self, dict_):
        schedule = {}
        for name, entry in dict_.items():
            schedule[name] = self.Entry.from_entry(name, **entry)
        self.schedule.update(schedule)

    def tick(self):
        # pylint: disable=W0221
        # tick takes default values for other parameters
        Scheduler.tick(self)
        if self.should_sync():
            self.sync()
        return DEFAULT_MAX_INTERVAL

    def should_sync(self):
        sync_reason_time = (time.time() - self._last_sync) > self.sync_every
        sync_reason_task_count = (
            self.sync_every_tasks and self._tasks_since_sync >= self.sync_every_tasks
        )
        is_reason_time_or_count = sync_reason_time or sync_reason_task_count
        return is_reason_time_or_count

    def sync(self):
        session = self.get_session()
        self._last_sync = time.time()
        schedule = {}
        # pylint: disable=no-member
        query = session.query(SchedulerEntry).filter_by(enabled=True)
        for row in query:
            schedule[row.name] = CeleryScheduleEntry(row)
        # pylint: disable=no-member
        session.close()
        self._schedule = schedule

    @property
    def schedule(self):
        update = False
        if not self._initial_read:
            LOG.info('CeleryDatabaseScheduler: schedule initial read')
            update = True
            self._initial_read = True
        elif self.schedule_changed():
            LOG.info('CeleryDatabaseScheduler: Schedule changed.')
            update = True

        if update:
            self.sync()
        return self._schedule
