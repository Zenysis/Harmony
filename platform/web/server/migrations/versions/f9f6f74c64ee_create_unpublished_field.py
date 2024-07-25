"""Create unpublished field table

Revision ID: f9f6f74c64ee
Revises: 0b6daf057ae2
Create Date: 2021-08-02 14:53:05.126936

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'f9f6f74c64ee'
down_revision = '0b6daf057ae2'
branch_labels = None
depends_on = None


def upgrade():
    # ### Create unpublished_field table ###
    op.create_table(
        'unpublished_field',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('short_name', sa.String(), nullable=True),
        sa.Column(
            'calculation', postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### Drop unpublished_field table ###
    op.drop_table('unpublished_field')
    # ### end Alembic commands ###
