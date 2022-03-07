from enum import Enum
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base


if TYPE_CHECKING:
    from models.alchemy.user import User
    from models.alchemy.security_group import Group
    from models.alchemy.query_policy import QueryPolicy


# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103

# Pylint fails to pick up the Integer/Column/ForeignKey/relationship
# attributes that denote columns in a SQLAlchemy field.
# pylint:disable=E1101


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

    # A resource type that represents an alert definition and any of the notification objects
    # corresponding to the alert definition
    ALERT = 6


RESOURCE_TYPES = [e.name for e in ResourceTypeEnum]


RESOURCE_ROLE_NAMES = {
    'DASHBOARD_VIEWER': 'dashboard_viewer',
    'DASHBOARD_EDITOR': 'dashboard_editor',
    'DASHBOARD_ADMIN': 'dashboard_admin',
    'ALERT_ADMIN': 'alert_admin',
    'ALERT_CREATOR': 'alert_creator',
    'ALERT_EDITOR': 'alert_editor',
    'ALERT_VIEWER': 'alert_viewer',
}


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
    users = relationship(
        'User',
        secondary='user_acl',
        backref=backref('user_acl_backref', lazy='dynamic'),
        viewonly=True,
    )
    groups = relationship(
        'Group',
        secondary='security_group_acl',
        backref=backref('security_group_acl_backref', lazy='dynamic'),
        viewonly=True,
    )


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
    permissions = relationship(
        'Permission',
        secondary='resource_role_permission',
        backref=backref('resource_role_permission_backref', lazy='dynamic'),
        viewonly=False,
    )

    resource_type = relationship('ResourceType', viewonly=True)


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

    # TODO(vedant) - Make this a mixin to keep the model class 'pure'
    def build_permission(self, resource):
        # NOTE(stephen): Lazily import ItemNeed since this class can be
        # referenced from the pipeline where web dependencies are not installed.
        from flask_principal import ItemNeed

        resource_id = resource.id if resource else None
        resource_type = self.resource_type.name.name.lower()
        # We want to take the Enum NAME,
        # not the Enum itself
        permission = self.permission

        return ItemNeed(permission, resource_id, resource_type)


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
            'resource_role.id',
            ondelete='SET NULL',
            name='valid_dashboard_resource_role',
        ),
        nullable=True,
    )
    alert_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id', ondelete='SET NULL', name='valid_alert_resource_role'
        ),
        nullable=True,
    )
    enable_data_export = sa.Column(sa.Boolean(), server_default='false', nullable=False)

    permissions = relationship(
        'Permission',
        secondary='role_permissions',
        backref=backref('role_permissions_backref', lazy='dynamic'),
        viewonly=False,
    )
    query_policies = relationship(
        'QueryPolicy',
        secondary='query_policy_role',
        backref=backref('query_policy_role_backref', lazy='dynamic'),
        viewonly=False,
    )
    dashboard_resource_role = relationship(
        'ResourceRole', foreign_keys=[dashboard_resource_role_id], viewonly=True
    )
    alert_resource_role = relationship(
        'ResourceRole', foreign_keys=[alert_resource_role_id], viewonly=True
    )


class SitewideResourceAcl(Base):
    '''Represents resources and their sitewide `ResourceRole` for both
    registered and unregistered users.
    '''

    __tablename__ = 'sitewide_resource_acl'

    id = sa.Column(sa.Integer(), primary_key=True)
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=False,
        unique=True,
    )
    registered_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id',
            ondelete='CASCADE',
            name='valid_registered_resource_role',
        ),
        nullable=True,
    )
    unregistered_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id',
            ondelete='CASCADE',
            name='valid_unregistered_resource_role',
        ),
        nullable=True,
    )

    resource = relationship('Resource', viewonly=True)
    registered_resource_role = relationship(
        'ResourceRole', foreign_keys=[registered_resource_role_id], viewonly=True
    )
    unregistered_resource_role = relationship(
        'ResourceRole', foreign_keys=[unregistered_resource_role_id], viewonly=True
    )
