"""
Adding a field column to alert_definitions, a later migration will populate the column

Revision ID: f4a399b73f71
Revises: 671f6396c2be
Create Date: 2021-05-12 13:52:14.665433

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# pylint: disable=C0103
# pylint: disable=E1101
# revision identifiers, used by Alembic.
revision = 'f4a399b73f71'
down_revision = '671f6396c2be'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'alert_definitions',
        sa.Column('field', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade():
    op.drop_column('alert_definitions', 'field')
