# pylint: disable=C0103
# pylint: disable=C0301
"""Drop location-related postgres tables as part of deprecating old products:
MFExplorer, ReviewAdmin, LocationAdmin, GeoExporer

Revision ID: 347d0217289b
Revises: 4c19fa30d958
Create Date: 2022-07-28 14:41:30.807473

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '347d0217289b'
down_revision = '4c19fa30d958'
branch_labels = None
depends_on = None


def upgrade():
    # Drop location-related tables
    op.drop_table('user_matches')
    op.drop_table('suggested_matches')
    op.drop_table('mapped_locations')
    op.drop_table('flagged_locations')
    op.drop_table('unmatched_locations')
    op.drop_table('canonical_locations')
    op.drop_table('sources')
    op.drop_table('location_types')


def downgrade():
    # Create empty tables to match location models.
    op.create_table(
        'sources',
        sa.Column(
            'source_id',
            sa.INTEGER(),
            server_default=sa.text("nextval('sources_source_id_seq'::regclass)"),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint('source_id', name='sources_pkey'),
        postgresql_ignore_search_path=False,
    )
    op.create_table(
        'location_types',
        sa.Column(
            'id',
            sa.INTEGER(),
            server_default=sa.text("nextval('location_types_id_seq'::regclass)"),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint('id', name='location_types_pkey'),
        postgresql_ignore_search_path=False,
    )
    op.create_table(
        'canonical_locations',
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column('parent_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column('type_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ['parent_id'],
            ['canonical_locations.id'],
            name='canonical_locations_parent_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['type_id'], ['location_types.id'], name='canonical_locations_type_id_fkey'
        ),
        sa.PrimaryKeyConstraint('id', name='canonical_locations_pkey'),
    )
    op.create_table(
        'unmatched_locations',
        sa.Column(
            'id',
            sa.INTEGER(),
            server_default=sa.text("nextval('unmatched_locations_id_seq'::regclass)"),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column('parent_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column('type_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column('source_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ['parent_id'],
            ['canonical_locations.id'],
            name='unmatched_locations_parent_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['source_id'],
            ['sources.source_id'],
            name='unmatched_locations_source_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['type_id'], ['location_types.id'], name='unmatched_locations_type_id_fkey'
        ),
        sa.PrimaryKeyConstraint('id', name='unmatched_locations_pkey'),
        postgresql_ignore_search_path=False,
    )
    op.create_table(
        'user_matches',
        sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('canonical_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('unmatched_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(
            ['canonical_id'],
            ['canonical_locations.id'],
            name='user_matches_canonical_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['unmatched_id'],
            ['unmatched_locations.id'],
            name='user_matches_unmatched_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], ['user.id'], name='valid_user', ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint(
            'user_id', 'canonical_id', 'unmatched_id', name='user_matches_pkey'
        ),
    )

    op.create_table(
        'suggested_matches',
        sa.Column('canonical_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('unmatched_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(
            ['canonical_id'],
            ['canonical_locations.id'],
            name='suggested_matches_canonical_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['unmatched_id'],
            ['unmatched_locations.id'],
            name='suggested_matches_unmatched_id_fkey',
        ),
        sa.PrimaryKeyConstraint(
            'canonical_id', 'unmatched_id', name='suggested_matches_pkey'
        ),
    )

    op.create_table(
        'mapped_locations',
        sa.Column('unmatched_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('canonical_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ['canonical_id'],
            ['canonical_locations.id'],
            name='mapped_locations_canonical_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['unmatched_id'],
            ['unmatched_locations.id'],
            name='mapped_locations_unmatched_id_fkey',
        ),
        sa.PrimaryKeyConstraint('unmatched_id', name='mapped_locations_pkey'),
    )
    op.create_table(
        'flagged_locations',
        sa.Column('unmatched_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(
            ['unmatched_id'],
            ['unmatched_locations.id'],
            name='flagged_locations_unmatched_id_fkey',
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], ['user.id'], name='valid_user', ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('unmatched_id', name='flagged_locations_pkey'),
    )
