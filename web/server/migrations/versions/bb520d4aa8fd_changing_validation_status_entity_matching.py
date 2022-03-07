"""Change type of Validation Status column to add concept of queued to Entity Matching tables

Revision ID: bb520d4aa8fd
Revises: 60327b532405
Create Date: 2020-12-17 13:44:25.245486

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

NEW_VALIDATION_STATUSES = ('VALIDATED', 'UNVALIDATED', 'REMOVED', 'NEW_MATCH')


# pylint: disable=C0103
# pylint: disable=E1101
# revision identifiers, used by Alembic.
revision = 'bb520d4aa8fd'
down_revision = '60327b532405'
branch_labels = None
depends_on = None


def upgrade():
    # Create a new enum of type 'match_status_enum'
    new_type = ENUM(*NEW_VALIDATION_STATUSES, name='match_status_enum')
    new_type.create(op.get_bind(), checkfirst=True)

    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.alter_column(
            'validated_status',
            existing_type=sa.BOOLEAN(),
            type_=new_type,
            existing_nullable=True,
            nullable=False,
            postgresql_using=(
                "CASE WHEN validated_status=true THEN 'VALIDATED'::match_status_enum "
                "ELSE 'UNVALIDATED'::match_status_enum END"
            ),
        )


def downgrade():
    # Recreate a new enum of type 'match_status_enum'
    new_type = ENUM(*NEW_VALIDATION_STATUSES, name='match_status_enum')
    new_type.create(op.get_bind(), checkfirst=True)

    # drop all REMOVE validated status rows
    op.execute('DELETE FROM "pipeline_entity_match" WHERE validated_status=\'REMOVED\'')

    with op.batch_alter_table('pipeline_entity_match', schema=None) as batch_op:
        batch_op.alter_column(
            'validated_status',
            existing_type=new_type,
            type_=sa.BOOLEAN(),
            existing_nullable=False,
            nullable=True,
            postgresql_using=(
                "CASE WHEN validated_status='VALIDATED' OR validated_status='NEW_MATCH' THEN true "
                "WHEN validated_status='UNVALIDATED' THEN false END"
            ),
        )

    # Drop the new type
    new_type.drop(op.get_bind(), checkfirst=True)
