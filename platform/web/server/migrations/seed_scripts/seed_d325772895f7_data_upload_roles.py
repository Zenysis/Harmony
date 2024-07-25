from enum import Enum

import sqlalchemy as sa

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict

from log import LOG
from web.server.data.data_access import Transaction
from web.server.migrations.seed_scripts import reset_table_sequence_id, get_session

Base = declarative_base()


class ResourceTypeEnum(Enum):
    SITE = 1
    DASHBOARD = 2
    USER = 3
    GROUP = 4
    QUERY_POLICY = 5
    ROLE = 7


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


NEW_ROLES = [
    Role(name='data_upload_admin', label='Data Upload Administrator'),
    Role(name='data_catalog_viewer', label='Data Catalog Viewer'),
    Role(name='field_setup_viewer', label='Field Setup Viewer'),
]


NEW_PERMISSIONS = [
    'can_view_data_catalog',
    'can_view_fields_setup',
    'selfserve_source_admin',
]

ROLE_PERMISSIONS = {
    'data_upload_admin': ['selfserve_source_admin', 'can_upload_data'],
    'data_catalog_viewer': ['can_view_data_catalog'],
    'field_setup_viewer': ['can_view_fields_setup'],
}


def add_new_permissions(transaction):
    reset_table_sequence_id(Permission, transaction)
    for permission in NEW_PERMISSIONS:
        perm = Permission(
            resource_type_id=ResourceTypeEnum.SITE.value, permission=permission
        )
        transaction.add_or_update(perm, flush=True)
    LOG.debug("Added new permissions")


def delete_new_permissions(transaction):
    for permission in NEW_PERMISSIONS:
        perm = transaction.find_one_by_fields(
            Permission,
            True,
            {'resource_type_id': ResourceTypeEnum.SITE.value, 'permission': permission},
        )
        if perm:
            transaction.delete(perm)
    LOG.debug('Deleted new permissions')


def add_new_roles(transaction):
    reset_table_sequence_id(Role, transaction)
    for role in NEW_ROLES:
        transaction.add_or_update(role)
    LOG.debug("Added new roles")


def delete_new_roles(transaction):
    for role in NEW_ROLES:
        entity = transaction.find_one_by_fields(Role, True, {'name': role.name})
        if entity:
            transaction.delete(entity)
    LOG.debug("Deleted new roles")


def rename_data_uploader_role(transaction):
    data_uploader = transaction.find_one_by_fields(
        Role, True, {'name': 'data_uploader_f193e47caa08'}
    )
    if data_uploader:
        data_uploader.label = 'Data Upload Editor'
        data_upload_editor = data_uploader
        transaction.add_or_update(data_upload_editor)

    LOG.debug("Renamed Data Uploader Role")


def undo_rename_data_uploader_role(transaction):
    data_upload_editor = transaction.find_one_by_fields(
        Role, True, {'name': 'data_uploader_f193e47caa08'}
    )
    if data_upload_editor:
        data_upload_editor.label = 'Data Uploader'
        transaction.add_or_update(data_upload_editor)

    LOG.debug("Renamed Data Uploader Role")


def add_role_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    for (role_name, permission_names) in ROLE_PERMISSIONS.items():
        role = transaction.find_one_by_fields(Role, True, {'name': role_name})
        if not role:
            raise ValueError(f"Could not find role '{role_name}'")

        permissions = []

        for permission_name in permission_names:
            permission = transaction.find_one_by_fields(
                Permission,
                True,
                {
                    'permission': permission_name,
                    'resource_type_id': ResourceTypeEnum.SITE.value,
                },
            )
            if not permission:
                raise ValueError(f'Could not find permission "{permission_name}"')
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
                    'resource_type_id': ResourceTypeEnum.SITE.value,
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


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_new_permissions(transaction)
        add_new_roles(transaction)
        add_role_permissions(transaction)
        rename_data_uploader_role(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        undo_rename_data_uploader_role(transaction)
        delete_role_permissions(transaction)
        delete_new_roles(transaction)
        delete_new_permissions(transaction)
