"""Adding AlertNotification and AlertDefinition models for Alerts feature.

Revision ID: 010bef7d6239
Revises: 12786dfb3980
Create Date: 2018-04-20 16:58:21.870323

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '010bef7d6239'
down_revision = '12786dfb3980'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        'alert_definitions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('checks', sa.Text(), nullable=True),
        sa.Column('dimension_name', sa.String(), nullable=True),
        sa.Column('field_id', sa.String(), nullable=True),
        sa.Column('time_granularity', sa.String(), nullable=True),
        sa.Column('user', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'alert_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_definition_id', sa.Integer(), nullable=True),
        sa.Column('dimension_name', sa.String(), nullable=True),
        sa.Column('dimension_val', sa.String(), nullable=True),
        sa.Column('field_id', sa.String(), nullable=True),
        sa.Column('generation_date', sa.String(), nullable=True),
        sa.Column('message', sa.String(), nullable=True),
        sa.Column('reported_val', sa.String(), nullable=True),
        sa.Column('query_interval', sa.String(), nullable=True),
        sa.Column('user', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ['alert_definition_id'],
            ['alert_definitions.id'],
        ),
        sa.PrimaryKeyConstraint('id'),
    )

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('alert_notifications')
    op.drop_table('alert_definitions')
    # ### end Alembic commands ###
