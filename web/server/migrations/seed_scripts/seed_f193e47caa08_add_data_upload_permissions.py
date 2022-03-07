# -*- coding: utf-8 -*-
from enum import Enum
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict

from log import LOG
from web.server.data.data_access import Transaction

from . import get_session, reset_table_sequence_id

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
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')


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


class ResourceType(Base):
    __tablename__ = 'resource_type'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.Enum(ResourceTypeEnum), unique=True, nullable=False)


NEW_PERMISSION = Permission(
    resource_type_id=ResourceTypeEnum.SITE.value, permission='can_upload_data'
)

NEW_ROLE = Role(
    name='data_uploader_f193e47caa08',
    label=u'Data Uploader',
)

ROLE_PERMISSIONS = {'data_uploader_f193e47caa08': ['can_upload_data']}


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_data_uploader_role(transaction)
        add_data_upload_permission(transaction)
        add_role_permissions(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        delete_role_permissions(transaction)
        delete_data_upload_permission(transaction)
        delete_data_uploader_role(transaction)


def add_data_uploader_role(transaction):
    reset_table_sequence_id(Role, transaction)
    transaction.add_or_update(NEW_ROLE, flush=True)

    LOG.debug('Added new Role')


def delete_data_uploader_role(transaction):
    entity = transaction.find_one_by_fields(
        Role,
        True,
        {'name': NEW_ROLE.name},
    )

    if entity:
        transaction.delete(entity)

    LOG.debug('Deleted Roles')


def add_data_upload_permission(transaction):
    reset_table_sequence_id(Permission, transaction)
    transaction.add_or_update(NEW_PERMISSION, flush=True)
    LOG.debug('Added Permission')


def delete_data_upload_permission(transaction):
    entity = transaction.find_one_by_fields(
        Permission,
        True,
        {
            'permission': NEW_PERMISSION.permission,
            'resource_type_id': NEW_PERMISSION.resource_type_id,
        },
    )

    if entity:
        transaction.delete(entity)
    LOG.debug('Deleted Permission')


def add_role_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    for (role_name, permission_names) in ROLE_PERMISSIONS.items():
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
    LOG.debug('Added Role Permissions')


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
    LOG.debug('Deleted Role Permissions')
