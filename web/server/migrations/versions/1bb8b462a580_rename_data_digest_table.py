# pylint: disable=invalid-name
"""
Rename the Data Digest Overview table to Pipeline Run Metadata

Revision ID: 1bb8b462a580
Revises: 70d2040c87e3
Create Date: 2021-08-30 11:40:20.989569

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '1bb8b462a580'
down_revision = '70d2040c87e3'
branch_labels = None
depends_on = None


# pylint: disable=no-member
def upgrade():
    op.rename_table('data_digest_overview', 'pipeline_run_metadata')


def downgrade():
    op.rename_table('pipeline_run_metadata', 'data_digest_overview')
