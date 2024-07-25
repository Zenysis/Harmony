# pylint: disable=invalid-name
"""
Update dataprep_job table to enable adding jobs that fail before even being
created as a job in dataprep. These jobs would have a null job_id,
created_on_dataprep, and last_modified_on_dataprep.

Revision ID: 3071258606d2
Revises: 99859a8ef2fc
Create Date: 2023-05-02 11:28:45.076100
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3071258606d2'
down_revision = '99859a8ef2fc'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('dataprep_job', schema=None) as batch_op:
        batch_op.alter_column(
            'created_on_dataprep', existing_type=postgresql.TIMESTAMP(), nullable=True
        )
        batch_op.alter_column(
            'last_modified_on_dataprep',
            existing_type=postgresql.TIMESTAMP(),
            nullable=True,
        )
        batch_op.alter_column('job_id', existing_type=sa.INTEGER(), nullable=True)
        batch_op.drop_constraint('dataprep_job_job_id_key', type_='unique')


def downgrade():
    op.execute('DELETE FROM dataprep_job WHERE job_id IS NULL')
    with op.batch_alter_table('dataprep_job', schema=None) as batch_op:
        batch_op.alter_column('job_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.create_unique_constraint('dataprep_job_job_id_key', ['job_id'])
        batch_op.alter_column(
            'last_modified_on_dataprep',
            existing_type=postgresql.TIMESTAMP(),
            nullable=False,
        )
        batch_op.alter_column(
            'created_on_dataprep', existing_type=postgresql.TIMESTAMP(), nullable=False
        )
