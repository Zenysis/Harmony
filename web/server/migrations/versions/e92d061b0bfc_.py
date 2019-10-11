"""Add 'flagged_locations' table for location matching.

Revision ID: e92d061b0bfc
Revises: 7bc724e03ded
Create Date: 2019-09-12 14:35:30.290419

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e92d061b0bfc'
down_revision = '7bc724e03ded'
branch_labels = None
depends_on = None


def upgrade():
    # ### Create a flagged_locations table for location matching flags. ###
    op.create_table(
        'flagged_locations',
        sa.Column('unmatched_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['unmatched_id'], ['unmatched_locations.id']),
        sa.ForeignKeyConstraint(
            ['user_id'], ['user.id'], name='valid_user', ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('unmatched_id'),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### Remove flagged_locations table for location matching flags. ###
    op.drop_table('flagged_locations')
    # ### end Alembic commands ###
