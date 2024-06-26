'''Simplify configuration API and remove 'enabled' and 'description' fields.

Revision ID: 58add9b07431
Revises: fab84c999c8a
Create Date: 2018-09-12 22:57:24.895221

'''

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '58add9b07431'
down_revision = 'fab84c999c8a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('configuration', schema=None) as batch_op:
        batch_op.drop_column('enabled')
        batch_op.drop_column('description')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('configuration', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'enabled',
                sa.BOOLEAN(),
                server_default=sa.text('false'),
                autoincrement=False,
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column('description', sa.Text(), server_default='', nullable=False)
        )

    # ### end Alembic commands ###
