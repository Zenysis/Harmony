from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import text


from web.server.data.data_access import Transaction
from web.server.migrations.seed_scripts import get_session

Base = declarative_base()


def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        session = transaction.run_raw()
        # NOTE: SQL ALchemy doesn't support creating materialized views
        stmts = [
            text(
                'CREATE MATERIALIZED VIEW raw_entity_count_materialized_view AS SELECT entity_type_id AS entity_type_id, COUNT(*) AS count FROM raw_pipeline_entity WHERE in_latest_datasource = true GROUP BY entity_type_id'
            ),
            text(
                'CREATE MATERIALIZED VIEW canonical_entity_count_materialized_view AS SELECT entity_type_id AS entity_type_id, COUNT(*) AS count FROM canonical_pipeline_entity WHERE in_latest_datasource = true GROUP BY entity_type_id'
            ),
            text(
                'CREATE MATERIALIZED VIEW raw_distinct_metadata_materialized_view AS SELECT KEY, array_agg(value), entity_type_id FROM ( SELECT KEY, value, count(*) OVER (PARTITION BY KEY) cnt, entity_type_id FROM raw_pipeline_entity, jsonb_each_text(entity_metadata) GROUP BY 1, 2, 4) sq WHERE cnt <= 3000 GROUP BY KEY, entity_type_id'
            ),
            text(
                'CREATE MATERIALIZED VIEW raw_datasources_materialized_view AS SELECT DISTINCT source, entity_type_id FROM raw_pipeline_entity WHERE raw_pipeline_entity.in_latest_datasource = TRUE'
            ),
            text(
                "CREATE MATERIALIZED VIEW true_matches_materialized_view AS SELECT entity_type_id AS entity_type_id, COUNT(*) as count FROM pipeline_entity_match JOIN raw_pipeline_entity ON pipeline_entity_match.raw_entity_id = raw_pipeline_entity.id WHERE pipeline_entity_match.validated_status != 'BANNED' AND pipeline_entity_match.self_match = FALSE AND raw_pipeline_entity.in_latest_datasource = TRUE GROUP BY entity_type_id"
            ),
        ]
        for stmt in stmts:
            session.execute(stmt)


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        # NOTE: SQL Alchemy doesn't support dropping materialized views
        # using IF EXISTS as we still want to allow downverting if someone messed with the
        # materialized views
        session = transaction.run_raw()
        stmts = [
            text('DROP MATERIALIZED VIEW IF EXISTS raw_entity_count_materialized_view'),
            text(
                'DROP MATERIALIZED VIEW IF EXISTS canonical_entity_count_materialized_view'
            ),
            text(
                'DROP MATERIALIZED VIEW IF EXISTS raw_distinct_metadata_materialized_view'
            ),
            text('DROP MATERIALIZED VIEW IF EXISTS raw_datasources_materialized_view'),
            text('DROP MATERIALIZED VIEW IF EXISTS true_matches_materialized_view'),
        ]
        for stmt in stmts:
            session.execute(stmt)
