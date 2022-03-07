from factory import SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.schedule import CrontabSchedule, SchedulerEntry
from web.server.tests.session import test_session


class CrontabScheduleFactory(SQLAlchemyModelFactory):
    class Meta:
        model = CrontabSchedule
        sqlalchemy_session = test_session


class SchedulerEntryFactory(SQLAlchemyModelFactory):
    class Meta:
        model = SchedulerEntry
        sqlalchemy_session = test_session

    crontab = SubFactory(CrontabScheduleFactory)
