"""Add a Manager Role

Revision ID: 7d247dadfba0
Revises: a53982a375ec
Create Date: 2021-11-03 09:35:35.752097

"""
# pylint: disable-all
from alembic import op


# revision identifiers, used by Alembic.
from web.server.migrations.seed_scripts.seed_7d247dadfba0_manager_role import (
    downvert_data,
    upvert_data,
)

revision = '7d247dadfba0'
down_revision = 'a53982a375ec'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
