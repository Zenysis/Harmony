"""Add visibility status to field category mapping table

Revision ID: 596dfa77bb84
Revises: 04ccddbe1441
Create Date: 2021-04-19 16:57:46.232580

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

# revision identifiers, used by Alembic.
revision = '596dfa77bb84'
down_revision = '04ccddbe1441'
branch_labels = None
depends_on = None

visibility_status_enum = ENUM(
    'VISIBLE', 'HIDDEN', name='visibility_status_enum', create_type=False
)


def upgrade():
    # ### Add visilibity status to field category mapping table and other type changes ###
    visibility_status_enum.create(op.get_bind(), checkfirst=True)
    with op.batch_alter_table('field_category_mapping', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'visibility_status',
                visibility_status_enum,
                server_default='VISIBLE',
                nullable=False,
            )
        )

    # ### end Alembic commands ###


def downgrade():
    # ### Revert changes ###
    with op.batch_alter_table('field_category_mapping', schema=None) as batch_op:
        batch_op.drop_column('visibility_status')

    # ### end Alembic commands ###
