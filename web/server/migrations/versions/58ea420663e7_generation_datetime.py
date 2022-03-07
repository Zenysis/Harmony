"""Change type for generation_timestamp to datetime (previously string) and rename to generation_datetime

Revision ID: 58ea420663e7
Revises: 657727059a29
Create Date: 2020-02-25 18:18:40.153994

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '58ea420663e7'
down_revision = '657727059a29'
branch_labels = None
depends_on = None


def upgrade():
    # Change generation_timestamp from string to datetime and rename. Since no
    # data exists in the database, drop previous column and add new column
    with op.batch_alter_table('feed_update', schema=None) as batch_op:
        batch_op.drop_column('generation_timestamp')
        batch_op.add_column(
            sa.Column(
                'generation_datetime', sa.DateTime(), server_default=sa.text(u'now()')
            )
        )
    # ### end Alembic commands ###


def downgrade():
    # Change type for generation_timestamp from datetime to datetime.
    with op.batch_alter_table('feed_update', schema=None) as batch_op:
        batch_op.drop_column('generation_datetime')
        batch_op.add_column(
            sa.Column(
                'generation_timestamp', sa.String(), autoincrement=False, nullable=True
            )
        )
    # ### end Alembic commands ###
