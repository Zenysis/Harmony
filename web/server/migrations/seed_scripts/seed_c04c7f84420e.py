from enum import Enum
from sqlalchemy.ext.declarative import declarative_base

import sqlalchemy as sa

from . import get_session, reset_table_sequence_id
from web.server.data.data_access import Transaction
from log import LOG

Base = declarative_base()


class ResourceTypeEnum(Enum):
    SITE = 1
    DASHBOARD = 2


class Role(Base):
    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='CASCADE', name='valid_resource_type'
        ),
    )


# NOTE(vedant): This class has now been renamed to `RolePermissions`
# The rationale for this change was to ensure that we have consistent naming
# and to follow the pattern defined in `User`, `Role` and `UserRoles`.
# `RolePerimssions` reprsents a mapping between `Role` and `Permission`


class Permission(Base):
    '''
    Represents a mapping between a role and an actual permission.
    '''

    __tablename__ = 'permission'

    id = sa.Column(sa.Integer(), primary_key=True)
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    definition_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'permission_definition.id',
            ondelete='CASCADE',
            name='valid_permission_definition',
        ),
        nullable=False,
    )


class Resource(Base):
    '''
    Represents a resource on the site
    (e.g. a Dashboard, Database, User or even the website itself)
    '''

    __tablename__ = 'resource'

    id = sa.Column(sa.Integer(), primary_key=True)

    resource_type_id = sa.Column(
        sa.Integer(), sa.ForeignKey('resource_type.id', name='valid_resource_type')
    )

    name = sa.Column(sa.String(1000), nullable=False)
    label = sa.Column(sa.String(1000), nullable=False)


# NOTE(vedant): This class has now been renamed to `Permission`.
# The word `Definition` seemed unnecessarily verbose and was only included
# because we had a `Permission` class that has since been renamed.


class PermissionDefinition(Base):
    '''
    Defines a permission for a given resource type
    '''

    __tablename__ = 'permission_definition'

    id = sa.Column(sa.Integer(), primary_key=True)

    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource_type.id', name='valid_resource_type'),
        nullable=False,
    )
    permission = sa.Column(sa.String(100), nullable=False)


class ResourceType(Base):
    '''
    A classification for discrete resources on the site
    '''

    __tablename__ = 'resource_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(100), nullable=False)


NEW_RESOURCE_TYPES = (ResourceType(name='site'), ResourceType(name='dashboard'))

NEW_PERMISSIONS = (
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='view_user'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='edit_user'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='invite_user'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='delete_user'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='list_users'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='list_roles'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='list_resources'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='view_admin_page'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.SITE.value, permission='reset_password'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value, permission='view_dashboard'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value, permission='edit_dashboard'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value, permission='update_users'
    ),
    PermissionDefinition(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value, permission='delete_dashboard'
    ),
)

NEW_ROLES = (
    Role(
        resource_type_id=ResourceTypeEnum.SITE.value,
        name='admin',
        label=u'Site Administrator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value,
        name='dashboard_viewer',
        label=u'Dashboard Viewer',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value,
        name='dashboard_editor',
        label=u'Dashboard Editor',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.DASHBOARD.value,
        name='dashboard_admin',
        label=u'Dashboard Administrator',
    ),
    Role(
        resource_type_id=ResourceTypeEnum.SITE.value,
        name='directory_reader',
        label=u'Directory Reader',
    ),
)

NEW_RESOURCES = (
    Resource(resource_type_id=ResourceTypeEnum.SITE.value, name='/', label='Website'),
)

NEW_ROLE_PERMISSIONS = {
    'dashboard_admin': [
        'view_dashboard',
        'edit_dashboard',
        'update_users',
        'delete_dashboard',
    ],
    'dashboard_editor': ['view_dashboard', 'edit_dashboard'],
    'dashboard_viewer': ['view_dashboard'],
    'directory_reader': ['list_users', 'list_resources', 'list_roles'],
}


def add_new_roles(transaction):
    for role in NEW_ROLES:
        transaction.add_or_update(role, flush=True)

    LOG.debug('Added new roles')


def add_new_resource_types(transaction):
    for resource_type in NEW_RESOURCE_TYPES:
        transaction.add_or_update(resource_type, flush=True)

    LOG.debug('Added new resource types')


def add_new_permission_definitions(transaction):
    for permission in NEW_PERMISSIONS:
        transaction.add_or_update(permission, flush=True)

    LOG.debug('Added new permission definitions')


def add_new_role_permissions(transaction):
    for (role_name, permission_names) in list(NEW_ROLE_PERMISSIONS.items()):
        role = transaction.find_one_by_fields(Role, True, {'name': role_name})
        if not role:
            raise ValueError('Could not find role \'{name}\''.format(name=role_name))

        permissions = []

        for permission_name in permission_names:
            permission = transaction.find_one_by_fields(
                PermissionDefinition,
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
            role_permission = Permission(role_id=role.id, definition_id=permission.id)
            transaction.add_or_update(role_permission, flush=True)

    LOG.debug('Added new role permissions')


def add_new_resources(transaction):
    for resource in NEW_RESOURCES:
        transaction.add_or_update(resource, flush=True)
    LOG.debug('Added new resources')


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        LOG.info('Prepopulating database with default information')
        add_new_resource_types(transaction)
        add_new_resources(transaction)
        add_new_permission_definitions(transaction)
        add_new_roles(transaction)
        add_new_role_permissions(transaction)
        LOG.info('Successfully prepopulated data.')
