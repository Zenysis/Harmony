"""Mark all official dashboards as viewable by sitewide registered users

Revision ID: 1d82c5f424f4
Revises: ed989d15dc61
Create Date: 2021-06-08 15:34:03.881007

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from web.server.migrations.seed_scripts.seed_1d82c5f424f4_migrate_official_dash import (
    upvert_data,
)

# revision identifiers, used by Alembic.
revision = '1d82c5f424f4'
down_revision = 'ed989d15dc61'
branch_labels = None
depends_on = None


def upgrade():
    # Mark all official dashboards as viewable by sitewide registered users
    upvert_data(op)


def downgrade():
    return
