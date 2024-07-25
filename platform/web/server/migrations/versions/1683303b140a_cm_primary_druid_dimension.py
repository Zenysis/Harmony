"""Add naming_druid_dimension_id to case_type_metadata_from_druid_dimension, and also change the primary_druid_dimension to use an id

Revision ID: 1683303b140a
Revises: f3e8008ed008
Create Date: 2020-07-17 12:43:02.655399

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1683303b140a'
down_revision = 'f3e8008ed008'
branch_labels = None
depends_on = None


def upgrade():
    # make sure the id sequence in the metadata_from_druid_dimension table is in sync
    op.execute(
        "SELECT setval('case_type_metadata_from_druid_dimension_id_seq', (SELECT MAX(id) FROM case_type_metadata_from_druid_dimension)+1);"
    )

    # move primary_druid_dimension for all DRUID case_type as new rows in the
    # case_type_metadata_from_druid_dimension table
    op.execute(
        "insert into case_type_metadata_from_druid_dimension (case_type_id, druid_dimension_name, id, show_in_overview_table, dossier_section, treat_as_primary_dimension) select id, primary_druid_dimension, nextval('case_type_metadata_from_druid_dimension_id_seq'), true, null, true from case_type where type = 'DRUID';"
    )

    # now add new columns to the case_type table
    with op.batch_alter_table('case_type', schema=None) as batch_op:
        # create new primary_druid_dimension_id column
        batch_op.add_column(
            sa.Column('primary_druid_dimension_id', sa.Integer(), nullable=True)
        )
        batch_op.create_unique_constraint(
            'case_type_primary_druid_dimension_id_key', ['primary_druid_dimension_id']
        )
        batch_op.create_foreign_key(
            'valid_primary_druid_dimension',
            'case_type_metadata_from_druid_dimension',
            ['primary_druid_dimension_id'],
            ['id'],
            onupdate='CASCADE',
            ondelete='RESTRICT',
        )

        # create new naming_druid_dimension_id column
        batch_op.add_column(
            sa.Column('naming_druid_dimension_id', sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            'valid_naming_druid_dimension',
            'case_type_metadata_from_druid_dimension',
            ['naming_druid_dimension_id'],
            ['id'],
            onupdate='CASCADE',
            ondelete='RESTRICT',
        )

    # for all primary_druid_dimension values, get their id from the
    # metadata_from_druid_dimension table, and update the primary_druid_dimension_id
    # column with that id
    op.execute(
        "UPDATE case_type SET primary_druid_dimension_id = T2.id from case_type_metadata_from_druid_dimension T2 where T2.druid_dimension_name = case_type.primary_druid_dimension;"
    )

    # do the same for the naming_druid_dimension_id - use the primary_druid_dimension id
    op.execute(
        "UPDATE case_type SET naming_druid_dimension_id = T2.id FROM case_type_metadata_from_druid_dimension T2 WHERE T2.druid_dimension_name = case_type.primary_druid_dimension;"
    )

    # all data has moved!
    # now it's finally safe to drop the the primary_druid_dimension column
    with op.batch_alter_table('case_type', schema=None) as batch_op:
        batch_op.drop_constraint(
            'case_type_primary_druid_dimension_key', type_='unique'
        )
        batch_op.drop_column('primary_druid_dimension')

    # ### end Alembic commands ###


def downgrade():
    # add the primary_druid_dimension_column back
    with op.batch_alter_table('case_type', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('primary_druid_dimension', sa.Text(), nullable=True)
        )
        batch_op.create_unique_constraint(
            'case_type_primary_druid_dimension_key', ['primary_druid_dimension']
        )

    # fill in the values for primary_druid_dimension by using the
    # primary_druid_dimension_id column
    op.execute(
        "UPDATE case_type SET primary_druid_dimension = T2.druid_dimension_name FROM case_type_metadata_from_druid_dimension T2 WHERE T2.id = case_type.primary_druid_dimension_id"
    )

    # drop the new columns we created for case_type
    with op.batch_alter_table('case_type', schema=None) as batch_op:
        # delete the naming_druid_dimension_id column
        batch_op.drop_constraint(
            'case_type_primary_druid_dimension_id_key', type_='unique'
        )
        batch_op.drop_constraint('valid_naming_druid_dimension', type_='foreignkey')
        batch_op.drop_column('naming_druid_dimension_id')

        # delete the primary_druid_dimension_id column
        batch_op.drop_constraint('valid_primary_druid_dimension', type_='foreignkey')
        batch_op.drop_column('primary_druid_dimension_id')

    # delete the new rows we created in the case_type_metadata_from_druid_dimension
    # table
    op.execute(
        "DELETE FROM case_type_metadata_from_druid_dimension T1 WHERE T1.druid_dimension_name IN (SELECT case_type.primary_druid_dimension FROM case_type)"
    )

    # ### end Alembic commands ###
