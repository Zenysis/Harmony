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


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_role_resource_type(transaction)
        add_permissions_for_role_resource(transaction)
        add_role_admin_roles(transaction)
        add_role_admin_permissions(transaction)
        add_role_mod_permissions(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        delete_role_mod_permissions(transaction)
        delete_role_admin_permissions(transaction)
        delete_role_admin_roles(transaction)
        delete_permissions_for_role_resource(transaction)
        delete_role_resource_type(transaction)


def add_role_resource_type(transaction):
    reset_table_sequence_id(ResourceType, transaction)
    resource_type = ResourceType(
        id=ResourceTypeEnum.ROLE.value, name=ResourceTypeEnum.ROLE.name
    )
    transaction.add_or_update(resource_type, flush=True)


def delete_role_resource_type(transaction):
    entity = transaction.find_by_id(ResourceType, ResourceTypeEnum.ROLE.value)
    if entity:
        transaction.delete(entity)
    LOG.debug('Deleted ROLE resource type')


PERMISSIONS = ['view_resource', 'edit_resource', 'delete_resource', 'create_resource']


def add_permissions_for_role_resource(transaction):
    reset_table_sequence_id(Permission, transaction)

    for permission in PERMISSIONS:
        permission_entry = Permission(
            resource_type_id=ResourceTypeEnum.ROLE.value, permission=permission
        )
        transaction.add_or_update(permission_entry, flush=True)

    LOG.debug('Added permissions for ROLE resource type')


def delete_permissions_for_role_resource(transaction):
    for permission in PERMISSIONS:
        entity = transaction.find_one_by_fields(
            Permission,
            True,
            {'resource_type_id': ResourceTypeEnum.ROLE.value, 'permission': permission},
        )
        if entity:
            transaction.delete(entity)

    LOG.debug('Deleted permissions for ROLE resource type')


def add_role_admin_roles(transaction):
    reset_table_sequence_id(Role, transaction)
    role_mod = Role(label='Role Moderator', name='role_moderator')
    role_admin = Role(label='Role Administrator', name='role_administrator')
    transaction.add_or_update(role_admin)
    transaction.add_or_update(role_mod)

    LOG.debug("Added two new Roles")


def delete_role_admin_roles(transaction):
    role_mod = transaction.find_one_by_fields(Role, True, {'name': 'role_moderator'})
    role_admin = transaction.find_one_by_fields(
        Role, True, {'name': 'role_administrator'}
    )

    if role_mod:
        transaction.delete(role_mod)
    if role_admin:
        transaction.delete(role_admin)

    LOG.debug("Deleted two Roles")


def add_role_mod_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    role = transaction.find_one_by_fields(Role, True, {'name': 'role_moderator'})
    for permission in PERMISSIONS[:2]:
        permission_entity = transaction.find_one_by_fields(
            Permission,
            True,
            {'resource_type_id': ResourceTypeEnum.ROLE.value, 'permission': permission},
        )

        role_permission = RolePermissions(
            role_id=role.id, permission_id=permission_entity.id
        )
        transaction.add_or_update(role_permission, flush=True)
    LOG.debug("Added Role Moderator RolePermissions")


def delete_role_mod_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    role = transaction.find_one_by_fields(Role, True, {'name': 'role_moderator'})
    for permission in PERMISSIONS[:2]:
        permission_entity = transaction.find_one_by_fields(
            Permission,
            True,
            {'resource_type_id': ResourceTypeEnum.ROLE.value, 'permission': permission},
        )

        role_permission = transaction.find_one_by_fields(
            RolePermissions,
            True,
            {'role_id': role.id, 'permission_id': permission_entity.id},
        )
        if role_permission:
            transaction.delete(role_permission)
    LOG.debug("Deleted Role Moderator RolePermissions")


def add_role_admin_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    role = transaction.find_one_by_fields(Role, True, {'name': 'role_administrator'})
    for permission in PERMISSIONS:
        permission_entity = transaction.find_one_by_fields(
            Permission,
            True,
            {'resource_type_id': ResourceTypeEnum.ROLE.value, 'permission': permission},
        )

        role_permission = RolePermissions(
            role_id=role.id, permission_id=permission_entity.id
        )
        transaction.add_or_update(role_permission, flush=True)
    LOG.debug("Added Role Administrator RolePermissions")


def delete_role_admin_permissions(transaction):
    reset_table_sequence_id(RolePermissions, transaction)
    role = transaction.find_one_by_fields(Role, True, {'name': 'role_administrator'})
    for permission in PERMISSIONS:
        permission_entity = transaction.find_one_by_fields(
            Permission,
            True,
            {'resource_type_id': ResourceTypeEnum.ROLE.value, 'permission': permission},
        )

        role_permission = transaction.find_one_by_fields(
            RolePermissions,
            True,
            {'role_id': role.id, 'permission_id': permission_entity.id},
        )
        if role_permission:
            transaction.delete(role_permission)
    LOG.debug("Deleted Role Administrator RolePermissions")
