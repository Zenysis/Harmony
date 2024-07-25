# pylint: disable=invalid-name
"""Update the Entity Matching raw_distinct_metadata_materialized_view

Adds a "WHERE KEY in (SELECT name FROM metadata_column WHERE filterable = TRUE)"
condition to only keep entity metadata column keys that are in the metadata_column
table and are filterable.

Revision ID: 189373be1240
Revises: fe9a588011c4
Create Date: 2023-04-17 08:31:05.999746

"""
from alembic import op

# pylint:disable=line-too-long
from web.server.migrations.seed_scripts.seed_189373be1240_limit_em_raw_distinct_metadata_to_filterable import (
    upvert_data,
    downvert_data,
)

# revision identifiers, used by Alembic.
revision = '189373be1240'
down_revision = 'fe9a588011c4'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    downvert_data(op)
