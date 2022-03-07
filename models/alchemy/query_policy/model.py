from enum import Enum
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base

if TYPE_CHECKING:
    from models.alchemy.permission import Role

# pylint: disable=C0103
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


QUERY_POLICY_TYPES = [e.name for e in QueryPolicyTypeEnum]


class QueryPolicyType(Base):
    '''A classification for query policy types on the site'''

    __tablename__ = 'query_policy_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(
        sa.Enum(QueryPolicyTypeEnum, name='query_policy_type_enum'),
        unique=True,
        nullable=False,
    )


# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103
class QueryPolicy(Base):
    __tablename__ = 'query_policy'

    id = sa.Column(sa.Integer(), primary_key=True)

    name = sa.Column(sa.String(), nullable=False, unique=True)

    description = sa.Column(sa.Text(), nullable=True)

    # The JSON representation of the policy.
    policy_filters = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)

    query_policy_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('query_policy_type.id', ondelete='RESTRICT', onupdate='CASCADE'),
        nullable=False,
    )

    query_policy_type = relationship('QueryPolicyType', viewonly=True)
    roles = relationship(
        'Role',
        secondary='query_policy_role',
        backref=backref('query_policy_role_backref', lazy='dynamic'),
        viewonly=True,
    )

    @hybrid_property
    def author_username(self):
        return self.author.username


class QueryPolicyRole(Base):
    '''A class that represents a mapping between a `QueryPolicy` and a `Role`.'''

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

    query_policy = relationship('QueryPolicy', viewonly=True)
    role = relationship('Role', viewonly=True)
