"""Delete alert notifications when associated definition is deleted.

Revision ID: 0331609ed38d
Revises: 7df5cba3d971
Create Date: 2018-10-05 10:04:37.437346

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0331609ed38d'
down_revision = '7df5cba3d971'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.drop_constraint(
            'alert_notifications_alert_definition_id_fkey', type_='foreignkey'
        )
        batch_op.create_foreign_key(
            None,
            'alert_definitions',
            ['alert_definition_id'],
            ['id'],
            ondelete='CASCADE',
        )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('alert_notifications', schema=None) as batch_op:
        batch_op.drop_constraint(
            'alert_notifications_alert_definition_id_fkey', type_='foreignkey'
        )
        batch_op.create_foreign_key(
            'alert_notifications_alert_definition_id_fkey',
            'alert_definitions',
            ['alert_definition_id'],
            ['id'],
        )

    # ### end Alembic commands ###