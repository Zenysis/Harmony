# pylint: disable=invalid-name
"""Update Data Upload models to enable the uploading of multiple (dataprep)
 files to one self-serve data source (ie appending behavior).

Revision ID: eb1742dac26e
Revises: d325772895f7
Create Date: 2022-09-06 16:27:49.546839

"""
from alembic import op
import sqlalchemy as sa

from web.server.migrations.seed_scripts.seed_eb1742dac26e_enable_data_upload_appending import (
    upvert_data,
    downvert_data,
)

# revision identifiers, used by Alembic.
revision = 'eb1742dac26e'
down_revision = 'd325772895f7'
branch_labels = None
depends_on = None


def upgrade():
    # data_upload_file_summary table: introduce new self_serve_source column
    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('self_serve_source_id', sa.Integer(), nullable=True)
        )

    # self_serve_source table: Remove self_serve_source_file_summary_id
    # fkey constraint to enable upvert seed script to run without error.
    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        batch_op.drop_constraint(
            'self_serve_source_file_summary_id_fkey', type_='foreignkey'
        )

    upvert_data(op)

    # self_serve_source table: Remove fkey now that file summary relationship
    # is modeled in data_upload_file_summary (one-to-many)
    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        batch_op.drop_column('file_summary_id')

    # data_upload_file_summary table: establish self_serve_source fkey constraint
    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'valid_self_serve_source',
            'self_serve_source',
            ['self_serve_source_id'],
            ['id'],
            ondelete='CASCADE',
        )

    # dataprep_flow table: Add “appendable” boolean column
    op.add_column('dataprep_flow', sa.Column('appendable', sa.Boolean()))
    with op.batch_alter_table('dataprep_flow', schema=None) as batch_op:
        batch_op.execute("UPDATE dataprep_flow SET appendable = FALSE")
        batch_op.alter_column('appendable', existing_nullable=True, nullable=False)


def downgrade():
    # Drop new column
    with op.batch_alter_table('dataprep_flow', schema=None) as batch_op:
        batch_op.drop_column('appendable')

    # Drop fkey constraint on new column to enable recreate=always param
    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.drop_constraint('valid_self_serve_source', type_='foreignkey')

    # Re-add dropped column
    with op.batch_alter_table(
        'self_serve_source', recreate='always', schema=None
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                'file_summary_id', sa.INTEGER(), autoincrement=False, nullable=True
            ),
            insert_after='source_id',
        )

    downvert_data(op)

    # Reintroduce former foreign key constraint
    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'self_serve_source_file_summary_id_fkey',
            'data_upload_file_summary',
            ['file_summary_id'],
            ['id'],
            ondelete='CASCADE',
        )

    # Drop new column
    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.drop_column('self_serve_source_id')
