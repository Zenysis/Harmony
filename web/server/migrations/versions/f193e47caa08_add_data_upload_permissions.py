# pylint: disable-all
"""This migration adds the `Data Uploader` role and `can_upload_data` permission that will be
used by data-upload.

Revision ID: f193e47caa08
Revises: fc7d305d0341
Create Date: 2021-10-06 10:18:16.673201

"""
from alembic import op


# revision identifiers, used by Alembic.
from web.server.migrations.seed_scripts.seed_f193e47caa08_add_data_upload_permissions import (
    downvert_data,
    upvert_data,
)

revision = 'f193e47caa08'
down_revision = 'fc7d305d0341'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
