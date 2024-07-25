from typing import TYPE_CHECKING

import sqlalchemy as sa

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base
from models.alchemy.entity_matching.match_status import MatchStatusEnum

if TYPE_CHECKING:
    from models.alchemy.user import User


class MetaDataColumn(Base):
    """Represents the metadata column that are available for a pipeline entity types"""

    __tablename__ = 'metadata_column'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(), nullable=False)
    sortable = sa.Column(sa.Boolean(), nullable=False)
    filterable = sa.Column(sa.Boolean(), nullable=False)


class PipelineEntityType(Base):
    """Represents a raw entity coming from the pipeline"""

    __tablename__ = 'pipeline_entity_type'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(), nullable=False, unique=True)
    description = sa.Column(sa.String())

    pipeline_entities = relationship('RawPipelineEntity')
    canonical_pipeline_entities = relationship('CanonicalPipelineEntity')


class MetaDataPipelineEntityTypeMapping(Base):
    '''Represents a mapping from a pipeline_entity_type_id to a metadata_column_id
    valid for that entity type.
    '''

    __tablename__ = 'metadata_pipeline_entity_type_mappings'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    metadata_column_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'metadata_column.id', ondelete='CASCADE', name='valid_metadata_column'
        ),
        nullable=False,
    )
    pipeline_entity_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'pipeline_entity_type.id',
            ondelete='CASCADE',
            name='valid_pipeline_entity_type',
        ),
        nullable=False,
    )

    metadata_column = relationship(
        'MetaDataColumn',
        backref=backref('pipeline_entity_type_mappings', lazy='dynamic'),
    )
    pipeline_entity_type = relationship(
        'PipelineEntityType',
        backref=backref('metadata_column_mappings', lazy='dynamic'),
    )


class RawPipelineEntity(Base):
    """Represents a raw entity coming from the pipeline"""

    __tablename__ = 'raw_pipeline_entity'

    # The combination of these three attributes uniquely identifies an entity
    __table_args__ = (
        sa.UniqueConstraint(
            'entity_type_id',
            'source_entity_id',
            'source',
            name="unique_raw_pipeline_entity",
        ),
    )

    id = sa.Column(sa.Integer(), primary_key=True)
    entity_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('pipeline_entity_type.id', ondelete='RESTRICT'),
        nullable=False,
    )
    # TODO: eventually this should reference the
    # pipeline_datasource table
    source = sa.Column(sa.String(), nullable=False)
    source_entity_id = sa.Column(sa.String(), nullable=False)
    entity_metadata = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    search_term = sa.Column(sa.String())
    in_latest_datasource = sa.Column(sa.Boolean(), nullable=False)

    pipeline_entity_matches = relationship('PipelineEntityMatch')
    pipeline_entity_type = relationship(
        'PipelineEntityType',
        viewonly=True,
        foreign_keys='RawPipelineEntity.entity_type_id',
    )


class CanonicalPipelineEntity(Base):
    """Represents a canonical pipeline entity which raw entities can be matched
    to
    """

    __tablename__ = 'canonical_pipeline_entity'

    # The combination of these two attributes uniquely identifies an entity
    __table_args__ = (
        sa.UniqueConstraint(
            'entity_type_id', 'canonical_id', name="unique_canonical_pipeline_entity"
        ),
    )

    id = sa.Column(sa.Integer(), primary_key=True)
    entity_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'pipeline_entity_type.id',
            ondelete='RESTRICT',
            name='canonical_entity_type_key',
        ),
        nullable=False,
    )
    canonical_id = sa.Column(sa.String(), nullable=False)
    entity_metadata = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    search_term = sa.Column(sa.String())
    in_latest_datasource = sa.Column(sa.Boolean(), nullable=False)

    pipeline_entity_matches = relationship('PipelineEntityMatch')
    pipeline_entity_type = relationship(
        'PipelineEntityType',
        viewonly=True,
        foreign_keys='CanonicalPipelineEntity.entity_type_id',
    )


class PipelineEntityMatch(Base):
    """Represents the matches between raw pipeline entities and their
    respective canonical pipeline entities
    """

    __tablename__ = 'pipeline_entity_match'

    id = sa.Column(sa.Integer(), primary_key=True)
    canonical_entity_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('canonical_pipeline_entity.id', ondelete='CASCADE'),
        index=True,
        nullable=False,
    )
    raw_entity_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('raw_pipeline_entity.id', ondelete='CASCADE'),
        nullable=False,
    )
    validated_status = sa.Column(
        sa.Enum(MatchStatusEnum, name='match_status_enum'), nullable=False
    )
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='SET NULL', name='valid_user'),
        nullable=True,
    )
    date_changed = sa.Column(sa.DateTime(), nullable=False)
    self_match = sa.Column(sa.Boolean(), nullable=False)

    user = relationship('User', viewonly=True)
    canonical_pipeline_entity = relationship(
        'CanonicalPipelineEntity',
        viewonly=True,
        foreign_keys='PipelineEntityMatch.canonical_entity_id',
    )
    raw_pipeline_entity = relationship(
        'RawPipelineEntity',
        viewonly=True,
        foreign_keys='PipelineEntityMatch.raw_entity_id',
    )


class BannedRawPipelineEntityMatch(Base):
    '''Represents mappings between raw entities which should never be matched.'''

    __tablename__ = 'banned_raw_pipeline_entity_match'

    # There should only be maximum of one entry for the same pair of entities.
    __table_args__ = (
        sa.UniqueConstraint(
            'raw_entity_id_a',
            'raw_entity_id_b',
            name="unique_banned_match",
        ),
    )

    id = sa.Column(sa.Integer(), primary_key=True)
    raw_entity_id_a = sa.Column(
        sa.Integer(),
        sa.ForeignKey('raw_pipeline_entity.id', ondelete='CASCADE'),
        nullable=False,
    )
    raw_entity_id_b = sa.Column(
        sa.Integer(),
        sa.ForeignKey('raw_pipeline_entity.id', ondelete='CASCADE'),
        nullable=False,
    )
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='SET NULL', name='valid_user'),
        nullable=True,
    )
    date_changed = sa.Column(sa.DateTime(), nullable=False)

    user = relationship('User', viewonly=True)
    raw_entity_a = relationship(
        'RawPipelineEntity',
        foreign_keys='BannedRawPipelineEntityMatch.raw_entity_id_a',
        backref='banned_raw_pipeline_entity_matches_id_a',
    )
    raw_entity_b = relationship(
        'RawPipelineEntity',
        foreign_keys='BannedRawPipelineEntityMatch.raw_entity_id_b',
        backref='banned_raw_pipeline_entity_matches_id_b',
    )
