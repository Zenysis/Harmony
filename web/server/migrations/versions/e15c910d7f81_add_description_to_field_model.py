"""Add description to data catalog field model

Revision ID: e15c910d7f81
Revises: 6722855f6ce5
Create Date: 2020-09-11 15:17:24.685254

"""
from alembic import op
import sqlalchemy as sa

# pylint: disable=invalid-name
# revision identifiers, used by Alembic.
revision = 'e15c910d7f81'
down_revision = '6722855f6ce5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('field', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('description', sa.String(), server_default='', nullable=True)
        )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('field', schema=None) as batch_op:
        batch_op.drop_column('description')

    # ### end Alembic commands ###
