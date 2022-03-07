import json
import os
from os.path import isfile

from enum import Enum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict

from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103
Base = declarative_base()

QUERY_POLICY_ROLE_STORE_FILENAME = (
    'web/server/migrations/backups/backup_9a485a630d00_query_policy_roles.json'
)


class QueryPolicyTypeEnum(Enum):
    '''An internal representation of the various query policy types.
    '''

    DATASOURCE = 1
    DIMENSION = 2
    COMPOSITE = 3


QUERY_POLICY_TYPES = {type.name: type.value for type in QueryPolicyTypeEnum}


class QueryPolicy(Base):
    __tablename__ = 'query_policy'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(), nullable=False, unique=True)
    description = sa.Column(sa.Text(), nullable=True)
    policy_filters = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    query_policy_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'query_policy_type.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='query_policy_type_id_resource',
        ),
        nullable=False,
    )
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource.id', ondelete='CASCADE', name='valid_query_definition_resource'
        ),
        nullable=False,
        unique=True,
    )


class QueryPolicyType(Base):
    ''' A classification for query policy types on the site
    '''

    __tablename__ = 'query_policy_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.Enum(QueryPolicyTypeEnum), unique=True, nullable=False)


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


class Role(Base):
    '''A class that defines permissions that can be assigned to a `User` or a `Group`.
    '''

    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    # for display purposes
    label = sa.Column(sa.Unicode(255), server_default=u'')


def populate_query_policy_types(transaction):
    '''Populates QueryPolicyType table with the types defined in QueryPolicyTypeEnum.
    '''
    for name, query_policy_id in QUERY_POLICY_TYPES.items():
        transaction.add_or_update(QueryPolicyType(id=query_policy_id, name=name))


def populate_query_policy_type_column(transaction):
    '''Extracts the policy type (i.e. data source, geo) from policy_filter column,
    retrieves the associated id and populates it into the newly defined
    query_policy_type_id column of the QueryPolicy table.
    '''
    query_policies = transaction.find_all_by_fields(QueryPolicy, {})
    for policy in query_policies:
        policy_filters = policy.policy_filters

        # Query policy filters is a dictionary mapping 1 key (policy type) to
        # its various filters so we can make the assumption here and retrieve
        # policy type by getting the first and only key of the policy filter dict.
        query_policy_keys = list(policy_filters.keys())
        if query_policy_keys:
            query_policy_type = query_policy_keys[0]
            if len(policy_filters) > 1:
                query_policy_type_id = QueryPolicyTypeEnum.COMPOSITE.value
            elif query_policy_type == 'source':
                query_policy_type_id = QueryPolicyTypeEnum.DATASOURCE.value
            else:
                query_policy_type_id = QueryPolicyTypeEnum.DIMENSION.value

            new_policy = policy
            new_policy.query_policy_type_id = query_policy_type_id
            transaction.add_or_update(new_policy)


def upgrade_query_policy_roles(transaction):
    '''Retrieves any information that was lost from the QueryPolicyRole table
    during a downgrade.
    '''
    if isfile(QUERY_POLICY_ROLE_STORE_FILENAME):
        query_policy_role_arr = json.load(open(QUERY_POLICY_ROLE_STORE_FILENAME, 'r'))
        for query_policy_role in query_policy_role_arr:
            transaction.add_or_update(
                QueryPolicyRole(
                    query_policy_id=query_policy_role['query_policy_id'],
                    role_id=query_policy_role['role_id'],
                )
            )
        os.remove(QUERY_POLICY_ROLE_STORE_FILENAME)


def downgrade_query_policy_roles(transaction):
    '''Take all entries from QueryPolicyRole table and saves it to a file so during
    the next upgrade, we can retrieve the lost information.
    '''
    query_policy_role_objects = transaction.find_all_by_fields(QueryPolicyRole, {})
    if query_policy_role_objects:
        query_policy_role_arr = []
        for query_policy_role in query_policy_role_objects:
            query_policy_role_arr.append(
                {
                    'role_id': query_policy_role.role_id,
                    'query_policy_id': query_policy_role.query_policy_id,
                }
            )
        json.dump(query_policy_role_arr, open(QUERY_POLICY_ROLE_STORE_FILENAME, 'w'))


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        populate_query_policy_types(transaction)
        populate_query_policy_type_column(transaction)
        upgrade_query_policy_roles(transaction)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        downgrade_query_policy_roles(transaction)
