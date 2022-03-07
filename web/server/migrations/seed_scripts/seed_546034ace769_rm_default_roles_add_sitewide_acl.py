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
    permissions = relationship(
        'Permission',
        secondary='role_permissions',
        backref=backref('role_permissions_backref', lazy='dynamic'),
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


class UserRoles(Base):
    '''A class that represents a mapping between a `User` and a `Role`.
    '''

    __tablename__ = 'user_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    role = relationship('Role', viewonly=True)
    user = relationship('User', viewonly=True)


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
    status_id = sa.Column(sa.Integer())

    # Relationships
    roles = relationship('UserRoles', viewonly=True)


class DefaultRoles(Base):
    '''A class that represents a mapping between a `User` and a `Role`. It can optionally also
    apply to an 'Anonymous User' (a user that is unauthenticated).
    '''

    __tablename__ = 'default_roles'

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
    apply_to_unregistered = sa.Column(
        sa.Boolean(), nullable=False, server_default='false'
    )
    resource = relationship('Resource', viewonly=True)
    role = relationship('Role', viewonly=True)


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


DEFAULT_ROLE_NAME = '_default_role'
QUERY_RUNNER_NAME = 'query_runner'
VIEW_QUERY_FORM_NAME = 'view_query_form'
QUERY_ANALYST_ROLE_NAME = 'query_analyst'


def create_default_role_and_assign(transaction):
    '''Create a default role and assign all users to it. This is only for roles
    that are resource_type 1, which is ok because default roles currently only
    have these anyway.
    '''
    # Create new default role
    default_roles = transaction.find_all_by_fields(DefaultRoles, {})
    permissions_dict = {}
    for default_role in default_roles:
        if default_role.resource.resource_type_id != (ResourceTypeEnum.SITE.value):
            continue

        for permission in default_role.role.permissions:
            permissions_dict[permission.id] = permission

    permissions_list = permissions_dict.values()
    new_role = transaction.add_or_update(
        Role(
            name=DEFAULT_ROLE_NAME,
            label='Default Role',
            permissions=list(permissions_list),
        ),
        flush=True,
    )

    # Assign all users to this role
    role_id = new_role.id
    for user in transaction.find_all_by_fields(User, {}):
        transaction.add_or_update(UserRoles(user_id=user.id, role_id=role_id))


def populate_sitewide_acl(transaction):
    '''Populate sitewide ACLs for roles limited to Dashboard. The only other
    item is Alert, and there shouldn't be any assignments here.
    '''
    for default_role in transaction.find_all_by_fields(DefaultRoles, {}):
        if default_role.resource.resource_type_id != (ResourceTypeEnum.DASHBOARD.value):
            continue

        # There seems to be default roles for editor and admin, we only want to
        # move over view permissions
        if default_role.role_id != 2:
            continue

        # Translate betwen Role and ResourceRole. Luckily, naming is consistent
        resource_role_id = transaction.find_one_by_fields(
            ResourceRole, True, {'name': default_role.role.name}
        ).id

        unregistered_resource_role_id = (
            resource_role_id if default_role.apply_to_unregistered else None
        )
        transaction.add_or_update(
            SitewideResourceAcl(
                resource_id=default_role.resource_id,
                registered_resource_role_id=resource_role_id,
                unregistered_resource_role_id=unregistered_resource_role_id,
            )
        )


def populate_default_roles_table_from_role(transaction):
    '''Finds default role and populates default_roles with that. There should
    only be two variations: Query Analyst or Query Runner. All deployments give
    at least Query Runner.
    Also deletes the default role in roles table
    '''
    # At least add the query runner role
    query_runner_role = transaction.find_one_by_fields(
        Role, True, {'name': QUERY_RUNNER_NAME}
    )
    if not query_runner_role:
        print('No query_runner role in DB, skipping assignment')
        return
    transaction.add_or_update(
        DefaultRoles(
            role_id=query_runner_role.id,
            resource_id=ResourceTypeEnum.SITE.value,
            apply_to_unregistered=False,
        )
    )

    # Check for the existence of the 'view_query_form' permission
    default_role = transaction.find_one_by_fields(
        Role, True, {'name': DEFAULT_ROLE_NAME}
    )

    for permission in default_role.permissions:
        if permission.permission == VIEW_QUERY_FORM_NAME:
            query_analyst_role = transaction.find_one_by_fields(
                Role, True, {'name': QUERY_ANALYST_ROLE_NAME}
            )
            transaction.add_or_update(
                DefaultRoles(
                    role_id=query_analyst_role.id,
                    resource_id=ResourceTypeEnum.SITE.value,
                    apply_to_unregistered=False,
                )
            )
            break

    # Delete role
    transaction.delete(default_role)


def get_role_from_resource_role(resource_role, transaction, cache):
    '''Gets analogous role from resourceRole through common names.
    '''
    if resource_role.id in cache:
        return cache[resource_role.id]

    role = transaction.find_one_by_fields(Role, True, {'name': resource_role.name})

    cache[resource_role.id] = role.id
    return role.id


def migrate_from_sitewide_acl(transaction):
    '''Translate all rows in sitewide_acl table to default_roles. We will take
    the resource_role_id of for the registered user.
    '''
    cache = {}
    for sitewide_acl in transaction.find_all_by_fields(SitewideResourceAcl, {}):
        if not sitewide_acl.registered_resource_role:
            print(
                'No registered resourceRole for sitewide ACL on resource_id ',
                sitewide_acl.resource_id,
            )
            continue
        role_id = get_role_from_resource_role(
            sitewide_acl.registered_resource_role, transaction, cache
        )
        apply_to_unregistered = bool(sitewide_acl.unregistered_resource_role)
        transaction.add_or_update(
            DefaultRoles(
                role_id=role_id,
                resource_id=sitewide_acl.resource_id,
                apply_to_unregistered=apply_to_unregistered,
            )
        )


def upvert_data(alembic_operation):
    '''Summary:
    1. Create a role which encapsulates default roles. Assign this role to all
        users
    2. For all unregistered default roles, put them into sitewide_acl
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        create_default_role_and_assign(transaction)
        populate_sitewide_acl(transaction)


def downvert_data(alembic_operation):
    '''Summary:
    1. Populate default_roles table from Default Role pulled from roles table.
        There should only be two variations - allowing to view query page or not
    2. Populate default_roles table from sitewide_acl table
    3. Delete default role in roles table
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        populate_default_roles_table_from_role(transaction)
        migrate_from_sitewide_acl(transaction)
