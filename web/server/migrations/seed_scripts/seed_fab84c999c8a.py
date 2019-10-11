# -*- coding: utf-8 -*-
from enum import Enum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict

from log import LOG
from web.server.data.data_access import Transaction
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID

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
    '''A class that defines permissions that can be assigned to a `User` or a `Group`.
    '''

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


class PublicRoles(Base):
    '''A class that represents a mapping between an 'Anonymous User' (user that is unauthenticated)
    and a `Role`. All regular Users will also receive the permissions that are assigned to
    Anonymous Users.
    '''

    __tablename__ = 'public_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
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


NEW_PERMISSIONS = (
    Permission(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='view_query_form'
    ),
)

NEW_ROLES = (
    Role(
        resource_type_id=ResourceTypeEnum.SITE.value,
        name='query_analyst',
        label=u'Query Analyst',
    ),
)

ROLE_PERMISSIONS = {'query_analyst': ['view_query_form', 'run_query']}


class ResourceType(Base):
    __tablename__ = 'resource_type'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.Enum(ResourceTypeEnum), unique=True, nullable=False)


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_new_roles(transaction)
        add_new_permissions(transaction)
        add_role_permissions(transaction)
        add_query_analyst_public_role(transaction)
        update_site_resource_name(transaction, 'website')


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        update_site_resource_name(transaction, '/')
        delete_query_analyst_public_role(transaction)
        delete_role_permissions(transaction)
        delete_new_permissions(transaction)
        delete_new_roles(transaction)


def add_new_roles(transaction):
    reset_table_sequence_id(Role, transaction)
    for role in NEW_ROLES:
        transaction.add_or_update(role, flush=True)

    LOG.debug('Added new roles')


def delete_new_roles(transaction):
    for role in NEW_ROLES:
        entity = transaction.find_one_by_fields(
            Role, True, {'name': role.name, 'resource_type_id': role.resource_type_id}
        )

        if entity:
            transaction.delete(entity)

    LOG.debug('Deleted new roles')


def add_new_permissions(transaction):
    reset_table_sequence_id(Permission, transaction)
    for permission in NEW_PERMISSIONS:
        transaction.add_or_update(permission, flush=True)
    LOG.debug('Added new permissions')


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
    LOG.debug('Deleted new permissions')


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
    LOG.debug('Added role permissions')


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
    LOG.debug('Deleted role permissions')


def update_site_resource_name(transaction, new_name):
    site_resource = transaction.find_by_id(Resource, ROOT_SITE_RESOURCE_ID)
    old_name = site_resource.name
    site_resource.name = new_name
    transaction.add_or_update(site_resource, flush=True)
    LOG.debug(
        'Successfully changed name of the root site resource from \'%s\' to \'%s\'.',
        old_name,
        new_name,
    )


def add_query_analyst_public_role(transaction):
    query_analyst_role = transaction.find_one_by_fields(
        Role, False, {'name': 'query_analyst'}
    )
    transaction.add_or_update(
        PublicRoles(role_id=query_analyst_role.id, resource_id=ROOT_SITE_RESOURCE_ID),
        flush=True,
    )
    LOG.debug('Successfully granted all users the \'query_analyst\' role.')


def delete_query_analyst_public_role(transaction):
    query_analyst_role = transaction.find_one_by_fields(
        Role, False, {'name': 'query_analyst'}
    )
    role_assignment = transaction.find_one_by_fields(
        PublicRoles,
        True,
        {'role_id': query_analyst_role.id, 'resource_id': ROOT_SITE_RESOURCE_ID},
    )
    transaction.delete(role_assignment)
    LOG.debug(
        'Successfully removed the \'query_analyst\' role assignment for all users.'
    )
