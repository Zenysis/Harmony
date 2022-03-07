# -*- coding: utf-8 -*-
from enum import Enum
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict

from log import LOG
from . import get_session, reset_table_sequence_id
from web.server.data.data_access import Transaction

Base = declarative_base()


class ResourceTypeEnum(Enum):
    SITE = 1
    DASHBOARD = 2
    USER = 3
    GROUP = 4
    QUERY_POLICY = 5


class Resource(Base):
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


class Role(Base):
    '''A class that defines permissions that can be assigned to a `User` or a `Group`.'''

    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    label = sa.Column(sa.Unicode(255), server_default=u'')  # for display purposes
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )


class Permission(Base):
    '''A permission that is tied to a `ResourceType`'''

    __tablename__ = 'permission'

    id = sa.Column(sa.Integer(), primary_key=True)

    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )
    permission = sa.Column(sa.String(100), nullable=False)


class RolePermissions(Base):
    '''Represents a mapping between a `Role` and a `Permission`.'''

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


class User(Base):
    '''A class that represents an individual user on the site.'''

    __tablename__ = 'user'

    id = sa.Column(sa.Integer, primary_key=True)

    # User authentication information
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    password = sa.Column(sa.String(255), nullable=False, server_default='')
    reset_password_token = sa.Column(sa.String(100), nullable=False, server_default='')

    # User information
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    status_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user_status.id', ondelete='RESTRICT', name='valid_status'),
        nullable=False,
    )


class UserPreferences(Base):
    __tablename__ = 'user_preferences'

    id = sa.Column(sa.Integer, primary_key=True)

    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )

    preferences = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)


NEW_PERMISSIONS = (
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='view_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='edit_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='create_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='delete_resource'
    ),
    Permission(resource_type_id=ResourceTypeEnum.USER.value, permission='update_roles'),
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='update_default_roles'
    ),
    Permission(resource_type_id=ResourceTypeEnum.USER.value, permission='invite_user'),
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='change_password'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.USER.value, permission='reset_password'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.GROUP.value, permission='view_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.GROUP.value, permission='edit_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.GROUP.value, permission='create_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.GROUP.value, permission='delete_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.GROUP.value, permission='update_roles'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.GROUP.value, permission='update_users'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value, permission='view_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value, permission='edit_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value,
        permission='create_resource',
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value,
        permission='delete_resource',
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value, permission='use_policy'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value, permission='publish_resource'
    ),
)

NEW_ROLES = (
    Role(
        resource_type_id=ResourceTypeEnum.USER.value,
        name='user_admin',
        label=u'User Administrator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.USER.value,
        name='user_moderator',
        label=u'User Moderator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.GROUP.value,
        name='group_admin',
        label=u'Group Administrator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.GROUP.value,
        name='group_moderator',
        label=u'Group Moderator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value,
        name='query_policy_admin',
        label=u'Query Policy Administrator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.QUERY_POLICY.value,
        name='query_policy_holder',
        label=u'Query Policy Holder',
    ),
)

ROLE_PERMISSIONS = {
    'user_admin': [
        'view_resource',
        'edit_resource',
        'create_resource',
        'delete_resource',
        'update_roles',
        'invite_user',
        'reset_password',
    ],
    'user_moderator': ['invite_user', 'reset_password'],
    'group_admin': [
        'view_resource',
        'edit_resource',
        'create_resource',
        'delete_resource',
        'update_roles',
        'update_users',
    ],
    'group_moderator': ['view_resource', 'edit_resource', 'update_users'],
    'query_policy_admin': [
        'view_resource',
        'edit_resource',
        'create_resource',
        'delete_resource',
        'use_policy',
    ],
    'query_policy_holder': ['use_policy', 'view_resource'],
}


class ResourceType(Base):
    __tablename__ = 'resource_type'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.Enum(ResourceTypeEnum), unique=True, nullable=False)


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_resource_types(transaction)
        add_new_roles(transaction)
        add_new_permissions(transaction)
        add_role_permissions(transaction)
        add_user_preferences(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        assert_no_resources_of_new_type(transaction)
        delete_role_permissions(transaction)
        delete_new_permissions(transaction)
        delete_new_roles(transaction)
        delete_resource_types(transaction)
        delete_user_preferences(transaction)


def assert_no_resources_of_new_type(transaction):
    resource = transaction.find_one_by_fields(
        Resource, True, {'resource_type_id': ResourceTypeEnum.QUERY_POLICY.value}
    )

    if resource:
        raise ValueError(
            'There are one or more resource(s) of type QUERY_POLICY that still exist. '
            'Please delete them from the `resource` table before attempting to '
            'downgrade the database.'
        )


def add_resource_types(transaction):
    entity = ResourceType(
        id=ResourceTypeEnum.QUERY_POLICY.value, name=ResourceTypeEnum.QUERY_POLICY.name
    )
    transaction.add_or_update(entity, flush=True)

    LOG.debug('Added Query Policy resource type')


def delete_resource_types(transaction):
    entity = transaction.find_by_id(ResourceType, ResourceTypeEnum.QUERY_POLICY.value)

    if entity:
        transaction.delete(entity)

    LOG.debug('Deleted Query Policy resource type')


def add_new_roles(transaction):
    reset_table_sequence_id(Role, transaction)
    for role in NEW_ROLES:
        transaction.add_or_update(role, flush=True)

    LOG.debug('Added new Group, User and Query Policy Roles')


def delete_new_roles(transaction):
    for role in NEW_ROLES:
        entity = transaction.find_one_by_fields(
            Role, True, {'name': role.name, 'resource_type_id': role.resource_type_id}
        )

        if entity:
            transaction.delete(entity)

    LOG.debug('Deleted Group, User and Query Policy Roles')


def add_new_permissions(transaction):
    reset_table_sequence_id(Permission, transaction)
    for permission in NEW_PERMISSIONS:
        transaction.add_or_update(permission, flush=True)
    LOG.debug('Added Group, User and Query Policy Permissions')


def delete_new_permissions(transaction):
    for permission in NEW_PERMISSIONS:
        entity = transaction.find_one_by_fields(
            Permission,
            True,
            {
                'permission': permission.permission,
                'resource_type_id': permission.resource_type_id,
            },
        )

        if entity:
            transaction.delete(entity)
    LOG.debug('Deleted Group, User and Query Policy Permissions')


def add_role_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    for (role_name, permission_names) in list(ROLE_PERMISSIONS.items()):
        role = transaction.find_one_by_fields(Role, True, {'name': role_name})
        if not role:
            raise ValueError('Could not find role \'{name}\''.format(name=role_name))

        permissions = []

        for permission_name in permission_names:
            permission = transaction.find_one_by_fields(
                Permission,
                True,
                {
                    'permission': permission_name,
                    'resource_type_id': role.resource_type_id,
                },
            )
            if not permission:
                raise ValueError(
                    'Could not find permission \'{name}\''.format(name=permission_name)
                )
            permissions.append(permission)

        for permission in permissions:
            role_permission = RolePermissions(
                role_id=role.id, permission_id=permission.id
            )
            transaction.add_or_update(role_permission, flush=True)
    LOG.debug('Added Group, User and Query Policy Role Permissions')


def delete_role_permissions(transaction):
    for (role_name, permission_names) in list(ROLE_PERMISSIONS.items()):
        role = transaction.find_one_by_fields(Role, True, {'name': role_name})
        if not role:
            continue

        permissions = []

        for permission_name in permission_names:
            permission = transaction.find_one_by_fields(
                Permission,
                True,
                {
                    'permission': permission_name,
                    'resource_type_id': role.resource_type_id,
                },
            )
            if not permission:
                continue
            permissions.append(permission)

        for permission in permissions:
            role_permission = transaction.find_one_by_fields(
                RolePermissions,
                True,
                {'role_id': role.id, 'permission_id': permission.id},
            )

            if role_permission:
                transaction.delete(role_permission)
    LOG.debug('Deleted Group, User and Query Policy Role Permissions')


def add_user_preferences(transaction):
    users = transaction.find_all_by_fields(User, {})

    for user in users:
        user_preference = UserPreferences(user_id=user.id, preferences={})
        transaction.add_or_update(user_preference)

    LOG.debug('Added User Preference entries')


def delete_user_preferences(transaction):
    user_preferences = transaction.find_all_by_fields(UserPreferences, {})

    for preference in user_preferences:
        transaction.delete(preference)

    LOG.debug('Deleted User Preference entries')
