# pylint: disable=invalid-name
"""
Changing title field of alert definition to be non-nullable and populating it with a default value

Revision ID: 2be1fb67c14f
Revises: f9f6f74c64ee
Create Date: 2021-08-02 16:08:09.882914

"""
from alembic import op
import sqlalchemy as sa

from web.server.migrations.seed_scripts.seed_2be1fb67c14f_populate_alert_title import (
    downvert_data,
    upvert_data,
)

# revision identifiers, used by Alembic.
revision = '2be1fb67c14f'
down_revision = 'f9f6f74c64ee'
branch_labels = None
depends_on = None


# pylint: disable=no-member
def upgrade():
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        upvert_data(batch_op)
        batch_op.alter_column(
            'title', existing_type=sa.VARCHAR(), existing_nullable=True, nullable=False
        )


def downgrade():
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.alter_column(
            'title', existing_type=sa.VARCHAR(), existing_nullable=False, nullable=True
        )
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        downvert_data(batch_op)
