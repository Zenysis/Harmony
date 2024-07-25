# pylint: disable=invalid-name
"""
Makes the materialized view for the Distinct Metadata materialized view sorted alphabetically.

Revision ID: c30c94961873
Revises: bcfc6763c18c
Create Date: 2023-05-30 15:53:40.243567

"""
from alembic import op
from web.server.migrations.seed_scripts.seed_c30c94961873_sort_em_raw_distinct_metadata import (
    upvert_data,
    downvert_data,
)


# revision identifiers, used by Alembic.
revision = 'c30c94961873'
down_revision = 'bcfc6763c18c'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
