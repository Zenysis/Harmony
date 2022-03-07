# pylint: disable=invalid-name
"""
Adds non-nullable constraints to fields in the SelfServeSource and DataUploadFileSummary
data upload tables

Revision ID: 04ccddbe1441
Revises: aae58915bafb
Create Date: 2021-04-15 11:07:36.046024

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '04ccddbe1441'
down_revision = 'aae58915bafb'
branch_labels = None
depends_on = None


# pylint: disable=no-member
def upgrade():
    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.alter_column(
            'column_mapping',
            existing_type=postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        )
        batch_op.alter_column('file_path', existing_type=sa.TEXT(), nullable=False)
        batch_op.alter_column(
            'source_id', existing_type=sa.VARCHAR(length=100), nullable=False
        )

    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        batch_op.alter_column(
            'file_summary_id', existing_type=sa.INTEGER(), nullable=False
        )
        batch_op.alter_column(
            'source_id', existing_type=sa.VARCHAR(length=100), nullable=False
        )
        batch_op.alter_column(
            'source_name', existing_type=sa.VARCHAR(length=100), nullable=False
        )


def downgrade():
    with op.batch_alter_table('self_serve_source', schema=None) as batch_op:
        batch_op.alter_column(
            'source_name', existing_type=sa.VARCHAR(length=100), nullable=True
        )
        batch_op.alter_column(
            'source_id', existing_type=sa.VARCHAR(length=100), nullable=True
        )
        batch_op.alter_column(
            'file_summary_id', existing_type=sa.INTEGER(), nullable=True
        )

    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.alter_column(
            'source_id', existing_type=sa.VARCHAR(length=100), nullable=True
        )
        batch_op.alter_column('file_path', existing_type=sa.TEXT(), nullable=True)
        batch_op.alter_column(
            'column_mapping',
            existing_type=postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        )
