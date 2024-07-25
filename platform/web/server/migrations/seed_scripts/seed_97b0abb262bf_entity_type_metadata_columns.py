import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base

from log import LOG
from web.server.migrations.seed_scripts import reset_table_sequence_id

Base = declarative_base()


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


class MetaDataPipelineEntityTypeMapping(Base):
    '''Represents a mapping from a pipeline_entity_type_id to a metadata_column_id
    valid for that entity type.
    '''

    __tablename__ = 'metadata_pipeline_entity_type_mappings'

    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    metadata_column_id = sa.Column(
        sa.String(),
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


NEW_METADATA_COLUMNS = [
    MetaDataColumn(name='date', sortable=False, filterable=False),
    MetaDataColumn(name='FatherName', sortable=False, filterable=True),
    MetaDataColumn(name='ChildName', sortable=False, filterable=True),
    MetaDataColumn(name='Campaign', sortable=False, filterable=True),
    MetaDataColumn(name='CanonicalUnionCouncilName', sortable=True, filterable=True),
    MetaDataColumn(name='CanonicalTehsilName', sortable=False, filterable=True),
    MetaDataColumn(name='CanonicalDistrictName', sortable=False, filterable=True),
    MetaDataColumn(name='Supervisor', sortable=False, filterable=True),
    MetaDataColumn(name='Address', sortable=False, filterable=True),
    MetaDataColumn(name='HouseNumber', sortable=False, filterable=True),
    MetaDataColumn(name='BirthDate', sortable=True, filterable=False),
    MetaDataColumn(name='AgeMonths', sortable=False, filterable=True),
]

# NOTE: currently entity type is not included in the seed
# cause there is already one entity type "child"
# in the previous migrations. It is what we are seeding for now.
DEFAULT_ENTITY_TYPE_ID = 1


def add_new_metadata_columns(transaction):
    reset_table_sequence_id(MetaDataColumn, transaction)
    for metadata_column in NEW_METADATA_COLUMNS:
        transaction.add_or_update(metadata_column)
    LOG.debug("Added new metadata columns")


def delete_new_metadata_columns(transaction):
    for metadata_column in NEW_METADATA_COLUMNS:
        entity = transaction.find_one_by_fields(
            MetaDataColumn, True, {'name': metadata_column.name}
        )
        if entity:
            transaction.delete(entity)
    LOG.debug("Deleted metadata columns")


def add_metadata_entity_mappings(transaction):
    reset_table_sequence_id(MetaDataPipelineEntityTypeMapping, transaction)

    default_entity_type = transaction.find_one_by_fields(
        PipelineEntityType, True, {'id': DEFAULT_ENTITY_TYPE_ID}
    )

    if not default_entity_type:
        return

    for metadata_column in NEW_METADATA_COLUMNS:
        saved_column = transaction.find_one_by_fields(
            MetaDataColumn, True, {'name': metadata_column.name}
        )
        if not saved_column:
            raise ValueError(f"Could not find role '{metadata_column.name}'")

        metadata_column_id = saved_column.id

        mapping = MetaDataPipelineEntityTypeMapping(
            metadata_column_id=metadata_column_id,
            pipeline_entity_type_id=DEFAULT_ENTITY_TYPE_ID,
        )

        transaction.add_or_update(mapping)

    LOG.debug('Added new metadata entity mappings')


def delete_metadata_entity_mappings(transaction):
    for metadata_column in NEW_METADATA_COLUMNS:
        saved_column = transaction.find_one_by_fields(
            MetaDataColumn, True, {'name': metadata_column.name}
        )

        if not saved_column:
            raise ValueError(f"Could not find mapping '{metadata_column.name}'")

        metadata_column_id = saved_column.id

        mapping = transaction.find_one_by_fields(
            MetaDataPipelineEntityTypeMapping,
            True,
            {
                'metadata_column_id': metadata_column_id,
                'pipeline_entity_type_id': DEFAULT_ENTITY_TYPE_ID,
            },
        )
        if mapping:
            transaction.delete(mapping)

    LOG.debug('Deleted metadata entity mappings')


def upvert_data(alembic_operation):
    return


def downvert_data(alembic_operation):
    return
