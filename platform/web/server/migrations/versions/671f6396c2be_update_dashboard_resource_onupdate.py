"""Update dashboard resource onupdate to cascade

Revision ID: 671f6396c2be
Revises: 5f298008d3b8
Create Date: 2021-05-10 11:43:31.690386

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '671f6396c2be'
down_revision = '5f298008d3b8'
branch_labels = None
depends_on = None


def upgrade():
    # ### Update dashboard resource onupdate to cascade ###
    with op.batch_alter_table('dashboard', schema=None) as batch_op:
        batch_op.drop_constraint('valid_dashboard_resource', type_='foreignkey')
        batch_op.create_foreign_key(
            'valid_dashboard_resource',
            'resource',
            ['resource_id'],
            ['id'],
            onupdate='CASCADE',
            ondelete='CASCADE',
        )
    # ### end Alembic commands ###


def downgrade():
    # ### Remove dashboard resource onupdate cascade ###
    with op.batch_alter_table('dashboard', schema=None) as batch_op:
        batch_op.drop_constraint('valid_dashboard_resource', type_='foreignkey')
        batch_op.create_foreign_key(
            'valid_dashboard_resource',
            'resource',
            ['resource_id'],
            ['id'],
            ondelete='CASCADE',
        )
    # ### end Alembic commands ###
