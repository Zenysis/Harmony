# pylint: disable=invalid-name
"""Set file summary in self serve source to not nullable

Revision ID: 0899aad0cf2f
Revises: 59f23455295a
Create Date: 2021-09-21 11:45:42.289360

"""
from alembic import op
import sqlalchemy as sa
from web.server.migrations.seed_scripts.seed_0899aad0cf2f_populate_null_file_summary import (
    upvert_data,
)

# revision identifiers, used by Alembic.
revision = '0899aad0cf2f'
down_revision = '59f23455295a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        upvert_data(batch_op)
        batch_op.alter_column(
            'file_summary_id', existing_type=sa.INTEGER(), nullable=False
        )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        batch_op.alter_column(
            'file_summary_id', existing_type=sa.INTEGER(), nullable=True
        )
    # ### end Alembic commands ###