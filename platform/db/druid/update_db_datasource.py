from functools import reduce
from typing import Optional

from flask import current_app, Flask
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert

from config import aggregation  # type: ignore[attr-defined]
from config import aggregation_rules  # type: ignore[attr-defined]
from config import calculated_indicators  # type: ignore[attr-defined]
from config import indicators  # type: ignore[attr-defined]
from config.general import DEPLOYMENT_NAME
from data.query.mock import (
    generate_query_mock_data,
    build_dimension_values,
)
from log import LOG
from models.alchemy.query import (
    DimensionValue,
    DruidDatasource,
)
from models.alchemy.mixin import utcnow

from web.server.app_druid import initialize_druid_context
from web.server.data.data_access import Transaction
from web.server.data.druid_context import PopulatingDruidApplicationContext


def update_db_datasource(
    datasource_config: Optional[str] = 'LATEST_DATASOURCE',
    skip_grouped_sketch_sizes: bool = False,
) -> None:
    '''Makes a new datasource available to be used in a web server context.
    To do that it adds it to its database as well as all meta data about it.
    '''
    app = current_app
    initialize_druid_context(app, datasource_config='LATEST_DATASOURCE')
    valid_datasources = app.druid_context.druid_metadata.get_datasources_for_site(
        DEPLOYMENT_NAME
    )
    if datasource_config is not None:
        _populate_datasource(app, datasource_config, skip_grouped_sketch_sizes)
    else:
        LOG.info('Populating datasources %s', valid_datasources)
        for datasource in valid_datasources:
            LOG.info('Processing datasource %s', datasource)
            _populate_datasource(app, datasource, skip_grouped_sketch_sizes)

    LOG.info(
        'Beginning cleaning up of vanished datasources... Valid datasets are %s',
        valid_datasources,
    )

    with Transaction() as transaction:
        session = transaction.run_raw()
        deleted_datasource_ids = [
            ds_id
            for ds_id, in session.execute(
                # pylint: disable=no-member
                DruidDatasource.__table__.delete()
                .where(DruidDatasource.datasource.notin_(valid_datasources))
                .returning(DruidDatasource.id)
            )
        ]

        # First, remove the deleted datasources from all the rows that were referencing it
        session.query(DimensionValue).filter(
            DimensionValue.datasources.op('&&')(deleted_datasource_ids)
        ).update(
            {
                'datasources': reduce(
                    func.array_remove,
                    deleted_datasource_ids,
                    DimensionValue.datasources,
                )
            },
            synchronize_session=False,
        )

        # Then remove the rows that were orpaned by the previous one, i.e. now have no any
        # associated datasources
        session.query(DimensionValue).filter(DimensionValue.datasources == []).delete(
            synchronize_session=False
        )


def _populate_datasource(
    app: Flask, datasource_config: str, skip_grouped_sketch_sizes: bool
) -> None:
    initialize_druid_context(
        app,
        datasource_config=datasource_config,
        cls=PopulatingDruidApplicationContext,
        skip_grouped_sketch_sizes=skip_grouped_sketch_sizes,
    )

    LOG.info('Generating Query mock data')
    druid_context = app.druid_context
    dimension_values = druid_context.dimension_values_lookup
    query_data = generate_query_mock_data(
        indicators.DATA_SOURCES,
        aggregation.DIMENSION_CATEGORIES,
        aggregation.CALENDAR_SETTINGS,
        aggregation_rules.CALCULATIONS_FOR_FIELD,
        calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS,
        druid_context.dimension_metadata.field_metadata,
    )
    LOG.info('Finished generating Query mock data')

    LOG.info('Beginning data population...')
    with Transaction() as transaction:
        datasource_values = {
            'datasource': druid_context.current_datasource.name,
            'min_date': druid_context.data_time_boundary.get_min_data_date(),
            'max_date': druid_context.data_time_boundary.get_max_data_date(),
            'meta_data': {
                'sketch_sizes': druid_context.dimension_metadata.sketch_sizes,
                'grouped_dimension_sketch_sizes': (
                    druid_context.dimension_metadata.grouped_dimension_sketch_sizes
                ),
            },
            'last_modified': utcnow(),
        }
        (current_datasource_id,) = next(
            transaction.run_raw().execute(
                insert(DruidDatasource)
                .values(datasource_values)
                .on_conflict_do_update(
                    index_elements=['datasource'],
                    set_=datasource_values,
                )
                .returning(DruidDatasource.id)
            )
        )
        build_dimension_values(
            transaction.run_raw(),
            current_datasource_id,
            query_data.dimensions,
            dimension_values.dimension_map,
            aggregation.DIMENSION_PARENTS,
        )
