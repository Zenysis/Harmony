from enum import Enum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship, backref

from config.filters import AUTHORIZABLE_DIMENSIONS
from config.general import DEPLOYMENT_NAME
from data.query_policy import (
    get_all_value_policy_name,
    seed_dimension_query_policies_via_druid,
)
from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103

Base = declarative_base()

PERMISSIONS_TO_UPDATE = ['view_data_quality', 'view_case_management']


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


class ResourceRole(Base):
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


class ResourceTypeEnum(Enum):
    SITE = 1
    DASHBOARD = 2
    USER = 3
    GROUP = 4
    QUERY_POLICY = 5
    ALERT = 6


class ResourceType(Base):
    __tablename__ = 'resource_type'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(
        sa.Enum(ResourceTypeEnum, name='resource_type_enum'),
        unique=True,
        nullable=False,
    )


class Permission(Base):
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
    resource_type = relationship('ResourceType', viewonly=True)


class RolePermissions(Base):
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


class Role(Base):
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
    enable_data_export = sa.Column(sa.Boolean(), server_default='false', nullable=False)
    permissions = relationship(
        'Permission',
        secondary='role_permissions',
        backref=backref('role_permissions_backref', lazy='dynamic'),
        viewonly=False,
    )


class User(Base):
    __tablename__ = 'user'
    id = sa.Column(sa.Integer, primary_key=True)
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    password = sa.Column(sa.String(255), nullable=False, server_default='')
    reset_password_token = sa.Column(sa.String(100), nullable=False, server_default='')
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    phone_number = sa.Column(sa.String(50), nullable=False, server_default='')
    status_id = sa.Column()
    roles = relationship(
        'Role',
        secondary='user_roles',
        backref=backref('users', lazy='dynamic'),
        viewonly=False,
    )


class UserRoles(Base):
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


DEFAULT_ROLE_NAME = '_default_role'
DEFAULT_ROLE_DISABLE_DATA_EXPORT_NAME = '_default_role_view_only'
DEFAULT_ROLE_DISABLE_DATA_EXPORT_LABEL = 'Site Viewer Default Role'
VIEW_ONLY_ROLE_NAME = 'view_only'
VIEW_ONLY_ROLE_LABEL = 'Site Viewer'


def update_default_role(transaction):
    default_role = transaction.find_one_by_fields(
        Role, True, {'name': DEFAULT_ROLE_NAME}
    )
    if default_role:
        default_role.enable_data_export = True
        transaction.add_or_update(default_role, flush=True)

        dashboard_creation_permission = transaction.find_one_by_fields(
            Permission,
            True,
            {
                'permission': 'create_resource',
                'resource_type_id': ResourceTypeEnum.DASHBOARD.value,
            },
        )

        default_role_permission_ids = [
            permission.id for permission in default_role.permissions
        ]
        if (
            dashboard_creation_permission
            and dashboard_creation_permission.id not in default_role_permission_ids
        ):
            transaction.add_or_update(
                RolePermissions(
                    role_id=default_role.id,
                    permission_id=dashboard_creation_permission.id,
                )
            )


def add_site_viewer_default_role(transaction):
    default_role = transaction.find_one_by_fields(
        Role, True, {'name': DEFAULT_ROLE_NAME}
    )
    return transaction.add_or_update(
        Role(
            name=DEFAULT_ROLE_DISABLE_DATA_EXPORT_NAME,
            label=DEFAULT_ROLE_DISABLE_DATA_EXPORT_LABEL,
            permissions=default_role.permissions,
            enable_data_export=False,
        ),
        flush=True,
    )


def migrate_view_only_to_disable_data_export_role(transaction):
    view_only_role = transaction.find_one_by_fields(
        Role, True, {'name': VIEW_ONLY_ROLE_NAME}
    )
    if view_only_role:
        view_only_default_role_id = add_site_viewer_default_role(transaction).id
        view_only_user_roles = transaction.find_all_by_fields(
            UserRoles, {'role_id': view_only_role.id}
        )
        default_role = transaction.find_one_by_fields(
            Role, True, {'name': DEFAULT_ROLE_NAME}
        )
        for user_role in view_only_user_roles:
            user_role.role_id = view_only_default_role_id
            transaction.add_or_update(user_role, flush=True)
            default_user_role = transaction.find_one_by_fields(
                UserRoles,
                True,
                {'role_id': default_role.id, 'user_id': user_role.user_id},
            )
            transaction.delete(default_user_role)
        transaction.delete(view_only_role)


def populate_view_only_role(transaction):
    view_only_default_role = transaction.find_one_by_fields(
        Role, True, {'name': DEFAULT_ROLE_DISABLE_DATA_EXPORT_NAME}
    )
    if view_only_default_role:
        view_only_role = transaction.add_or_update(
            Role(name=VIEW_ONLY_ROLE_NAME, label=VIEW_ONLY_ROLE_LABEL), flush=True
        )
        view_only_default_user_roles = transaction.find_all_by_fields(
            UserRoles, {'role_id': view_only_default_role.id}
        )
        default_role = transaction.find_one_by_fields(
            Role, True, {'name': DEFAULT_ROLE_NAME}
        )
        for user_role in view_only_default_user_roles:
            user_role.role_id = default_role.id
            transaction.add_or_update(user_role, flush=True)
            transaction.add_or_update(
                UserRoles(role_id=view_only_role.id, user_id=user_role.user_id),
                flush=True,
            )
        transaction.delete(view_only_default_role)


def populate_new_permissions(transaction):
    for permission_name in PERMISSIONS_TO_UPDATE:
        transaction.add_or_update(
            Permission(
                permission=permission_name, resource_type_id=ResourceTypeEnum.SITE.value
            ),
            flush=True,
        )


def remove_new_permissions(transaction):
    for permission_name in PERMISSIONS_TO_UPDATE:
        permission_obj = transaction.find_one_by_fields(
            Permission, True, {'permission': permission_name}
        )
        transaction.delete(permission_obj)


class QueryPolicy(Base):
    __tablename__ = 'query_policy'
    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)
    policy_filters = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    query_policy_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('query_policy_type.id', ondelete='RESTRICT', onupdate='CASCADE'),
        nullable=False,
    )


class QueryPolicyTypeEnum(Enum):
    '''There are two overarching types:
    - Single dimensional filters which are additive in nature with themselves
    - `COMPOSITE` type that spans multiple dimensions. COMPOSITE types are
    independent and non-additive
    '''

    # A query policy type that represents a data source filter.
    DATASOURCE = 1
    # A query policy type that represents a dimension filter. Dimensions are
    # represented by various geographies and subrecipients (only in nacosa).
    DIMENSION = 2
    # A query policy that has filters for more than one type of dimension.
    COMPOSITE = 3


class QueryPolicyRole(Base):
    '''A class that represents a mapping between a `QueryPolicy` and a `Role`.
    '''

    __tablename__ = 'query_policy_role'

    id = sa.Column(sa.Integer(), primary_key=True)
    query_policy_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('query_policy.id', ondelete='CASCADE'),
        nullable=False,
    )
    role_id = sa.Column(
        sa.Integer(), sa.ForeignKey('role.id', ondelete='CASCADE'), nullable=False
    )


def migrate_query_policies(transaction):
    '''Does the following:
    - Create new query policies based on what is turned on
    - Assign to default role unless specified otherwise
    '''
    # Create new policies
    for dimension_name in AUTHORIZABLE_DIMENSIONS:
        policy_type_enum = (
            QueryPolicyTypeEnum.DATASOURCE
            if dimension_name == 'source'
            else QueryPolicyTypeEnum.DIMENSION
        )
        seed_dimension_query_policies_via_druid(
            transaction, dimension_name, policy_type_enum
        )

    # Enable all_sources and all_dimensions in default roles that allow for them
    if DEPLOYMENT_NAME in ['beyond_zero', 'mz', 'mz_covid', 'pk', 'za']:
        return

    default_role = transaction.find_one_by_fields(
        Role, True, {'name': DEFAULT_ROLE_NAME}
    )

    for dimension_name in AUTHORIZABLE_DIMENSIONS:
        all_dimension_name_policy = transaction.find_one_by_fields(
            QueryPolicy, True, {'name': get_all_value_policy_name(dimension_name)}
        )
        transaction.add_or_update(
            QueryPolicyRole(
                query_policy_id=all_dimension_name_policy.id, role_id=default_role.id
            )
        )


def delete_run_query_permission(transaction):
    run_query_permission = transaction.find_one_by_fields(
        Permission, True, {'permission': 'run_query'}
    )
    if run_query_permission:
        transaction.delete(run_query_permission)


def delete_unneeded_query_policy_roles(transaction):
    query_policy_admin = transaction.find_one_by_fields(
        Role, True, {'name': 'query_policy_admin'}
    )
    query_policy_holder = transaction.find_one_by_fields(
        Role, True, {'name': 'query_policy_holder'}
    )
    if query_policy_admin:
        transaction.delete(query_policy_admin)
    if query_policy_holder:
        transaction.delete(query_policy_holder)


def delete_query_policy_resource_type(transaction):
    # First delete resources/resource roles/permissions that are linked to query
    # policy resource type. Then delete the query policy resource type
    query_policy_permissions = transaction.find_all_by_fields(
        Permission, {'resource_type_id': 5}
    )
    for permission in query_policy_permissions:
        transaction.delete(permission)
    query_policy_resources = transaction.find_all_by_fields(
        Resource, {'resource_type_id': 5}
    )
    for resource in query_policy_resources:
        transaction.delete(resource)
    query_policy_resource_roles = transaction.find_all_by_fields(
        ResourceRole, {'resource_type_id': 5}
    )
    for resource_role in query_policy_resource_roles:
        transaction.delete(resource_role)
    query_policy_resource_type = transaction.find_one_by_fields(
        ResourceType, True, {'name': 'QUERY_POLICY'}
    )
    if query_policy_resource_type:
        transaction.delete(query_policy_resource_type)


def upvert_data(alembic_operation):
    '''Summary:
    1. Enable data export for default role and dashboard creation
    2. Remove view_only role and the associated user role rows. Also create
    a view only default role and migrate user roles for the view_only role to
    this new role. Also remove the same users from the original default role.
    3. Adds new permissions and query policies not related to data
    export.
    4. Remove run_query permission, query policy roles, and query policy resource
    type.
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        update_default_role(transaction)
        migrate_view_only_to_disable_data_export_role(transaction)
        populate_new_permissions(transaction)

        migrate_query_policies(transaction)

        delete_run_query_permission(transaction)
        delete_unneeded_query_policy_roles(transaction)
        delete_query_policy_resource_type(transaction)


def downvert_data(alembic_operation):
    '''Summary:
    1. Add back view_only role and associated user role rows. Also remove view
    only default role. Add back these users to the original default role.

    Additionally, removes new permissions not related to data export.
    '''
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        populate_view_only_role(transaction)
        remove_new_permissions(transaction)
