from factory import Sequence, SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.permission import (
    Permission,
    Resource,
    ResourceRole,
    ResourceType,
    ResourceRolePermission,
    Role,
    SitewideResourceAcl,
)
from web.server.tests.session import test_session


class ResourceTypeFactory(SQLAlchemyModelFactory):
    class Meta:
        model = ResourceType
        sqlalchemy_session = test_session

    name = Sequence(lambda n: n)


class ResourceFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Resource
        sqlalchemy_session = test_session

    resource_type = SubFactory(ResourceTypeFactory)
    name = Sequence(lambda n: 'resource%d' % n)
    label = Sequence(lambda n: 'resource label %d' % n)


class PermissionFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Permission
        sqlalchemy_session = test_session

    resource_type = SubFactory(ResourceTypeFactory)
    permission = Sequence(lambda n: 'permission%d' % n)


class ResourceRoleFactory(SQLAlchemyModelFactory):
    class Meta:
        model = ResourceRole
        sqlalchemy_session = test_session

    resource_type = SubFactory(ResourceTypeFactory)


class ResourceRolePermissionFactory(SQLAlchemyModelFactory):
    class Meta:
        model = ResourceRolePermission
        sqlalchemy_session = test_session

    permission = SubFactory(PermissionFactory)


class RoleFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Role
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'role{n}')
    label = Sequence(lambda n: f'role label {n}')


class SitewideResourceAclFactory(SQLAlchemyModelFactory):
    class Meta:
        model = SitewideResourceAcl
        sqlalchemy_session = test_session

    resource = SubFactory(ResourceFactory)
    registered_resource_role = SubFactory(ResourceRoleFactory)
    unregistered_resource_role = SubFactory(ResourceRoleFactory)
