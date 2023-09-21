# pylint: disable-all
"""Data Upload Roles

Revision ID: d325772895f7
Revises: d5a1a7abe938
Create Date: 2022-08-17 10:14:22.687995

"""
from alembic import op


# revision identifiers, used by Alembic.
from web.server.migrations.seed_scripts.seed_d325772895f7_data_upload_roles import (
    upvert_data,
    downvert_data,
)

revision = 'd325772895f7'
down_revision = 'd5a1a7abe938'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
