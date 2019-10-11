# -*- coding: utf-8 -*-
from builtins import str
from enum import Enum
from slugify import slugify
from uuid import uuid4

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import relationship

from . import get_session, reset_table_sequence_id
from log import LOG
from web.server.data.data_access import Transaction

Base = declarative_base()


class ResourceTypeEnum(Enum):
    SITE = 1
    DASHBOARD = 2
    USER = 3
    GROUP = 4
    QUERY_POLICY = 5
    ALERT = 6


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
    permission = sa.Column(sa.String(100), nullable=False)


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


class User(Base):
    '''A class that represents an individual user on the site.
    '''

    __tablename__ = 'user'

    id = sa.Column(sa.Integer, primary_key=True)

    # User authentication information
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    password = sa.Column(sa.String(255), nullable=False, server_default='')
    reset_password_token = sa.Column(sa.String(100), nullable=False, server_default='')

    # User information
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    phone_number = sa.Column(sa.String(50), nullable=False, server_default='')
    status_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user_status.id', ondelete='RESTRICT', name='valid_status'),
        nullable=False,
    )


ALERT_DEFINITION_TABLES_NAME = 'alert_definitions'


class AlertDefinition(Base):
    '''Represents an alert definition.
    '''

    __tablename__ = ALERT_DEFINITION_TABLES_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()))
    dimension_name = sa.Column(sa.String())
    field_id = sa.Column(sa.String())
    time_granularity = sa.Column(sa.String())
    user_id = sa.Column(sa.Integer(), sa.ForeignKey('user.id', name='valid_user'))

    '''Relationship to the authorization resource entry (for AuthZ and Auditing purposes).
    '''
    authorization_resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_alert_resource'),
        nullable=False,
        unique=True,
    )
    user = relationship('User', viewonly=True)


NEW_PERMISSIONS = (
    Permission(
        resource_type_id=ResourceTypeEnum.ALERT.value, permission='view_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.ALERT.value, permission='edit_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.ALERT.value, permission='create_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.ALERT.value, permission='delete_resource'
    ),
    Permission(
        resource_type_id=ResourceTypeEnum.ALERT.value, permission='update_users'
    ),
)

NEW_ROLES = (
    Role(
        resource_type_id=ResourceTypeEnum.ALERT.value,
        name='alert_admin',
        label=u'Alert Administrator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.ALERT.value,
        name='alert_creator',
        label=u'Alert Creator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.ALERT.value,
        name='alert_editor',
        label=u'Alert Editor',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.ALERT.value,
        name='alert_viewer',
        label=u'Alert Viewer',
    ),
)

ROLE_PERMISSIONS = {
    'alert_admin': [
        'view_resource',
        'edit_resource',
        'create_resource',
        'delete_resource',
        'update_users',
    ],
    'alert_creator': ['create_resource'],
    'alert_editor': ['create_resource', 'view_resource', 'edit_resource'],
    'alert_viewer': ['view_resource'],
}


class ResourceType(Base):
    __tablename__ = 'resource_type'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(
        sa.Enum(ResourceTypeEnum, name='resource_type_enum'),
        unique=True,
        nullable=False,
    )


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_resource_types(transaction)
        add_new_roles(transaction)
        add_new_permissions(transaction)
        add_role_permissions(transaction)
        add_authorization_resource_entities(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        delete_authorization_resource_entities(transaction)
        delete_role_permissions(transaction)
        delete_new_permissions(transaction)
        delete_new_roles(transaction)
        delete_resource_types(transaction)


def add_resource_types(transaction):
    entity = ResourceType(
        id=ResourceTypeEnum.ALERT.value, name=ResourceTypeEnum.ALERT.name
    )
    transaction.add_or_update(entity, flush=True)

    LOG.debug('Added ALERT resource type')


def delete_resource_types(transaction):
    entity = transaction.find_by_id(ResourceType, ResourceTypeEnum.ALERT.value)

    if entity:
        transaction.delete(entity)

    LOG.debug('Deleted ALERT resource type')


def add_new_roles(transaction):
    reset_table_sequence_id(Role, transaction)
    for role in NEW_ROLES:
        transaction.add_or_update(role, flush=True)

    LOG.debug('Added new ALERT Roles')


def delete_new_roles(transaction):
    for role in NEW_ROLES:
        entity = transaction.find_one_by_fields(
            Role, True, {'name': role.name, 'resource_type_id': role.resource_type_id}
        )

        if entity:
            transaction.delete(entity)

    LOG.debug('Deleted ALERT Roles')


def add_new_permissions(transaction):
    reset_table_sequence_id(Permission, transaction)
    for permission in NEW_PERMISSIONS:
        transaction.add_or_update(permission, flush=True)
    LOG.debug('Added ALERT Permissions')


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
    LOG.debug('Added ALERT Permissions')


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
    LOG.debug('Added ALERT Role Permissions')


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
    LOG.debug('Deleted ALERT Role Permissions')


def construct_authorization_resource(alert_definition):
    resource = Resource()
    resource.name = slugify(str(uuid4()), separator='_')
    resource.label = compute_authorization_label(alert_definition)
    resource.resource_type_id = ResourceTypeEnum.ALERT.value
    return resource


def get_user_string(user):
    return '%s, %s (Id:%s)' % (user.last_name, user.first_name, user.username)


def compute_authorization_label(alert_definition):
    user_string = get_user_string(alert_definition.user)
    text_label = (
        'Alert on {indicator} by {time_bucket} and {granularity}. ' 'Created by {user}'
    ).format(
        indicator=alert_definition.field_id,
        time_bucket=alert_definition.time_granularity,
        granularity=alert_definition.dimension_name,
        user=user_string,
    )
    return text_label


def add_authorization_resource_entities(transaction):
    alert_definitions = transaction.find_all_by_fields(AlertDefinition, {})
    for definition in alert_definitions:
        authorization_resource = transaction.add_or_update(
            construct_authorization_resource(definition), flush=True
        )
        definition.authorization_resource_id = authorization_resource.id
        transaction.add_or_update(definition)


def delete_authorization_resource_entities(transaction):
    alert_resources = transaction.find_all_by_fields(
        Resource, {'resource_type_id': ResourceTypeEnum.ALERT.value}
    )
    for resource in alert_resources:
        transaction.delete(resource)
