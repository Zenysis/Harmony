import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship

from models.alchemy.base import Base

# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103
class QueryPolicy(Base):
    __tablename__ = 'query_policy'

    id = sa.Column(sa.Integer, primary_key=True)

    name = sa.Column(sa.String(), nullable=False, unique=True)

    description = sa.Column(sa.Text(), nullable=True)

    '''The JSON representation of the policy.
    '''
    policy_filters = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)

    '''Relationship to the resource entry (for AuthZ and Auditing purposes).
    '''
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource.id', ondelete='CASCADE', name='valid_query_definition_resource'
        ),
        nullable=False,
        unique=True,
    )

    resource = relationship('Resource', viewonly=True)

    @hybrid_property
    def author_username(self):
        return self.author.username
