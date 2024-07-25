"""This migration adds an index to the canonical_entity_id column of
pipeline_entity_match to improve query performance

Revision ID: c6c1151430dd
Revises: aad4ae0ffda6
Create Date: 2021-03-01 11:21:58.963690

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'c6c1151430dd'
down_revision = 'aad4ae0ffda6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_pipeline_entity_match_canonical_entity_id'),
            ['canonical_entity_id'],
            unique=False,
        )


def downgrade():
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_pipeline_entity_match_canonical_entity_id'))
