"""
This migration adds a new banned_raw_pipeline_entity_match table which represents
raw pipeline entities that should not be matched together.

Revision ID: a53982a375ec
Revises: f193e47caa08
Create Date: 2021-10-18 15:45:23.311540

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a53982a375ec'
down_revision = 'f193e47caa08'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'banned_raw_pipeline_entity_match',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('raw_entity_id_a', sa.Integer(), nullable=False),
        sa.Column('raw_entity_id_b', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('date_changed', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ['raw_entity_id_a'], ['raw_pipeline_entity.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['raw_entity_id_b'], ['raw_pipeline_entity.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], ['user.id'], name='valid_user', ondelete='SET NULL'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'raw_entity_id_a', 'raw_entity_id_b', name='unique_banned_match'
        ),
    )


def downgrade():
    op.drop_table('banned_raw_pipeline_entity_match')
