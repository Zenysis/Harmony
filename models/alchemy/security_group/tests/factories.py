from factory import Sequence, SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.permission.tests.factories import (
    ResourceFactory,
    ResourceRoleFactory,
    RoleFactory,
)
from models.alchemy.security_group import Group, GroupAcl, GroupRoles, GroupUsers
from models.alchemy.user.tests.factories import UserFactory
from web.server.tests.session import test_session


class GroupFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Group
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'group{n}')


class GroupRolesFactory(SQLAlchemyModelFactory):
    class Meta:
        model = GroupRoles
        sqlalchemy_session = test_session

    group = SubFactory(GroupFactory)
    role = SubFactory(RoleFactory)


class GroupAclFactory(SQLAlchemyModelFactory):
    class Meta:
        model = GroupAcl
        sqlalchemy_session = test_session

    group = SubFactory(GroupFactory)
    resource_role = SubFactory(ResourceRoleFactory)
    resource = SubFactory(ResourceFactory)


class GroupUserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = GroupUsers
        sqlalchemy_session = test_session

    group = SubFactory(GroupFactory)
    user = SubFactory(UserFactory)
