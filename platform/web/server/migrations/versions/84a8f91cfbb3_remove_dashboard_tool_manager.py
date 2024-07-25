"""This migration removes the default permission to dashboard tool for the manager role.

Revision ID: 84a8f91cfbb3
Revises: 1d09a4f69ae4
Create Date: 2022-01-28 08:49:42.996268

"""
# pylint: disable-all
from alembic import op


# revision identifiers, used by Alembic.
from web.server.migrations.seed_scripts.seed_84a8f91cfbb3_remove_dashboard_tool_manager import (
    downvert_data,
    upvert_data,
)

revision = '84a8f91cfbb3'
down_revision = '1d09a4f69ae4'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
