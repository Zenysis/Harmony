"""Add a field representing if a match is a self match or not.

Revision ID: 522563aa77c7
Revises: 1d52cbac7f72
Create Date: 2021-02-07 20:22:29.678305

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '522563aa77c7'
down_revision = '1d52cbac7f72'
branch_labels = None
depends_on = None


def upgrade():
    # Create a new boolean column representing if a match is a self match or not
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.add_column(sa.Column('self_match', sa.Boolean(), nullable=True))
        batch_op.alter_column(
            'self_match', nullable=False, type_=sa.Boolean(), postgresql_using=("false")
        )

    # ### end Alembic commands ###


def downgrade():
    # Delete the column that represents if a match is a self match or not.
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.drop_column('self_match')

    # ### end Alembic commands ###
