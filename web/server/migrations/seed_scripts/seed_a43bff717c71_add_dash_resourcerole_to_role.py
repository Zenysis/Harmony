from enum import Enum

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

    SITE = 1
    DASHBOARD = 2
    USER = 3
    GROUP = 4
    QUERY_POLICY = 5
    ALERT = 6


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


class Role(Base):
    '''A class that defines permissions that can be assigned to a `User` or a `Group`.
    '''

    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')
    dashboard_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id', ondelete='CASCADE', name='valid_dashboard_resource_role'
        ),
        nullable=True,
    )
    alert_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id', ondelete='CASCADE', name='valid_alert_resource_role'
        ),
        nullable=True,
    )
    permissions = relationship(
        'Permission',
        secondary='role_permissions',
        backref=backref('role_permissions_backref', lazy='dynamic'),
        viewonly=False,
    )
    dashboard_resource_role = relationship(
        'ResourceRole', foreign_keys=[dashboard_resource_role_id], viewonly=True
    )
    alert_resource_role = relationship(
        'ResourceRole', foreign_keys=[alert_resource_role_id], viewonly=True
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


class ResourceRolePermission(Base):
    '''Mapping between ResourceRole and the Permissions it represents.
    '''

    __tablename__ = 'resource_role_permission'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource_role.id', ondelete='CASCADE'),
        nullable=False,
    )
    permission_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('permission.id', ondelete='CASCADE', name='valid_permission'),
        nullable=False,
    )
    permission = relationship('Permission', viewonly=True)


class ResourceRole(Base):
    '''Defines a role which applies to a resource that can be assigned to a
    UserAcl or GroupAcl. An example of this would be a dashboard_admin or
    dashboard_editor.
    '''

    __tablename__ = 'resource_role'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)

    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )
    resource_type = relationship('ResourceType', viewonly=True)
    permissions = relationship(
        'Permission',
        secondary='resource_role_permission',
        backref=backref('resource_role_permission_backref', lazy='dynamic'),
        viewonly=False,
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

    resource_type = relationship('ResourceType', viewonly=True)
    permission = sa.Column(sa.String(100), nullable=False)


ROLE_NAMES_TO_MODIFY = [
    'alert_admin',
    'alert_creator',
    'alert_editor',
    'alert_viewer',
    'dashboard_admin',
    'dashboard_editor',
    'dashboard_viewer',
]


def upvert_data(alembic_operation):
    '''Summary:
    - Move all roles that give sitewide access into new field.
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for role_name in ROLE_NAMES_TO_MODIFY:
            role_obj = transaction.find_one_by_fields(Role, True, {'name': role_name})

            resource_role = transaction.find_one_by_fields(
                ResourceRole, True, {'name': role_name}
            )
            resource_role_id = resource_role.id
            if resource_role.resource_type.name.name == 'ALERT':
                role_obj.alert_resource_role_id = resource_role_id
            else:
                role_obj.dashboard_resource_role_id = resource_role_id
            role_obj.permissions = []
            transaction.add_or_update(role_obj, flush=True)


def downvert_data(alembic_operation):
    '''Summary:
    - Move all roles that give sitewide access back into permission.
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for role_name in ROLE_NAMES_TO_MODIFY:
            role_obj = transaction.find_one_by_fields(Role, True, {'name': role_name})
            resource_role = (
                role_obj.alert_resource_role or role_obj.dashboard_resource_role
            )
            if not resource_role:
                print('No match for: ', role_obj.name)
                continue
            role_obj.permissions = resource_role.permissions
            transaction.add_or_update(role_obj)
