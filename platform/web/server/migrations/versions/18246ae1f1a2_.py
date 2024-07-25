"""Add userId column to feeds table.

Revision ID: 18246ae1f1a2
Revises: 678bbb66356c
Create Date: 2020-02-12 17:12:49.412841

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '18246ae1f1a2'
down_revision = '678bbb66356c'
branch_labels = None
depends_on = None


def upgrade():
    # ### Add userId column. ###
    with op.batch_alter_table('feed_update', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Boolean(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### Remove userId column. ###
    with op.batch_alter_table('feed_update', schema=None) as batch_op:
        batch_op.drop_column('user_id')

    # ### end Alembic commands ###
