import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict

from models.alchemy.permission import ResourceTypeEnum
from models.alchemy.query_policy import QueryPolicyRole
from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103
Base = declarative_base()

# HACK(yitian): saving this here because we know the query policy holder role
# id is always 13.
QUERY_POLICY_HOLDER_ROLE_ID = 13


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


class ResourceType(Base):
    __tablename__ = 'resource_type'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(
        sa.Enum(ResourceTypeEnum, name='resource_type_enum'),
        unique=True,
        nullable=False,
    )


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
    __tablename__ = 'role'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')


class User(Base):
    __tablename__ = 'user'
    id = sa.Column(sa.Integer, primary_key=True)
    username = sa.Column(sa.String(50), nullable=False, unique=True)
    password = sa.Column(sa.String(255), nullable=False, server_default='')
    reset_password_token = sa.Column(sa.String(100), nullable=False, server_default='')
    first_name = sa.Column(sa.String(100), nullable=False, server_default='')
    last_name = sa.Column(sa.String(100), nullable=False, server_default='')
    phone_number = sa.Column(sa.String(50), nullable=False, server_default='')
    status_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user_status.id', ondelete='RESTRICT', name='valid_status'),
        nullable=False,
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
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=True,
    )


class Group(Base):
    __tablename__ = 'security_group'

    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, unique=True)


class GroupRoles(Base):
    __tablename__ = 'security_group_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    group_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'security_group.id', ondelete='CASCADE', name='valid_security_group'
        ),
        nullable=False,
    )
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


def migrate_query_policy_resource_to_role(transaction):
    query_policies = transaction.find_all_by_fields(QueryPolicy, {})
    for query_policy in query_policies:
        # Add query policy role
        query_policy_name = query_policy.name
        truncated_query_policy_name = query_policy_name[:50]
        query_policy_role = transaction.add_or_update(
            Role(
                name=truncated_query_policy_name,
                label='%s Query Policy' % query_policy_name,
            ),
            flush=True,
        )
        transaction.add_or_update(
            QueryPolicyRole(
                query_policy_id=query_policy.id, role_id=query_policy_role.id
            )
        )
        # Assign query policy role to users with permissions to the original
        # query policy resource.
        query_policy_resource = transaction.find_one_by_fields(
            Resource, True, {'name': query_policy_name}
        )
        if not query_policy_resource:
            # Some do not have an associated resource
            continue

        query_policy_user_roles = transaction.find_all_by_fields(
            UserRoles, {'resource_id': query_policy_resource.id}
        )
        for user_role in query_policy_user_roles:
            user_role.role_id = query_policy_role.id
            user_role.resource_id = None
            transaction.add_or_update(user_role)

        query_policy_group_roles = transaction.find_all_by_fields(
            GroupRoles, {'resource_id': query_policy_resource.id}
        )
        for group_role in query_policy_group_roles:
            group_role.role_id = query_policy_role.id
            group_role.resource_id = None
            transaction.add_or_update(group_role)

        # Delete query policy resources
        transaction.delete(query_policy_resource)


def migrate_query_policy_role_to_resource(transaction):
    query_policies = transaction.find_all_by_fields(QueryPolicy, {})
    for query_policy in query_policies:
        # Add query policy resource
        query_policy_resource = transaction.add_or_update(
            Resource(
                name=query_policy.name,
                label='%s Query Policy' % query_policy.name,
                resource_type_id=ResourceTypeEnum.QUERY_POLICY.value,
            ),
            flush=True,
        )
        # Assign query policy resource to users with permissions to the query
        # policy role.
        query_policy_role = transaction.find_one_by_fields(
            Role, True, {'name': query_policy.name}
        )

        # Not all query policies had original roles
        if not query_policy_role:
            continue

        query_policy_user_roles = transaction.find_all_by_fields(
            UserRoles, {'role_id': query_policy_role.id}
        )
        for user_role in query_policy_user_roles:
            user_role.role_id = QUERY_POLICY_HOLDER_ROLE_ID
            user_role.resource_id = query_policy_resource.id
            transaction.add_or_update(user_role)

        query_policy_group_roles = transaction.find_all_by_fields(
            GroupRoles, {'role_id': query_policy_role.id}
        )
        for group_role in query_policy_group_roles:
            group_role.role_id = QUERY_POLICY_HOLDER_ROLE_ID
            group_role.resource_id = query_policy_resource.id
            transaction.add_or_update(user_role)

        # Delete query policy role
        if query_policy_role:
            transaction.delete(query_policy_role)

        # Update query policy resource id
        query_policy.resource_id = query_policy_resource.id
        transaction.add_or_update(query_policy)


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        migrate_query_policy_resource_to_role(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        migrate_query_policy_role_to_resource(transaction)
