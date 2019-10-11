# pylint: disable=C0103
import sqlalchemy as sa
from sqlalchemy.orm import relationship, backref
from sqlalchemy.orm.collections import attribute_mapped_collection

from models.alchemy.base import Base


class CanonicalLocations(Base):
    '''Represents a canonical location.
    '''

    __tablename__ = 'canonical_locations'
    id = sa.Column(sa.Integer(), primary_key=True)
    # The name of the canonical location
    name = sa.Column(sa.String())
    # The Id of the parent location (another row in this table).
    parent_id = sa.Column(
        sa.Integer(), sa.ForeignKey('canonical_locations.id'), nullable=True
    )
    # The level of the location (Region, Facility, ...)
    type_id = sa.Column(sa.Integer(), sa.ForeignKey('location_types.id'))

    children = relationship(
        'CanonicalLocations',
        cascade="all",
        backref=backref("parent", remote_side='CanonicalLocations.id'),
        collection_class=attribute_mapped_collection('name'),
        viewonly=True,
    )
    type = relationship('LocationTypes', foreign_keys=[type_id], viewonly=True)

    def __str__(self):
        return self.name


class LocationTypes(Base):
    '''Represents a hierarchical location type.
    '''

    __tablename__ = 'location_types'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String())

    def __str__(self):
        return self.name


class UnmatchedLocations(Base):
    '''Represents a unmatched location.
    '''

    __tablename__ = 'unmatched_locations'
    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String())
    parent_id = sa.Column(sa.Integer(), sa.ForeignKey('canonical_locations.id'))
    type_id = sa.Column(sa.Integer(), sa.ForeignKey('location_types.id'))
    source_id = sa.Column(sa.Integer(), sa.ForeignKey('sources.source_id'))

    parent = relationship('CanonicalLocations', foreign_keys=[parent_id], viewonly=True)
    type = relationship('LocationTypes', foreign_keys=[type_id], viewonly=True)
    source = relationship('Sources', foreign_keys=[source_id], viewonly=True)
    suggestions = relationship(
        'CanonicalLocations', secondary='suggested_matches', viewonly=True
    )
    user_match = relationship('UserMatches')

    def __str__(self):
        return self.name


class SuggestedMatches(Base):
    '''Represents a mapping between a canonical
    location and an unmatched location.
    '''

    __tablename__ = 'suggested_matches'
    canonical_id = sa.Column(
        sa.Integer(), sa.ForeignKey('canonical_locations.id'), primary_key=True
    )
    unmatched_id = sa.Column(
        sa.Integer(), sa.ForeignKey('unmatched_locations.id'), primary_key=True
    )

    canonical = relationship('CanonicalLocations', viewonly=True)
    unmatched = relationship('UnmatchedLocations', viewonly=True)


class UserMatches(Base):
    '''Represents a mapping selected by a user between a
    canonical location and a unmatched location.
    '''

    __tablename__ = 'user_matches'
    unmatched_id = sa.Column(
        sa.Integer(), sa.ForeignKey('unmatched_locations.id'), primary_key=True
    )
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )
    canonical_id = sa.Column(
        sa.Integer(), sa.ForeignKey('canonical_locations.id'), nullable=False
    )

    canonical = relationship('CanonicalLocations', viewonly=True)
    unmatched = relationship('UnmatchedLocations', viewonly=True)
    user = relationship('User', viewonly=True)


class Sources(Base):
    '''Represents a source ie dhis2, hmis, ...
    '''

    __tablename__ = 'sources'
    source_id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String())

    def __str__(self):
        return self.name


class MappedLocations(Base):
    '''Represents a finalized mapping between a unmatched or mispelled location
    and a canonical one.
    '''

    __tablename__ = 'mapped_locations'
    unmatched_id = sa.Column(
        sa.Integer(), sa.ForeignKey('unmatched_locations.id'), primary_key=True
    )
    canonical_id = sa.Column(sa.Integer(), sa.ForeignKey('canonical_locations.id'))

    canonical = relationship('CanonicalLocations', viewonly=True)
    unmatched = relationship('UnmatchedLocations', viewonly=True)


class FlaggedLocations(Base):
    '''Represents a mapping selected by a user between a
    canonical location and a unmatched location.
    '''

    __tablename__ = 'flagged_locations'
    unmatched_id = sa.Column(
        sa.Integer(), sa.ForeignKey('unmatched_locations.id'), primary_key=True
    )
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user'),
        nullable=False,
    )

    unmatched = relationship('UnmatchedLocations', viewonly=True)
    user = relationship('User', viewonly=True)
