"""This migration adds the initial tables for pipeline entity matching


Revision ID: fce9e77aafea
Revises: 6b05b608e3b3
Create Date: 2020-11-11 11:56:40.496741

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fce9e77aafea'
down_revision = '6b05b608e3b3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'pipeline_entity_type',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    op.create_table(
        'canonical_pipeline_entity',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('canonical_id', sa.String(), nullable=False),
        sa.Column(
            'entity_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'raw_pipeline_entity',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('source_entity_id', sa.String(), nullable=False),
        sa.Column(
            'entity_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ['entity_type_id'], ['pipeline_entity_type.id'], ondelete='RESTRICT'
        ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'pipeline_entity_match',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('canonical_entity_id', sa.Integer(), nullable=False),
        sa.Column('raw_entity_id', sa.Integer(), nullable=False),
        sa.Column('validated_status', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(
            ['canonical_entity_id'],
            ['canonical_pipeline_entity.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['raw_entity_id'], ['raw_pipeline_entity.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('raw_entity_id'),
    )


def downgrade():
    op.drop_table('pipeline_entity_match')
    op.drop_table('raw_pipeline_entity')
    op.drop_table('canonical_pipeline_entity')
    op.drop_table('pipeline_entity_type')
