from factory import Sequence, SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.permission.tests.factories import (
    ResourceFactory,
    ResourceRoleFactory,
    RoleFactory,
)
from models.alchemy.user import User, UserAcl, UserPreferences, UserRoles, UserStatus
from web.server.tests.session import test_session


class UserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session = test_session

    username = Sequence(lambda n: 'username%d' % n)
    last_name = Sequence(lambda n: 'last %d' % n)
    first_name = Sequence(lambda n: 'first %d' % n)
    phone_number = Sequence(lambda n: '070%d' % n)


class UserRolesFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UserRoles
        sqlalchemy_session = test_session

    user = SubFactory(UserFactory)
    role = SubFactory(RoleFactory)


class UserAclFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UserAcl
        sqlalchemy_session = test_session

    user = SubFactory(UserFactory)
    resource = SubFactory(ResourceFactory)
    resource_role = SubFactory(ResourceRoleFactory)


class UserStatusFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UserStatus
        sqlalchemy_session = test_session


class UserPreferencesFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UserPreferences
        sqlalchemy_session = test_session
