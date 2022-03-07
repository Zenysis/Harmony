"""
Populating the existing field column in 'alert_definitions' to store the full field object

Revision ID: ed989d15dc61
Revises: f4a399b73f71
Create Date: 2021-03-29 14:11:50.688271

"""
from alembic import op

from web.server.migrations.seed_scripts.seed_ed989d15dc61_alerts_populate_full_field import (
    downvert_data,
    upvert_data,
)

# pylint: disable=C0103
# pylint: disable=E1101
# revision identifiers, used by Alembic.
revision = 'ed989d15dc61'
down_revision = 'f4a399b73f71'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)


def downgrade():
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        downvert_data(batch_op)
        batch_op.execute('UPDATE alert_definitions SET field = NULL')
