"""Adds full dimension data columnn for AlertNotifications

Revision ID: 951e632061d2
Revises: 0d0f346a242f
Create Date: 2020-06-30 15:27:26.851790

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from web.server.migrations.seed_scripts.seed_951e632061d2_add_full_dimensions_to_alerts import (
    upvert_data,
    downvert_data,
)

# revision identifiers, used by Alembic.
revision = '951e632061d2'
down_revision = '0d0f346a242f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'dimension_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True
            )
        )

    upvert_data(op)

    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.drop_column('dimension_val')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('dimension_val', sa.VARCHAR(), autoincrement=False, nullable=True)
        )

    downvert_data(op)

    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.drop_column('dimension_info')

    # ### end Alembic commands ###