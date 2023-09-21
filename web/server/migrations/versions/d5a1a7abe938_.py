# pylint: disable=invalid-name
"""Add Role Administrator and Moderator Roles.

Revision ID: d5a1a7abe938
Revises: bb8d1e7a1640
Create Date: 2022-08-03 09:43:04.211047

"""
from alembic import op


# revision identifiers, used by Alembic.
from sqlalchemy.dialects.postgresql import ENUM

from web.server.migrations.seed_scripts.seed_d5a1a7abe938_role_roles import (
    upvert_data,
    downvert_data,
)

revision = 'd5a1a7abe938'
down_revision = 'bb8d1e7a1640'
branch_labels = None
depends_on = None


OT = ('SITE', 'DASHBOARD', 'USER', 'GROUP', 'QUERY_POLICY', 'ALERT')
NT = OT + ('ROLE',)


def add_new_resource_type(_op):
    old_resource_types = OT
    new_resource_types = NT

    tmp_type = ENUM(*new_resource_types, name='resource_type_enum_tmp')
    old_type = ENUM(*old_resource_types, name='resource_type_enum')
    tmp_type.create(_op.get_bind(), checkfirst=True)

    with _op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=old_type,
            type_=tmp_type,
            nullable=False,
            postgresql_using='name::text::resource_type_enum_tmp',
        )

    old_type.drop(_op.get_bind(), checkfirst=True)
    new_type = ENUM(*new_resource_types, name="resource_type_enum")
    new_type.create(_op.get_bind(), checkfirst=True)

    with _op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=tmp_type,
            type_=new_type,
            nullable=False,
            postgresql_using='name::text::resource_type_enum',
        )
    tmp_type.drop(_op.get_bind(), checkfirst=True)


def delete_new_resource_type(_op):
    tmp_type = ENUM(*OT, name='resource_type_enum_tmp')
    new_type = ENUM(*NT, name='resource_type_enum')
    tmp_type.create(_op.get_bind(), checkfirst=True)

    with _op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=new_type,
            type_=tmp_type,
            nullable=False,
            postgresql_using='name::text::resource_type_enum_tmp',
        )

    new_type.drop(_op.get_bind(), checkfirst=True)
    old_type = ENUM(*OT, name='resource_type_enum')
    old_type.create(_op.get_bind(), checkfirst=True)

    with _op.batch_alter_table('resource_type', schema=None) as batch_op:
        batch_op.alter_column(
            'name',
            existing_type=tmp_type,
            type_=old_type,
            nullable=False,
            postgresql_using='name::text::resource_type_enum',
        )

    tmp_type.drop(_op.get_bind(), checkfirst=True)


def upgrade():
    add_new_resource_type(op)
    upvert_data(op)


def downgrade():
    downvert_data(op)
    delete_new_resource_type(op)
