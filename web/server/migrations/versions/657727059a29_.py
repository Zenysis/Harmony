"""Change type for user_id from boolean to integer

Revision ID: 657727059a29
Revises: 18246ae1f1a2
Create Date: 2020-02-18 16:44:15.689516

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '657727059a29'
down_revision = '18246ae1f1a2'
branch_labels = None
depends_on = None


def upgrade():
    # change type for user_id from boolean to integer
    with op.batch_alter_table('feed_update', schema=None) as batch_op:
        batch_op.alter_column(
            'user_id',
            existing_type=sa.Boolean(),
            type_=sa.Integer(),
            existing_nullable=True,
            postgresql_using='user_id::integer',
        )

    # ### end Alembic commands ###


def downgrade():
    # change user_id type from integer to boolean
    with op.batch_alter_table('feed_update', schema=None) as batch_op:
        batch_op.alter_column(
            'user_id',
            existing_type=sa.Integer(),
            type_=sa.Boolean(),
            existing_nullable=True,
            postgresql_using='user_id::boolean',
        )

    # ### end Alembic commands ###
