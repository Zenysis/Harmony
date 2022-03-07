"""Add visibility_status property to data catalog category model.

Revision ID: 02d20fb0c3ed
Revises: 4d1872f4a1d3
Create Date: 2021-03-02 14:19:15.135982

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = '02d20fb0c3ed'
down_revision = '4d1872f4a1d3'
branch_labels = None
depends_on = None

visibility_status_enum = ENUM(
    'VISIBLE', 'HIDDEN', name='visibility_status_enum', create_type=False
)


def upgrade():
    # Create enum
    visibility_status_enum.create(op.get_bind(), checkfirst=True)

    # Add column
    with op.batch_alter_table('category', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'visibility_status',
                visibility_status_enum,
                server_default='VISIBLE',
                nullable=False,
            )
        )


def downgrade():
    # Undoing old changes
    with op.batch_alter_table('category', schema=None) as batch_op:
        batch_op.drop_column('visibility_status')

    # Drop enum
    visibility_status_enum.drop(op.get_bind(), checkfirst=True)
