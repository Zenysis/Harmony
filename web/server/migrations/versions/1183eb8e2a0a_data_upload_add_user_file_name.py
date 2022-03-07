# pylint: disable=invalid-name
"""
For data upload, add user_file_name column to data_upload_file_summary.

Revision ID: 1183eb8e2a0a
Revises: 2be1fb67c14f
Create Date: 2021-07-19 10:08:05.852911

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1183eb8e2a0a'
down_revision = '2be1fb67c14f'
branch_labels = None
depends_on = None


# pylint: disable=no-member
def upgrade():
    # Initially add the column as nullable, set the values, and then set the
    # column to be non-nullable
    op.add_column('data_upload_file_summary', sa.Column('user_file_name', sa.Text()))
    with op.batch_alter_table('data_upload_file_summary', schema=None) as batch_op:
        batch_op.execute(
            "UPDATE data_upload_file_summary SET user_file_name = file_path"
        )
        batch_op.alter_column('user_file_name', existing_nullable=True, nullable=False)


def downgrade():
    # Delete the columns
    op.drop_column('data_upload_file_summary', 'user_file_name')
