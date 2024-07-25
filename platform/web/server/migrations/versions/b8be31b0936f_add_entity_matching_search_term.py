"""Add a field representing the joined string of all the values in
entity_metadata column jsonb

Revision ID: b8be31b0936f
Revises: e1e665f992c7
Create Date: 2021-03-05 14:29:58.115159

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8be31b0936f'
down_revision = 'e1e665f992c7'
branch_labels = None
depends_on = None


def upgrade():
    # Add a field representing the string to be searched when a user searches.
    with op.batch_alter_table('canonical_pipeline_entity', schema=None) as batch_op:
        batch_op.add_column(sa.Column('search_term', sa.String(), nullable=True))

    with op.batch_alter_table('raw_pipeline_entity', schema=None) as batch_op:
        batch_op.add_column(sa.Column('search_term', sa.String(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # Remove a field representing the string to be searched when a user searches.
    with op.batch_alter_table('raw_pipeline_entity', schema=None) as batch_op:
        batch_op.drop_column('search_term')

    with op.batch_alter_table('canonical_pipeline_entity', schema=None) as batch_op:
        batch_op.drop_column('search_term')

    # ### end Alembic commands ###
