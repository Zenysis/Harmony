"""Add raw formula field to indicator.

Revision ID: 7bc724e03ded
Revises: 43f128934e5d
Create Date: 2019-07-18 21:38:11.370661

"""
from alembic import op
import sqlalchemy as sa

# pylint: disable=C0301
# pylint: disable=C0103
# revision identifiers, used by Alembic.
revision = '7bc724e03ded'
down_revision = '43f128934e5d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('indicators', schema=None) as batch_op:
        batch_op.add_column(sa.Column('raw_formula', sa.String(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('indicators', schema=None) as batch_op:
        batch_op.drop_column('raw_formula')
    # ### end Alembic commands ###