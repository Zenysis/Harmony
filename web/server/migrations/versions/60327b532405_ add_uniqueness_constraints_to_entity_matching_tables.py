"""This migration adds uniqueness constraints to canonical_pipeline_entity and
raw_pipeline_entity as well as fixing an issue where we had an entity_type
column on canonical_pipeline_entity instead of an entity_type_id foreign key on
the pipeline_entity_type table

Revision ID: 60327b532405
Revises: fce9e77aafea
Create Date: 2020-11-23 17:33:02.209673

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '60327b532405'
down_revision = 'fce9e77aafea'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('canonical_pipeline_entity', schema=None) as batch_op:
        batch_op.add_column(sa.Column('entity_type_id', sa.Integer(), nullable=False))
        batch_op.create_unique_constraint(
            'unique_canonical_pipeline_entity', ['entity_type_id', 'canonical_id']
        )
        batch_op.create_foreign_key(
            'canonical_entity_type_key',
            'pipeline_entity_type',
            ['entity_type_id'],
            ['id'],
            ondelete='RESTRICT',
        )
        batch_op.drop_column('entity_type')

    with op.batch_alter_table('raw_pipeline_entity', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'unique_raw_pipeline_entity',
            ['entity_type_id', 'source_entity_id', 'source'],
        )


def downgrade():
    with op.batch_alter_table('raw_pipeline_entity', schema=None) as batch_op:
        batch_op.drop_constraint('unique_raw_pipeline_entity', type_='unique')

    with op.batch_alter_table('canonical_pipeline_entity', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('entity_type', sa.VARCHAR(), autoincrement=False, nullable=False)
        )
        batch_op.drop_constraint('canonical_entity_type_key', type_='foreignkey')
        batch_op.drop_constraint('unique_canonical_pipeline_entity', type_='unique')
        batch_op.drop_column('entity_type_id')
