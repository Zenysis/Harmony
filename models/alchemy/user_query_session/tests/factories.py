from factory import SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.user.tests.factories import UserFactory
from models.alchemy.user_query_session import UserQuerySession
from web.server.tests.session import test_session


class UserQuerySessionFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UserQuerySession
        sqlalchemy_session = test_session

    user = SubFactory(UserFactory)
