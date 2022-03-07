from enum import Enum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base


class VisiblityStatusEnum(Enum):
    '''An enumeration of possible statuses that a category or field can be
    associated with.
    '''

    # Indicates that a category or field is visible to users and ready to use.
    VISIBLE = 1

    # Indicates that a category or field is intentionally set to be not visible
    # to users.
    HIDDEN = 2


class Field(Base):
    '''The Field model stores information about a calculable field.'''

    __tablename__ = 'field'

    id = sa.Column(sa.String(), primary_key=True)
    description = sa.Column(sa.String(), server_default='')
    name = sa.Column(sa.String(), nullable=False)
    short_name = sa.Column(sa.String(), nullable=False)
    calculation = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    copied_from_field_id = sa.Column(
        sa.String(),
        sa.ForeignKey('field.id', ondelete='CASCADE', name='copied_from_field'),
    )

    copied_from_field = relationship(
        "Field", remote_side=[id], backref=backref('copies')
    )


class UnpublishedField(Base):
    '''Represents an unpublished field that stores information about a calculable field.
    All properties (except id) are nullable.
    '''

    __tablename__ = 'unpublished_field'

    id = sa.Column(sa.String(), primary_key=True)
    description = sa.Column(sa.String(), nullable=True)
    name = sa.Column(sa.String(), nullable=True)
    short_name = sa.Column(sa.String(), nullable=True)
    calculation = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)


class Dimension(Base):
    '''Represents a queryable druid dimension for a deployment.'''

    __tablename__ = 'dimension'

    id = sa.Column(sa.String(), primary_key=True)
    name = sa.Column(sa.String(), nullable=False)
    description = sa.Column(sa.String(), server_default='')
    authorizable = sa.Column(sa.Boolean(), server_default='false', nullable=False)
    filterable = sa.Column(sa.Boolean(), server_default='false', nullable=False)


class GeoDimensionMetadata(Base):
    '''Represents a geographical dimension and additional relevant metadata.
    This includes the dimension id, lat/long dimensions.
    '''

    __tablename__ = 'geo_dimension_metadata'

    id = sa.Column(
        sa.String(),
        sa.ForeignKey('dimension.id', ondelete='CASCADE', name='valid_geo_dimension'),
        primary_key=True,
    )
    lat_id = sa.Column(
        sa.String(),
        sa.ForeignKey('dimension.id', ondelete='CASCADE', name='valid_lat_dimension'),
        nullable=False,
    )
    lon_id = sa.Column(
        sa.String(),
        sa.ForeignKey('dimension.id', ondelete='CASCADE', name='valid_lon_dimension'),
        nullable=False,
    )
    dimension = relationship('Dimension', foreign_keys=[id], viewonly=True)
    lat_dimension = relationship('Dimension', foreign_keys=[lat_id], viewonly=True)
    lon_dimension = relationship('Dimension', foreign_keys=[lon_id], viewonly=True)


class HierarchicalDimensionMetadata(Base):
    '''Represents a hierarchical dimension and relevant metadata, including
    dimension id, the unique identifier dimension id, and parent dimension.
    '''

    __tablename__ = 'hierarchical_dimension_metadata'

    id = sa.Column(sa.Integer(), primary_key=True)
    dimension_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'dimension.id', ondelete="CASCADE", name='valid_hierarchical_dimension'
        ),
        nullable=False,
    )
    unique_identifier_dimension_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'dimension.id',
            ondelete="CASCADE",
            name='valid_unique_identifier_dimension_id',
        ),
        nullable=False,
    )
    parent_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'hierarchical_dimension_metadata.id',
            ondelete="CASCADE",
            name='valid_hierarchical_dimension_parent',
        ),
    )
    dimension = relationship('Dimension', foreign_keys=[dimension_id], viewonly=True)
    unique_identifier_dimension = relationship(
        'Dimension', foreign_keys=[unique_identifier_dimension_id], viewonly=True
    )
    parent = relationship(
        'HierarchicalDimensionMetadata', remote_side=[id], viewonly=True
    )


class NonHierarchicalDimension(Base):
    '''Represents non hierarchical dimensions.'''

    __tablename__ = 'non_hierarchical_dimension'

    id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'dimension.id', ondelete="CASCADE", name='valid_non_hierarchical_dimension'
        ),
        primary_key=True,
    )
    dimension = relationship('Dimension', foreign_keys=[id], viewonly=True)


class FieldDimensionMapping(Base):
    '''Represents a mapping from a field_id to all of the possible dimensions
    valid for that field. Also note that a field can only map to the same
    dimension once.
    '''

    __tablename__ = 'field_dimension_mapping'
    # A field can only match to the same dimension exactly once.
    __table_args__ = (sa.UniqueConstraint('field_id', 'dimension_id'),)

    id = sa.Column(sa.Integer(), primary_key=True)
    field_id = sa.Column(
        sa.String(),
        sa.ForeignKey('field.id', ondelete='CASCADE', name='valid_field'),
        nullable=False,
    )
    dimension_id = sa.Column(
        sa.String(),
        sa.ForeignKey('dimension.id', ondelete='CASCADE', name='valid_dimension'),
        nullable=False,
    )

    field = relationship('Field', backref=backref('dimension_mappings'))
    dimension = relationship('Dimension', backref=backref('field_mappings'))


class UnpublishedFieldDimensionMapping(Base):
    '''Represents a mapping from a unpublished_field_id to all of the possible
    dimensions valid for that unpublished field. Also note that an unpublished
    field can only map to the same dimension once.
    '''

    __tablename__ = 'unpublished_field_dimension_mapping'
    # A field can only match to the same dimension exactly once.
    __table_args__ = (sa.UniqueConstraint('unpublished_field_id', 'dimension_id'),)

    id = sa.Column(sa.Integer(), primary_key=True)
    unpublished_field_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'unpublished_field.id', ondelete='CASCADE', name='valid_unpublished_field'
        ),
        nullable=False,
    )
    dimension_id = sa.Column(
        sa.String(),
        sa.ForeignKey('dimension.id', ondelete='CASCADE', name='valid_dimension'),
        nullable=False,
    )

    unpublished_field = relationship(
        'UnpublishedField', backref=backref('dimension_mappings')
    )
    dimension = relationship('Dimension', backref=backref('unpublished_field_mappings'))


class PipelineDatasource(Base):
    '''Represents a pipeline data source that produces the raw data.'''

    __tablename__ = 'pipeline_datasource'

    id = sa.Column(sa.String(), primary_key=True)
    name = sa.Column(sa.String(), nullable=False)


class FieldPipelineDatasourceMapping(Base):
    '''Represents a mapping between a field to all pipeline data sources that
    produce data for it.
    '''

    __tablename__ = 'field_pipeline_datasource_mapping'
    # A field can only match to the same datasource exactly once.
    __table_args__ = (sa.UniqueConstraint('field_id', 'pipeline_datasource_id'),)

    id = sa.Column(sa.Integer(), primary_key=True)
    field_id = sa.Column(
        sa.String(),
        sa.ForeignKey('field.id', ondelete='CASCADE', name='valid_field'),
        nullable=False,
    )
    pipeline_datasource_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'pipeline_datasource.id',
            ondelete='CASCADE',
            name='valid_pipeline_datasource',
        ),
        nullable=False,
    )
    field = relationship('Field', backref=backref('pipeline_datasource_mapping'))
    pipeline_datasource = relationship(
        'PipelineDatasource', backref=backref('field_mapping')
    )


class UnpublishedFieldPipelineDatasourceMapping(Base):
    '''Represents a mapping between an unpublished field to all pipeline data
    sources that produce data for it.
    '''

    __tablename__ = 'unpublished_field_pipeline_datasource_mapping'
    # A field can only match to the same datasource exactly once.
    __table_args__ = (
        sa.UniqueConstraint('unpublished_field_id', 'pipeline_datasource_id'),
    )

    id = sa.Column(sa.Integer(), primary_key=True)
    unpublished_field_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'unpublished_field.id', ondelete='CASCADE', name='valid_unpublished_field'
        ),
        nullable=False,
    )
    pipeline_datasource_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'pipeline_datasource.id',
            ondelete='CASCADE',
            name='valid_pipeline_datasource',
        ),
        nullable=False,
    )
    unpublished_field = relationship(
        'UnpublishedField', backref=backref('pipeline_datasource_mapping')
    )
    pipeline_datasource = relationship(
        'PipelineDatasource', backref=backref('unpublished_field_mapping')
    )


class Category(Base):
    '''Represents a category grouping of fields.'''

    __tablename__ = 'category'

    id = sa.Column(sa.String(), primary_key=True)
    name = sa.Column(sa.String(), nullable=False)
    parent_id = sa.Column(
        sa.String(),
        sa.ForeignKey('category.id', ondelete='CASCADE', name='parent_category'),
        nullable=True,
    )
    visibility_status = sa.Column(
        sa.Enum(VisiblityStatusEnum, name='visibility_status_enum'),
        nullable=False,
        server_default=VisiblityStatusEnum.VISIBLE.name,
    )
    parent = relationship('Category', remote_side=[id])


class FieldCategoryMapping(Base):
    '''Represents a mapping between a field and all of the categories it is a
    part of.
    '''

    __tablename__ = 'field_category_mapping'
    # A field can only match to the same category exactly once.
    __table_args__ = (sa.UniqueConstraint('field_id', 'category_id'),)

    id = sa.Column(sa.Integer(), primary_key=True)
    field_id = sa.Column(
        sa.String(),
        sa.ForeignKey('field.id', ondelete='CASCADE', name='valid_field'),
        nullable=False,
    )
    category_id = sa.Column(
        sa.String(),
        sa.ForeignKey('category.id', ondelete='CASCADE', name='valid_category'),
        nullable=False,
    )
    visibility_status = sa.Column(
        sa.Enum(VisiblityStatusEnum, name='visibility_status_enum'),
        nullable=False,
        server_default=VisiblityStatusEnum.VISIBLE.name,
    )
    field = relationship('Field', backref=backref('category_mapping'))
    category = relationship('Category', backref=backref('field_mapping'))


class UnpublishedFieldCategoryMapping(Base):
    '''Represents a mapping between an unpublished field and all of the
    categories it is a part of.
    '''

    __tablename__ = 'unpublished_field_category_mapping'
    # A field can only match to the same category exactly once.
    __table_args__ = (sa.UniqueConstraint('unpublished_field_id', 'category_id'),)

    id = sa.Column(sa.Integer(), primary_key=True)
    unpublished_field_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'unpublished_field.id', ondelete='CASCADE', name='valid_unpublished_field'
        ),
        nullable=False,
    )
    category_id = sa.Column(
        sa.String(),
        sa.ForeignKey('category.id', ondelete='CASCADE', name='valid_category'),
        nullable=False,
    )
    unpublished_field = relationship(
        'UnpublishedField', backref=backref('category_mapping')
    )
    category = relationship('Category', backref=backref('unpublished_field_mapping'))


class DimensionCategory(Base):
    '''Represents a category type that can hold a dimension.'''

    __tablename__ = 'dimension_category'

    id = sa.Column(sa.String(), primary_key=True)
    name = sa.Column(sa.String(), nullable=False)
    parent_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'dimension_category.id', ondelete='CASCADE', name='parent_category'
        ),
        nullable=True,
    )
    parent = relationship('DimensionCategory', remote_side=[id])


class DimensionCategoryMapping(Base):
    '''Represents a mapping between a dimension and all of the categories it is a
    part of.
    '''

    __tablename__ = 'dimension_category_mapping'
    # A dimension can only match to the same category exactly once.
    __table_args__ = (sa.UniqueConstraint('dimension_id', 'category_id'),)

    id = sa.Column(sa.Integer(), primary_key=True)
    dimension_id = sa.Column(
        sa.String(),
        sa.ForeignKey('dimension.id', ondelete='CASCADE', name='valid_dimension'),
        nullable=False,
    )
    category_id = sa.Column(
        sa.String(),
        sa.ForeignKey(
            'dimension_category.id', ondelete='CASCADE', name='valid_category'
        ),
        nullable=False,
    )
    dimension = relationship('Dimension', backref=backref('category_mapping'))
    category = relationship('DimensionCategory', backref=backref('dimension_mapping'))
