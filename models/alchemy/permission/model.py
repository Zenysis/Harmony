from enum import Enum

import sqlalchemy as sa
from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base


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

    # A resource type that represents a query policy controlling how users can query the system
    # for data
    QUERY_POLICY = 5

    # A resource type that represents an alert definition and any of the notification objects
    # corresponding to the alert definition
    ALERT = 6


RESOURCE_TYPES = [e.name for e in ResourceTypeEnum]


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
        secondary='user_roles',
        backref=backref('user_roles_backref', lazy='dynamic'),
        viewonly=True,
    )
    groups = relationship(
        'Group',
        secondary='security_group_roles',
        backref=backref('security_group_roles_backref', lazy='dynamic'),
        viewonly=True,
    )
    default_roles = relationship(
        'Role',
        secondary='default_roles',
        backref=backref('default_roles_backref', lazy='dynamic'),
        viewonly=True,
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
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )
    permissions = relationship(
        'Permission',
        secondary='role_permissions',
        backref=backref('role_permissions_backref', lazy='dynamic'),
        viewonly=True,
    )
    resource_type = relationship('ResourceType', viewonly=True)
