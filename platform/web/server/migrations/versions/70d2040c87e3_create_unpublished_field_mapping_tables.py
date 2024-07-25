"""Create unpublished field mapping tables

Revision ID: 70d2040c87e3
Revises: 77142d54b64d
Create Date: 2021-08-24 15:41:12.041846

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '70d2040c87e3'
down_revision = '77142d54b64d'
branch_labels = None
depends_on = None


def upgrade():
    # ### Create unpublished field mapping tables. ###
    op.create_table(
        'unpublished_field_category_mapping',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unpublished_field_id', sa.String(), nullable=False),
        sa.Column('category_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ['category_id'], ['category.id'], name='valid_category', ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['unpublished_field_id'],
            ['unpublished_field.id'],
            name='valid_unpublished_field',
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('unpublished_field_id', 'category_id'),
    )
    op.create_table(
        'unpublished_field_dimension_mapping',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unpublished_field_id', sa.String(), nullable=False),
        sa.Column('dimension_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ['dimension_id'],
            ['dimension.id'],
            name='valid_dimension',
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['unpublished_field_id'],
            ['unpublished_field.id'],
            name='valid_unpublished_field',
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('unpublished_field_id', 'dimension_id'),
    )
    op.create_table(
        'unpublished_field_pipeline_datasource_mapping',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unpublished_field_id', sa.String(), nullable=False),
        sa.Column('pipeline_datasource_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ['pipeline_datasource_id'],
            ['pipeline_datasource.id'],
            name='valid_pipeline_datasource',
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['unpublished_field_id'],
            ['unpublished_field.id'],
            name='valid_unpublished_field',
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('unpublished_field_id', 'pipeline_datasource_id'),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### Drop tables ###
    op.drop_table('unpublished_field_pipeline_datasource_mapping')
    op.drop_table('unpublished_field_dimension_mapping')
    op.drop_table('unpublished_field_category_mapping')
    # ### end Alembic commands ###
