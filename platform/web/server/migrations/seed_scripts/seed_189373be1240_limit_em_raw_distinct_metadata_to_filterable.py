from sqlalchemy.sql import text

from web.server.data.data_access import Transaction
from web.server.migrations.seed_scripts import get_session

# The materialized views are quite similar, but the difference is adding a condition
# "WHERE KEY in (SELECT name FROM metadata_column WHERE filterable = TRUE)" to which
# entity metadata column keys are kept in the materialized view.


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        session = transaction.run_raw()
        # NOTE: SQL ALchemy doesn't support dropping materialized views using
        # IF EXISTS or creating materialized views.
        stmts = [
            text(
                'DROP MATERIALIZED VIEW IF EXISTS raw_distinct_metadata_materialized_view'
            ),
            text(
                # pylint:disable=line-too-long
                'CREATE MATERIALIZED VIEW raw_distinct_metadata_materialized_view AS SELECT KEY, array_agg(value), entity_type_id FROM ( SELECT KEY, value, count(*) OVER (PARTITION BY KEY) cnt, entity_type_id FROM raw_pipeline_entity, jsonb_each_text(entity_metadata) WHERE KEY in (SELECT name FROM metadata_column WHERE filterable = TRUE) GROUP BY 1, 2, 4) sq WHERE cnt <= 3000 GROUP BY KEY, entity_type_id'
            ),
        ]
        for stmt in stmts:
            session.execute(stmt)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        session = transaction.run_raw()
        stmts = [
            text(
                'DROP MATERIALIZED VIEW IF EXISTS raw_distinct_metadata_materialized_view'
            ),
            text(
                # pylint:disable=line-too-long
                'CREATE MATERIALIZED VIEW raw_distinct_metadata_materialized_view AS SELECT KEY, array_agg(value), entity_type_id FROM ( SELECT KEY, value, count(*) OVER (PARTITION BY KEY) cnt, entity_type_id FROM raw_pipeline_entity, jsonb_each_text(entity_metadata) GROUP BY 1, 2, 4) sq WHERE cnt <= 3000 GROUP BY KEY, entity_type_id'
            ),
        ]
        for stmt in stmts:
            session.execute(stmt)
