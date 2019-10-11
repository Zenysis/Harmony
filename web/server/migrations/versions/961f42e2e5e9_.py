"""Make Configuration and Dashboard Specification native JSON objects

Revision ID: 961f42e2e5e9
Revises: b2690a565224
Create Date: 2018-05-30 16:37:29.034237

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '961f42e2e5e9'
down_revision = 'b2690a565224'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('dashboard', 'specification', type_=sa.JSON(), postgresql_using=('specification::json'))
    op.alter_column('configuration', 'value', nullable=False, type_=sa.JSON(), postgresql_using=('value::json'))

def downgrade():
    op.alter_column('dashboard', 'specification', type_=sa.Text())
    op.alter_column('configuration', 'value', nullable=True, type_=sa.Text())
