'''Convert `public_roles` => `default_roles`

Revision ID: 7df5cba3d971
Revises: 2c2d9357157c
Create Date: 2018-09-05 22:58:48.270450

'''
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7df5cba3d971'
down_revision = '2c2d9357157c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('public_roles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('apply_to_unregistered', sa.Boolean(), server_default='false', nullable=False))

    op.rename_table('public_roles', 'default_roles')

def downgrade():
    with op.batch_alter_table('default_roles', schema=None) as batch_op:
        batch_op.drop_column('apply_to_unregistered')

    op.rename_table('default_roles', 'public_roles')

