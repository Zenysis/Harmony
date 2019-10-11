'''Rename `group` and related tables to `security_group`

Revision ID: 18429a152520
Revises: 8d2c718eadfa
Create Date: 2018-04-19 13:48:50.526841

'''
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '18429a152520'
down_revision = '8d2c718eadfa'
branch_labels = None
depends_on = None


def upgrade():
    op.rename_table('group', 'security_group')
    op.rename_table('group_users', 'security_group_users')
    op.rename_table('group_roles', 'security_group_roles')

    with op.batch_alter_table('security_group_users', schema=None) as batch_op:
        batch_op.drop_constraint('valid_group', type_='foreignkey')
        batch_op.create_foreign_key('valid_security_group', 'security_group', ['group_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('security_group_roles', schema=None) as batch_op:
        batch_op.drop_constraint('valid_group', type_='foreignkey')
        batch_op.create_foreign_key('valid_security_group', 'security_group', ['group_id'], ['id'], ondelete='CASCADE')

    # ### end Alembic commands ###

def downgrade():
    op.rename_table('security_group', 'group')
    op.rename_table('security_group_users', 'group_users')
    op.rename_table('security_group_roles', 'group_roles')

    with op.batch_alter_table('group_users', schema=None) as batch_op:
        batch_op.drop_constraint('valid_security_group', type_='foreignkey')
        batch_op.create_foreign_key('valid_group', 'group', ['group_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('group_roles', schema=None) as batch_op:
        batch_op.drop_constraint('valid_security_group', type_='foreignkey')
        batch_op.create_foreign_key('valid_group', 'group', ['group_id'], ['id'], ondelete='CASCADE')
