'''Add Query Policy and User Preferences. Add new User, Group, Dashboard and Query permissions.

Revision ID: 1a448e61b057
Revises: dc3a3339dab6
Create Date: 2018-07-24 12:37:54.826210

'''
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM
from web.server.migrations.seed_scripts.seed_1a448e61b057 import (upvert_data, downvert_data)

# revision identifiers, used by Alembic.
revision = '1a448e61b057'
down_revision = 'dc3a3339dab6'
branch_labels = None
depends_on = None

OLD_RESOURCE_TYPES = ('SITE', 'DASHBOARD', 'USER', 'GROUP')
NEW_RESOURCE_TYPES = OLD_RESOURCE_TYPES + ('QUERY_POLICY', )

def upgrade():
    # Create a temporary type "_resourcetypeenum" type
    temporary_type = ENUM(*NEW_RESOURCE_TYPES, name='resourcetypeenum_temp')
    old_type = ENUM(*OLD_RESOURCE_TYPES, name='resourcetypeenum')
    temporary_type.create(op.get_bind(), checkfirst=True)

    # Convert the name column from old_type to temporary_type
    with op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=old_type,
            type_=temporary_type,
            nullable=False,
            postgresql_using='name::text::resourcetypeenum_temp')

    # Drop the old type, create a new enum of type 'resourcetypeenum'
    old_type.drop(op.get_bind(), checkfirst=True)
    new_type = ENUM(*NEW_RESOURCE_TYPES, name='resourcetypeenum')
    new_type.create(op.get_bind(), checkfirst=True)

   # Convert the name column from temporary_type to new_type
    with op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=temporary_type,
            type_=new_type,
            nullable=False,
            postgresql_using='name::text::resourcetypeenum')

    # Drop the temporary type
    temporary_type.drop(op.get_bind(), checkfirst=True)

    op.create_table('query_policy',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('policy_filters', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['resource_id'], ['resource.id'], name='valid_query_definition_resource', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('resource_id')
    )
    op.create_table('user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('preferences', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], name='valid_user', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    upvert_data(op)


def downgrade():
    downvert_data(op)
    op.drop_table('user_preferences')
    op.drop_table('query_policy')

    # Create a temporary type "_resourcetypeenum" type
    temporary_type = ENUM(*OLD_RESOURCE_TYPES, name='resourcetypeenum_temp')
    new_type = ENUM(*NEW_RESOURCE_TYPES, name='resourcetypeenum')
    temporary_type.create(op.get_bind(), checkfirst=True)

    # Convert the name column from old_type to temporary_type
    with op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=new_type,
            type_=temporary_type,
            nullable=False,
            postgresql_using='name::text::resourcetypeenum_temp')

    # Drop the old type, create a new enum of type 'resourcetypeenum'
    new_type.drop(op.get_bind(), checkfirst=True)
    old_type = ENUM(*OLD_RESOURCE_TYPES, name='resourcetypeenum')
    old_type.create(op.get_bind(), checkfirst=True)

   # Convert the name column from temporary_type to new_type
    with op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=temporary_type,
            type_=old_type,
            nullable=False,
            postgresql_using='name::text::resourcetypeenum')

    # Drop the temporary type
    temporary_type.drop(op.get_bind(), checkfirst=True)
