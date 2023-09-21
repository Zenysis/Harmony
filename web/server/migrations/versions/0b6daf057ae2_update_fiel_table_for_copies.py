"""Update data catalog field table to support copies one to many mapping

Revision ID: 0b6daf057ae2
Revises: 50f9404b84ae
Create Date: 2021-07-14 11:56:27.233647

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0b6daf057ae2'
down_revision = '50f9404b84ae'
branch_labels = None
depends_on = None


def upgrade():
    # ### Update fields table ###
    with op.batch_alter_table('field', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('copied_from_field_id', sa.String(), nullable=True)
        )
        batch_op.create_foreign_key(
            'copied_from_field',
            'field',
            ['copied_from_field_id'],
            ['id'],
            ondelete='CASCADE',
        )
    # ### end Alembic commands ###


def downgrade():
    # ### Remove updates from fields table ###
    with op.batch_alter_table('field', schema=None) as batch_op:
        batch_op.drop_constraint('copied_from_field', type_='foreignkey')
        batch_op.drop_column('copied_from_field_id')
    # ### end Alembic commands ###
