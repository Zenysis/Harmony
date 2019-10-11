'''SQLAlchemy models for configuration related data
'''
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from models.alchemy.base import Base

# Disable this rule because we actually want to use the id
# column to represent a unique way of identifying a database
# model.
# pylint:disable=C0103

# Pylint fails to pick up the Integer/Column/ForeignKey/relationship
# attributes that denote columns in a SQLAlchemy field.
# pylint:disable=E1101


class Configuration(Base):
    '''A class that represents a key value pair for use in platform/server configuration.
    '''

    __tablename__ = 'configuration'

    id = sa.Column(sa.Integer, primary_key=True)

    '''The name of the key to look up when querying configuration values
    '''
    key = sa.Column(sa.String(100), nullable=False, unique=True)

    '''The overwritten value of the configuration
    '''
    overwritten_value = sa.Column(JSONB())

    '''Indicates whether or not the `overwritten_value` of the configuration applies.
    If set to `True` it applies, if set to `False`, the default defined in
    `web.server.configuration.settings` still applies.
    '''
    overwritten = sa.Column(sa.Boolean(), server_default='false', nullable=False)

    # TODO(vedant) - Don't have an explicit resource id yet. We need to implement it
    # in a unified fashion for users, roles, dashboards, and all other AuthZ protected
    # items on the site.
    #'''Relationship to the resource entry (for AuthZ and Auditing purposes)
    #'''
    # resource_id = sa.Column(sa.Integer(),
    #                        sa.ForeignKey('resource.id',
    #                                      ondelete='CASCADE',
    #                                      name='valid_configuration_resource'),
    #                        nullable=False)

    # resource = relationship('Resource')
