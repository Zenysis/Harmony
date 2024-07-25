# pylint: disable=invalid-name
"""This migration removes the JSON blob from QueryPolicy and instead uses SQL columns
to describe what is allowed under the policy

Revision ID: fe9a588011c4
Revises: 70835f75f7c6
Create Date: 2023-03-03 13:44:33.146723

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fe9a588011c4'
down_revision = '6aec17d57ff8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('query_policy', sa.Column('dimension', sa.String(), nullable=True))
    # Populate the new dimension value from the policy_filters blob
    op.execute(
        '''
        UPDATE query_policy qp SET dimension=sq.key FROM (
            SELECT id, key FROM query_policy, jsonb_each_text(policy_filters)
        ) sq
        WHERE qp.id=sq.id
    '''
    )
    with op.batch_alter_table('query_policy', schema=None) as batch_op:
        batch_op.alter_column('dimension', nullable=False)

        batch_op.drop_constraint('query_policy_name_key', type_='unique')
        batch_op.alter_column('name', new_column_name='dimension_value', nullable=True)

    # Now set `dimension_value` to NULL if the filter includes all values
    op.execute(
        '''
        UPDATE query_policy SET
          dimension_value=CASE WHEN (policy_filters->dimension->'allValues')::bool
                               THEN NULL ELSE dimension_value
                          END
    '''
    )

    with op.batch_alter_table('query_policy', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'unique_dim_val_pair', ['dimension', 'dimension_value']
        )
        batch_op.drop_column('description')
        batch_op.drop_column('policy_filters')


def downgrade():
    op.add_column(
        'query_policy',
        sa.Column(
            'policy_filters',
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.execute(
        '''
        UPDATE query_policy SET policy_filters=
          jsonb_build_object(
            dimension, jsonb_build_object(
              'allValues', dimension_value is null,
              'includeValues', CASE
                WHEN dimension_value IS NULL THEN
                  json_build_array()
                ELSE
                  json_build_array(dimension_value)
                END,
              'excludeValues', json_build_array()
            )
          )
    '''
    )
    op.alter_column('query_policy', 'policy_filters', nullable=False)

    op.add_column(
        'query_policy',
        sa.Column('description', sa.TEXT(), autoincrement=False, nullable=True),
    )
    # Return `description back to its initial state
    op.execute(
        """
        UPDATE query_policy SET description=
            CONCAT('Allows policy holder to access data for ', dimension,
                   '; value: ', COALESCE(dimension_value, 'ALL'))
    """
    )

    # Return `name` column back to its initial state
    op.execute(
        """
        UPDATE query_policy SET dimension_value=CONCAT('All ', dimension, 's')
        WHERE dimension_value IS NULL
    """
    )
    op.alter_column(
        'query_policy', 'dimension_value', new_column_name='name', nullable=False
    )
    op.create_unique_constraint('query_policy_name_key', 'query_policy', ['name'])
    op.drop_column('query_policy', 'dimension')
