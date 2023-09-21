"""Case management remodeling

Revision ID: f3e8008ed008
Revises: 951e632061d2
Create Date: 2020-06-25 13:39:51.193829

"""
from alembic import op
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.dialects.postgresql import JSONB
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3e8008ed008'
down_revision = '951e632061d2'
branch_labels = None
depends_on = None


def upgrade():
    # rename case_type's druid_dimension to primary_druid_dimension
    with op.batch_alter_table('case_type', schema=None) as batch_op:
        batch_op.alter_column(
            'druid_dimension', nullable=True, new_column_name='primary_druid_dimension'
        )
        batch_op.drop_constraint('case_type_druid_dimension_key', type_='unique')
        batch_op.create_unique_constraint(
            'case_type_primary_druid_dimension_key', ['primary_druid_dimension']
        )

    # rename table case_type_default_druid_dimension to case_type_metadata_from_druid_dimension
    op.rename_table(
        'case_type_default_druid_dimension', 'case_type_metadata_from_druid_dimension'
    )
    op.execute(
        'ALTER SEQUENCE case_type_default_druid_dimension_id_seq RENAME TO case_type_metadata_from_druid_dimension_id_seq'
    )
    op.execute(
        'ALTER INDEX case_type_default_druid_dimension_pkey RENAME TO case_type_metadata_from_druid_dimension_pkey'
    )

    # add a 'treat_as_primary_dimension' column to case_type_metadata_from_druid_dimension
    # fill it with default 'true' values, and then set it to not be nullable
    with op.batch_alter_table(
        'case_type_metadata_from_druid_dimension', schema=None
    ) as batch_op:
        batch_op.add_column(
            sa.Column('treat_as_primary_dimension', sa.Boolean(), nullable=True)
        )
    op.execute(
        'UPDATE case_type_metadata_from_druid_dimension SET treat_as_primary_dimension=true'
    )
    op.alter_column(
        'case_type_metadata_from_druid_dimension',
        'treat_as_primary_dimension',
        nullable=False,
    )

    # drop all druid case rows
    op.execute('DELETE FROM "case" WHERE alert_notification_id is null')

    with op.batch_alter_table('case', schema=None) as batch_op:
        # drop the 'druid_dimension_id' column from 'case' table
        batch_op.drop_column('druid_dimension_id')

        # add a 'primary_druid_dimension_values' column
        batch_op.add_column(
            sa.Column(
                'primary_druid_dimension_values',
                MutableDict.as_mutable(JSONB()),
                nullable=True,
            )
        )

    # ### end Alembic commands ###


def downgrade():
    # drop all druid case rows
    op.execute('DELETE FROM "case" WHERE alert_notification_id is null')

    with op.batch_alter_table('case', schema=None) as batch_op:
        # drop the 'primary_druid_dimension_values' column from 'case' table
        batch_op.drop_column('primary_druid_dimension_values')

        # add back the 'druid_dimension_id' column
        batch_op.add_column(
            sa.Column('druid_dimension_id', sa.Text(), unique=True, nullable=True)
        )

    # drop the 'treat_as_primary_dimension' column from case_type_metadata_from_druid_dimension
    with op.batch_alter_table(
        'case_type_metadata_from_druid_dimension', schema=None
    ) as batch_op:
        batch_op.drop_column('treat_as_primary_dimension')

    # rename table case_type_metadata_from_druid_dimension to case_type_default_druid_dimension
    op.rename_table(
        'case_type_metadata_from_druid_dimension', 'case_type_default_druid_dimension'
    )
    op.execute(
        'ALTER SEQUENCE case_type_metadata_from_druid_dimension_id_seq RENAME TO case_type_default_druid_dimension_id_seq'
    )
    op.execute(
        'ALTER INDEX case_type_metadata_from_druid_dimension_pkey RENAME TO case_type_default_druid_dimension_pkey'
    )

    with op.batch_alter_table('case_type', schema=None) as batch_op:
        batch_op.alter_column(
            'primary_druid_dimension', nullable=True, new_column_name='druid_dimension'
        )
        batch_op.drop_constraint(
            'case_type_primary_druid_dimension_key', type_='unique'
        )
        batch_op.create_unique_constraint(
            'case_type_druid_dimension_key', ['druid_dimension']
        )

    # ### end Alembic commands ###
