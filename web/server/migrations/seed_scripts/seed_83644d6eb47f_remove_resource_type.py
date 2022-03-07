from enum import Enum
from collections import defaultdict

import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref

from web.server.data.data_access import Transaction
from . import get_session

# pylint: disable=C0103
Base = declarative_base()


class ResourceTypeEnum(Enum):
    '''An internal representation of the various resource types. Although they
    are defined in the database, they are also defined here for convenience.
    '''

    # A resource type that represents a website of the deployment (e.g. moh.ehdap.com)
    SITE = 1

    # A resource type that represents an individual dashboard (e.g. 'JSC Dashboard')
    DASHBOARD = 2

    # A resource type that represents an individual user on the site
    USER = 3

    # A resource type that represents a security group on the site
    GROUP = 4

    # A resource type that represents a query policy controlling how users can query the system
    # for data
    QUERY_POLICY = 5

    # A resource type that represents an alert definition and any of the notification objects
    # corresponding to the alert definition
    ALERT = 6


class Role(Base):
    '''A class that defines permissions that can be assigned to a `User` or a `Group`.
    '''

    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )
    permissions = relationship(
        'Permission',
        secondary='role_permissions',
        backref=backref('role_permissions_backref', lazy='dynamic'),
        viewonly=True,
    )
    resource_type = relationship('ResourceType', viewonly=True)


class Permission(Base):
    '''A permission that is tied to a `ResourceType`
    '''

    __tablename__ = 'permission'

    id = sa.Column(sa.Integer(), primary_key=True)

    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )

    resource_type = relationship('ResourceType', viewonly=True)
    permission = sa.Column(sa.String(100), nullable=False)


class ResourceType(Base):
    '''
    A classification for discrete resources on the site
    '''

    __tablename__ = 'resource_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(
        sa.Enum(ResourceTypeEnum, name='resource_type_enum'),
        unique=True,
        nullable=False,
    )


class RolePermissions(Base):
    '''Represents a mapping between a `Role` and a `Permission`.
    '''

    __tablename__ = 'role_permissions'

    id = sa.Column(sa.Integer(), primary_key=True)
    role_id = sa.Column(
        sa.Integer(), sa.ForeignKey('role.id', ondelete='CASCADE'), nullable=False
    )
    permission_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('permission.id', ondelete='CASCADE', name='valid_permission'),
        nullable=False,
    )
    definition = relationship('Permission', viewonly=True)


class Resource(Base):
    '''Represents a resource on the site (e.g. a Dashboard, Database, User or
    even the website itself)
    '''

    __tablename__ = 'resource'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)

    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_resource_type',
        ),
        nullable=False,
    )

    name = sa.Column(sa.String(1000), nullable=False)
    label = sa.Column(sa.String(1000), nullable=False)

    resource_type = relationship('ResourceType', viewonly=True)


class GroupRoles(Base):
    '''A class that represents a mapping between a `Role`, `Group` and `Resource`.
    '''

    __tablename__ = 'security_group_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'security_group.id', ondelete='CASCADE', name='valid_security_group'
        ),
        nullable=False,
    )
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=True,
    )
    resource = relationship('Resource', viewonly=True)
    role = relationship('Role', viewonly=True)


class Group(Base):
    '''A class that contains multiple `User`s and multiple `Role`s.
    '''

    __tablename__ = 'security_group'
    id = sa.Column(sa.Integer, primary_key=True)
    # User authentication information
    name = sa.Column(sa.String(50), nullable=False, unique=True)


class UserRoles(Base):
    '''A class that represents a mapping between a `User` and a `Role`.
    '''

    __tablename__ = 'user_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    user_id = sa.Column(sa.Integer())
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=True,
    )
    resource = relationship('Resource', viewonly=True)
    role = relationship('Role', viewonly=True)


RELEVENT_RESOURCE_TYPE_IDS = set(
    [ResourceTypeEnum.DASHBOARD.value, ResourceTypeEnum.ALERT.value]
)
ROLE_TO_PERMISSION_COUNT_MAP = {}


def build_role_permission_mapping(transaction):
    '''Builds a mapping from role_id to the number of permissions that role
    holds.
    '''
    output = {}
    for resource_type_id in RELEVENT_RESOURCE_TYPE_IDS:
        all_roles = transaction.find_all_by_fields(
            Role, {'resource_type_id': resource_type_id}
        )
        for role in all_roles:
            output[role.id] = len(role.permissions)

    return output


def role_permission_count(role):
    return ROLE_TO_PERMISSION_COUNT_MAP[role.id]


def detect_duplicate_users(transaction):
    all_user_roles = transaction.find_all_by_fields(UserRoles, {})

    # pylint:disable=C0103
    user_and_resource_to_roles_map = defaultdict(lambda: [])
    # pylint:disable=C0103
    user_resource_role_to_object_map = {}
    for user_role in all_user_roles:
        resource = user_role.resource
        if not resource or resource.resource_type_id not in RELEVENT_RESOURCE_TYPE_IDS:
            continue

        resource_id = resource.id
        user_id = user_role.user_id
        role = user_role.role

        user_resource_tuple = (user_id, resource_id)
        user_and_resource_to_roles_map[user_resource_tuple].append(role)
        user_resource_role_to_object_map[(user_id, resource_id, role.id)] = user_role
    for ((user_id, resource_id), role_id_lst) in user_and_resource_to_roles_map.items():
        if len(role_id_lst) > 1:
            sorted_roles = sorted(role_id_lst, key=role_permission_count)
            for role in sorted_roles[:-1]:
                user_role_to_delete = user_resource_role_to_object_map[
                    (user_id, resource_id, role.id)
                ]
                print(
                    f'[info] Deleting UserRole: user_id: {user_id}, '
                    f'resource_id: {resource_id}, role_id: {role.id}'
                )
                transaction.delete(user_role_to_delete)


def detect_duplicate_groups(transaction):
    all_group_roles = transaction.find_all_by_fields(GroupRoles, {})

    # pylint:disable=C0103
    group_and_resource_to_roles_map = defaultdict(lambda: [])
    # pylint:disable=C0103
    group_resource_role_to_object_map = {}
    for group_role in all_group_roles:
        resource = group_role.resource
        if not resource or resource.resource_type_id not in RELEVENT_RESOURCE_TYPE_IDS:
            continue

        resource_id = resource.id
        group_id = group_role.group_id
        role = group_role.role

        group_resource_tuple = (group_id, resource_id)
        group_and_resource_to_roles_map[group_resource_tuple].append(role)
        group_resource_role_to_object_map[(group_id, resource_id, role.id)] = group_role
    for (
        (group_id, resource_id),
        role_id_lst,
    ) in group_and_resource_to_roles_map.items():
        if len(role_id_lst) > 1:
            sorted_roles = sorted(role_id_lst, key=role_permission_count)
            for role in sorted_roles[:-1]:
                group_role_to_delete = group_resource_role_to_object_map[
                    (group_id, resource_id, role.id)
                ]
                print(
                    f'[info] Deleting GroupRole: group_id: {group_id}, '
                    f'resource_id: {resource_id}, role_id: {role.id}'
                )
                transaction.delete(group_role_to_delete)


def delete_lesser_of_multiple_roles(transaction):
    # pylint:disable=W0603
    global ROLE_TO_PERMISSION_COUNT_MAP

    ROLE_TO_PERMISSION_COUNT_MAP = build_role_permission_mapping(transaction)
    detect_duplicate_users(transaction)
    detect_duplicate_groups(transaction)


def upvert_data(alembic_operation):
    '''Script that finds instances of a users and groups that have multiple
    roles we are trying to move to restrict to one per user / group. This is a
    destructive operation.
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        delete_lesser_of_multiple_roles(transaction)
