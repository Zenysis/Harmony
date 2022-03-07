"""Create query policy, query policy type, query policy role mapping tables.

Revision ID: 9a485a630d00
Revises: 83644d6eb47f
Create Date: 2020-03-18 12:54:20.388790

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

from web.server.migrations.seed_scripts.seed_9a485a630d00_create_related_query_policy_tables import (
    downvert_data,
    upvert_data,
)

# pylint: disable=C0103
# pylint:disable=E1101
# revision identifiers, used by Alembic.
revision = '9a485a630d00'
down_revision = '83644d6eb47f'
branch_labels = None
depends_on = None

query_policy_type_enum = ENUM(
    'DATASOURCE',
    'DIMENSION',
    'COMPOSITE',
    name='querypolicytypeenum',
    create_type=False,
)


def upgrade():
    # ### Create query policy tables and populate them. ###
    query_policy_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'query_policy_type',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', query_policy_type_enum, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_table(
        'query_policy_role',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query_policy_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['query_policy_id'], ['query_policy.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('query_policy', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('query_policy_type_id', sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            'query_policy_type_id_resource',
            'query_policy_type',
            ['query_policy_type_id'],
            ['id'],
            onupdate='CASCADE',
            ondelete='RESTRICT',
        )

    upvert_data(op)
    # ### end Alembic commands ###


def downgrade():
    # ### Save mappings from query_policy_role to json file and remove tables. ###
    downvert_data(op)

    with op.batch_alter_table('query_policy', schema=None) as batch_op:
        batch_op.drop_constraint('query_policy_type_id_resource', type_='foreignkey')
        batch_op.drop_column('query_policy_type_id')

    op.drop_table('query_policy_role')
    op.drop_table('query_policy_type')

    query_policy_type_enum.drop(op.get_bind(), checkfirst=True)
    # ### end Alembic commands ###
