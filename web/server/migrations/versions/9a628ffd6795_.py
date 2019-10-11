'''Add roles to explicitly define query permissions

Revision ID: 9a628ffd6795
Revises: 8e52d9ff28d7
Create Date: 2017-12-12 12:23:16.644786

'''
import logging

from alembic import op

from web.server.migrations.seed_scripts.seed_9a628ffd6795 import prepopulate_data

# revision identifiers, used by Alembic.
revision = '9a628ffd6795'
down_revision = '8e52d9ff28d7'
branch_labels = None
depends_on = None


def upgrade():
    prepopulate_data(op)

def downgrade():
    logger = logging.getLogger('alembic.env')
    logger.INFO(
        'Revision \'%s\' is a data-only revision. '
        'No schema changes were made. ')
