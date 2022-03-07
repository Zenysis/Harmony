# pylint: disable=invalid-name
"""
For alert definitions:
 - switch to storing a list of fields instead of a singular field
 - switch to a list of DimensionValueFilterItems in filters instead of a list of dimension_values
 - add optional title
 - add "type" to alert checks
 - add non-nullable constraints

Revision ID: 50f9404b84ae
Revises: 1d82c5f424f4
Create Date: 2021-06-22 14:25:03.297617

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from web.server.migrations.seed_scripts.seed_50f9404b84ae_alerts_switch_to_fields_filters_and_add_title import (
    upvert_data,
    downvert_data,
)

# pylint: disable=C0103
# pylint: disable=E1101
# revision identifiers, used by Alembic.
revision = '50f9404b84ae'
down_revision = '1d82c5f424f4'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        # Has been fully converted to field so can now be removed
        batch_op.drop_column('field_id')

        # These column are being converted from existing columns, but add them so the conversion
        # can happen in a seed script.
        batch_op.add_column(
            sa.Column('fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
        )
        batch_op.add_column(
            sa.Column('filters', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
        )

    upvert_data(op)

    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('title', sa.String(), nullable=True))

        # Add non-nullable constraints
        batch_op.alter_column(
            'checks',
            existing_nullable=True,
            nullable=False,
        )
        batch_op.alter_column(
            'time_granularity',
            existing_nullable=True,
            nullable=False,
        )
        batch_op.alter_column(
            'user_id',
            existing_nullable=True,
            nullable=False,
        )
        # Add them for the new columns now that upvert is done
        batch_op.alter_column(
            'fields',
            existing_nullable=True,
            nullable=False,
        )
        batch_op.alter_column(
            'filters',
            existing_nullable=True,
            nullable=False,
        )

        # Delete old columns now the data has been converted
        batch_op.drop_column('field')
        batch_op.drop_column('dimension_values')


def downgrade():
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'dimension_values',
                postgresql.ARRAY(sa.VARCHAR()),
                autoincrement=False,
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                'field',
                postgresql.JSONB(astext_type=sa.Text()),
                autoincrement=False,
                nullable=True,
            )
        )

        # Remove non-nullable constraints
        batch_op.alter_column(
            'checks',
            existing_nullable=False,
            nullable=True,
        )
        batch_op.alter_column(
            'time_granularity',
            existing_nullable=False,
            nullable=True,
        )
        batch_op.alter_column(
            'user_id',
            existing_nullable=False,
            nullable=True,
        )

        batch_op.drop_column('title')

    downvert_data(batch_op)

    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.drop_column('filters')
        batch_op.drop_column('fields')

        batch_op.add_column(
            sa.Column('field_id', sa.VARCHAR(), autoincrement=False, nullable=True)
        )
