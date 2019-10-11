"""Onboard Alerts to use AuthZ

Revision ID: 3846793ccd75
Revises: 23525d8da689
Create Date: 2019-04-26 17:39:27.226469

"""
from enum import Enum
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM
from web.server.migrations.seed_scripts.seed_3846793ccd75 import (
    upvert_data, downvert_data)

OLD_RESOURCE_TYPES = ('SITE', 'DASHBOARD', 'USER', 'GROUP', 'QUERY_POLICY')
NEW_RESOURCE_TYPES = OLD_RESOURCE_TYPES + ('ALERT', )

# revision identifiers, used by Alembic.
revision = '3846793ccd75'
down_revision = '23525d8da689'
branch_labels = None
depends_on = None


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
    new_type = ENUM(*NEW_RESOURCE_TYPES, name='resource_type_enum')
    new_type.create(op.get_bind(), checkfirst=True)

   # Convert the name column from temporary_type to new_type
    with op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=temporary_type,
            type_=new_type,
            nullable=False,
            postgresql_using='name::text::resource_type_enum')

    # Drop the temporary type
    temporary_type.drop(op.get_bind(), checkfirst=True)

    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('authorization_resource_id', sa.Integer(), nullable=True))
        batch_op.create_unique_constraint('unique_alert_resource', [
                                          'authorization_resource_id'])
        batch_op.create_foreign_key('valid_alert_resource', 'resource', [
                                    'authorization_resource_id'], ['id'], ondelete='CASCADE')

    upvert_data(op)

    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.alter_column(
            sa.Column('authorization_resource_id', sa.Integer(), nullable=False))


def downgrade():
    with op.batch_alter_table('alert_definitions', schema=None) as batch_op:
        batch_op.drop_constraint('valid_alert_resource', type_='foreignkey')
        batch_op.drop_constraint('unique_alert_resource', type_='unique')
        batch_op.drop_column('authorization_resource_id')

    downvert_data(op)

    # Create a temporary type "_resourcetypeenum" type
    temporary_type = ENUM(*OLD_RESOURCE_TYPES, name='resourcetypeenum_temp')
    new_type = ENUM(*NEW_RESOURCE_TYPES, name='resource_type_enum')
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
