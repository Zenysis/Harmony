'''Create Analyst Role

Revision ID: fab84c999c8a
Revises: 1a448e61b057
Create Date: 2018-09-04 23:56:03.561778

'''

from alembic import op
import sqlalchemy as sa
from web.server.migrations.seed_scripts.seed_fab84c999c8a import (upvert_data, downvert_data)

# revision identifiers, used by Alembic.
revision = 'fab84c999c8a'
down_revision = '1a448e61b057'
branch_labels = None
depends_on = None


def upgrade():
    upvert_data(op)

def downgrade():
    downvert_data(op)
