'''Initial Data Version

Revision ID: 3b18f32329fa
Revises:
Create Date: 2017-10-31 05:28:12.854327

'''

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3b18f32329fa'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user',
        sa.Column('id', sa.INTEGER, primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('password', sa.String(255), nullable=False, server_default=''),
        sa.Column('reset_password_token', sa.String(100), nullable=False, server_default=''),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='0'),
        sa.Column('first_name', sa.String(100), nullable=False, server_default=''),
        sa.Column('last_name', sa.String(100), nullable=False, server_default=''),
    )

    op.create_table(
        'role',
        sa.Column('id', sa.INTEGER, primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, server_default=u'', unique=True),
        sa.Column('label', sa.Unicode(255), server_default=u''),
    )

    op.create_table(
        'user_roles',
        sa.Column('id', sa.INTEGER, primary_key=True),
        sa.Column('user_id',
                  sa.INTEGER,
                  sa.ForeignKey('user.id', ondelete='CASCADE', name='valid_user')),
        sa.Column('role_id',
                  sa.INTEGER,
                  sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role')),
    )

    op.create_table(
        'pending_user',
        sa.Column('id', sa.INTEGER, primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('first_name', sa.String(100), nullable=False, server_default=''),
        sa.Column('last_name', sa.String(100), nullable=False, server_default=''),
        sa.Column('invite_token', sa.String(100), nullable=False, server_default=''),
    )

def downgrade():
    op.drop_table('user')
    op.drop_table('role')
    op.drop_table('pending_user')
    op.drop_table('user_roles')
