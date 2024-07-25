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
    name = sa.Column(sa.String(50), nullable=False, server_default='', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default='')


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


VIEW_DASHBOARD_PERM_ID = 10
EDIT_DASHBOARD_PERM_ID = 11
UPDATE_DASHBOARD_USERS_PERM_ID = 12
DELETE_DASHBOARD_PERM_ID = 13
CREATE_DASHBOARD_PERM_ID = 14

PERMISSIONS_TO_REMOVE = [
    VIEW_DASHBOARD_PERM_ID,
    EDIT_DASHBOARD_PERM_ID,
    UPDATE_DASHBOARD_USERS_PERM_ID,
    DELETE_DASHBOARD_PERM_ID,
    CREATE_DASHBOARD_PERM_ID,
]

MANAGER_ROLE = Role(
    name='manager',
    label='Site Manager',
)


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        remove_dashboard_permissions(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_dashboard_permissions(transaction)


def remove_dashboard_permissions(transaction):
    role = transaction.find_one_by_fields(Role, True, {'name': 'manager'})
    for permission_id in PERMISSIONS_TO_REMOVE:
        role_permission = transaction.find_one_by_fields(
            RolePermissions,
            True,
            {'role_id': role.id, 'permission_id': permission_id},
        )

        if role_permission:
            transaction.delete(role_permission)
    LOG.debug('Deleted Role Permissions')


def add_dashboard_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    role = transaction.find_one_by_fields(Role, True, {'name': 'manager'})
    for permission_id in PERMISSIONS_TO_REMOVE:
        if not role:
            raise ValueError("Could not find role 'manager'")

        role_permission = RolePermissions(role_id=role.id, permission_id=permission_id)
        transaction.add_or_update(role_permission, flush=True)
    LOG.debug('Added Role Permissions')
