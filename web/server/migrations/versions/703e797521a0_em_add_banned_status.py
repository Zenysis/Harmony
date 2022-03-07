# pylint: disable=invalid-name
"""
Add BANNED pipeline entity match type

Revision ID: 703e797521a0
Revises: 596dfa77bb84
Create Date: 2021-04-22 17:39:49.351285

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

OLD_VALIDATION_STATUSES = ('VALIDATED', 'UNVALIDATED', 'REMOVED', 'NEW_MATCH')
NEW_VALIDATION_STATUSES = OLD_VALIDATION_STATUSES + ('BANNED',)

old_type = ENUM(*OLD_VALIDATION_STATUSES, name='match_status_enum')
new_type = ENUM(*NEW_VALIDATION_STATUSES, name='match_status_enum')


# revision identifiers, used by Alembic.
revision = '703e797521a0'
down_revision = '596dfa77bb84'
branch_labels = None
depends_on = None


# pylint: disable=no-member
def upgrade():
    # swap to temporary type to free up the name 'match_status_enum'
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.alter_column(
            'validated_status',
            existing_type=old_type,
            type_=sa.String(),
            existing_nullable=False,
            postgresql_using='validated_status::text',
        )
    old_type.drop(op.get_bind(), checkfirst=True)

    # swap to new type
    new_type.create(op.get_bind(), checkfirst=True)
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.alter_column(
            'validated_status',
            existing_type=sa.String(),
            type_=new_type,
            existing_nullable=False,
            postgresql_using='validated_status::text::match_status_enum',
        )
        # remove unique constraint on raw_entity_id
        batch_op.drop_constraint(
            'pipeline_entity_match_raw_entity_id_key', type_='unique'
        )


def downgrade():
    # drop all BANNED validated status rows
    op.execute('DELETE FROM "pipeline_entity_match" WHERE validated_status=\'BANNED\'')

    # swap to temporary type to free up the name 'match_status_enum'
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.alter_column(
            'validated_status',
            existing_type=new_type,
            type_=sa.String(),
            existing_nullable=False,
            postgresql_using='validated_status::text',
        )
    new_type.drop(op.get_bind(), checkfirst=True)

    # swap to old type
    old_type.create(op.get_bind(), checkfirst=True)
    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.alter_column(
            'validated_status',
            existing_type=sa.String(),
            type_=old_type,
            existing_nullable=False,
            postgresql_using='validated_status::text::match_status_enum',
        )
        # add back unique constraint on raw_entity_id
        batch_op.create_unique_constraint(
            'pipeline_entity_match_raw_entity_id_key', ['raw_entity_id']
        )
