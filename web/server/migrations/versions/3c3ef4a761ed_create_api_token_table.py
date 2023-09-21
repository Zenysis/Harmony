# pylint: disable=invalid-name
"""Creates a new table to store generated API tokens states

Revision ID: 3c3ef4a761ed
Revises: 70835f75f7c6
Create Date: 2023-03-15 14:31:00.035067

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3c3ef4a761ed'
down_revision = 'ae9a40cd9103'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'api_token',
        sa.Column('id', sa.String(length=10), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False),
        sa.Column(
            'created',
            sa.DateTime(),
            server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            'last_modified',
            sa.DateTime(),
            server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], ['user.id'], name='valid_user', ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('api_token')
