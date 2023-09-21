"""Adds an `in_latest`_datasource` column to the raw_pipeline_entity db table.

Revision ID: 5f298008d3b8
Revises: 703e797521a0
Create Date: 2021-04-29 15:34:49.990852

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5f298008d3b8'
down_revision = '703e797521a0'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('raw_pipeline_entity', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'in_latest_datasource',
                sa.Boolean(),
                server_default='true',
                nullable=False,
            )
        )
    with op.batch_alter_table('canonical_pipeline_entity', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'in_latest_datasource',
                sa.Boolean(),
                server_default='true',
                nullable=False,
            )
        )


def downgrade():
    with op.batch_alter_table('raw_pipeline_entity', schema=None) as batch_op:
        batch_op.drop_column('in_latest_datasource')

    with op.batch_alter_table('canonical_pipeline_entity', schema=None) as batch_op:
        batch_op.drop_column('in_latest_datasource')
