# pylint: disable=C0103
"""Add user and date columns to PipelineEntityMatch

Revision ID: 1d52cbac7f72
Revises: 65fda57202a5
Create Date: 2021-01-25 11:07:07.860839

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1d52cbac7f72'
down_revision = '65fda57202a5'
branch_labels = None
depends_on = None


# pylint: disable=E1101
def upgrade():
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.add_column(sa.Column('date_changed', sa.DateTime(), nullable=True))
        batch_op.alter_column(
            'date_changed',
            type_=sa.DateTime(),
            nullable=False,
            postgresql_using=("now()"),
        )
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'valid_user', 'user', ['user_id'], ['id'], ondelete='SET NULL'
        )


def downgrade():
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.drop_constraint('valid_user', type_='foreignkey')
        batch_op.drop_column('user_id')
        batch_op.drop_column('date_changed')
