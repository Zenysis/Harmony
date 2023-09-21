# pylint: disable=invalid-name
"""
Empty Migration needed to add new entity matching roles

Revision ID: ed9866de10d8
Revises: e8f6ad35d0f0
Create Date: 2022-11-22 14:52:30.074652

"""
from alembic import op

from web.server.migrations.seed_scripts.seed_ed9866de10d8_entity_matching_roles import (
    upvert_data,
    downvert_data,
)

# revision identifiers, used by Alembic.
revision = 'ed9866de10d8'
down_revision = 'e8f6ad35d0f0'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
