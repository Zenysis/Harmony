#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
'''
Populates the various Data Catalog query models in the database:
fields, dimensions, pipeline datasources, categories, etc.

When run without restriction, this script repopulates the database tables using
the config files in config/ as a single source of truth for query models.
-> This overwrites any Data Catalog customizations made by users.

`populate_dimensions_and_datasources_only`: When run only for dimension-related
models, this script primarily uses the config files to repopulate the database
tables, but additionally reads the Data Catalog `field` db table to construct/
update field-dimension mappings. It will also overwrite all non-self serve
datasources with those defined in config.

NOTE: The `populate_dimensions_and_datasources_only` execution of this script
is currently a critical part of the dimension creation workflow. This will
no longer be the case after Dimension Management is built.

To run locally:
    ZEN_ENV=<> ./scripts/data_catalog/populate_query_models_from_config.py
'''
import argparse
import sys
from typing import Dict, List, Set, Tuple

from sqlalchemy.orm.session import Session
from flask import current_app
import related

from config import aggregation
from config import aggregation_rules

# mypy: disable-error-code=attr-defined
from config import calculated_indicators
from config import indicators

from config.druid import DRUID_HOST
from config.general import DEPLOYMENT_NAME

from data.query.mock import generate_query_mock_data, QueryData
from data.query.models.calculation import Calculation
from data.query.models import Category as CategoryModel
from data.query.models import Dimension as DimensionModel
from data.query.models import Field as FieldModel
from data.query.models import FieldMetadata
from data.query.query_models_util import (
    populate_categories,
    populate_data_sources,
    populate_dimensions,
    populate_fields,
    populate_field_dimension_mappings,
    populate_dimension_category_mappings,
)
from log import LOG

# pylint: disable=duplicate-code
from models.alchemy.query import (
    Category,
    Dimension,
    DimensionCategory,
    Field,
    FieldDimensionMapping,
    FieldPipelineDatasourceMapping,
    FieldCategoryMapping,
    PipelineDatasource,
    DimensionCategoryMapping,
)
from scripts.data_catalog.compute_datasource_from_druid import FieldDatasourcesCache
from scripts.data_catalog.compute_enabled_dimensions import FieldDimensionUsageCache
from web.server.app import (
    initialize_cache,
    initialize_druid_context,
)
from web.server.data.data_access import Transaction
from web.server.data.druid_context import PopulatingDruidApplicationContext
from util.local_script_wrapper import local_main_wrapper


def _recursively_find_categories(category: CategoryModel, collection: Set[str]) -> None:
    if not category or category.id in collection:
        return
    collection.add(category.id)
    _recursively_find_categories(category.parent, collection)


def _split_categories_by_type(
    categories: List[CategoryModel],
    field_metadata: FieldMetadata,
    dimensions: List[DimensionModel],
) -> Tuple[List[CategoryModel], List[CategoryModel]]:
    '''In Data Catalog, field categories are stored separately from dimension
    categories. Split the original categories into lists for each type and preserve the
    order of categories as they were originally defined.
    '''
    field_category_ids: Set[str] = set()
    dimension_category_ids: Set[str] = set()

    for metadata in field_metadata:
        _recursively_find_categories(metadata.category, field_category_ids)

    for dimension in dimensions:
        _recursively_find_categories(dimension.category, dimension_category_ids)

    field_categories = []
    dimension_categories = []
    for category in categories:
        if category.id in field_category_ids:
            field_categories.append(category)
        elif category.id in dimension_category_ids:
            dimension_categories.append(category)

    return (field_categories, dimension_categories)


def _clear_query_model_tables(session: Session) -> None:
    '''
    Clear all Data Catalog table values to avoid primary key conflicts.

    This will delete all customizations applied to the query models by the
    user. It is assumed that when this script is called, the config values
    are the source of truth and the database needs to be in sync with it.
    Note that this includes the SelfServeSource table.
    '''
    tables = (
        Category,
        Dimension,
        DimensionCategory,
        Field,
        FieldDimensionMapping,
        FieldPipelineDatasourceMapping,
        FieldCategoryMapping,
        PipelineDatasource,
        DimensionCategoryMapping,
    )
    table_param = ', '.join(table.__tablename__ for table in tables)
    session.connection().execute(f'TRUNCATE {table_param} CONTINUE IDENTITY CASCADE')
    session.commit()


def _get_field_objects_from_fields_table(transaction: Transaction) -> List[FieldModel]:
    '''
    Fetch query fields from the database and convert them to related objects.
    '''
    db_fields = transaction.find_all(Field)

    fields = []
    for field in db_fields:
        raw_calculation = field.calculation
        calculation_obj = Calculation.polymorphic_to_model(raw_calculation)

        # mypy-related-issue
        field_obj = FieldModel(
            field.id, calculation_obj, field.description, field.short_name
        )  # type: ignore[call-arg]
        fields.append(field_obj)

    return fields


def _build_field_id_to_model_lookup(query_data: QueryData) -> Dict[str, Field]:
    fields = {}
    for field in query_data.fields:
        fields[field.id] = Field(
            id=field.id,
            calculation=related.to_dict(field.calculation),
            name=field.field_name,
            short_name=field.short_name,
        )
    return fields


def run_query_model_transactions(
    populate_dimension_config_only: bool,
    query_data: QueryData,
    field_dimension_usage_cache: FieldDimensionUsageCache,
) -> None:
    '''
    Run database transactions for populating query models.

    Use `populate_dimension_config_only` to determine whether `Field`
    source of truth is the database or the config files.
    '''
    (field_categories, dimension_categories) = _split_categories_by_type(
        query_data.linked_categories,
        query_data.field_metadata,
        query_data.dimensions,
    )

    with Transaction() as transaction:
        # Initialize a FieldDatasourcesCache
        field_datasource_cache = FieldDatasourcesCache(
            DEPLOYMENT_NAME, transaction.run_raw()
        )

        if not populate_dimension_config_only:
            _clear_query_model_tables(transaction.run_raw())

        populate_data_sources(
            list(field_datasource_cache.datasources.values()),
            transaction,
            clean_data_sources=populate_dimension_config_only,
        )
        populate_dimensions(
            query_data.dimensions,
            transaction,
            clean_dimensions=populate_dimension_config_only,
        )
        populate_categories(dimension_categories, DimensionCategory, transaction)
        populate_dimension_category_mappings(query_data.dimensions, transaction)

        if populate_dimension_config_only:
            published_fields = _get_field_objects_from_fields_table(transaction)
            populate_field_dimension_mappings(
                published_fields,
                field_dimension_usage_cache,
                transaction,
            )
        else:
            populate_categories(field_categories, Category, transaction)
            fields = _build_field_id_to_model_lookup(query_data)
            field_datasource_cache.build_field_mapping(DEPLOYMENT_NAME, fields, {})
            populate_fields(
                query_data.fields,
                query_data.id_to_fields,
                query_data.id_to_field_metadata,
                query_data.dimensions,
                field_dimension_usage_cache,
                field_datasource_cache.field_to_source,
                transaction,
            )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--populate_dimensions_and_datasources_only',
        action='store_true',
        required=False,
        default=False,
        help='Only populate dimension- and datasource-related tables.',
    )
    args = parser.parse_args()

    app = current_app
    initialize_cache(app)
    initialize_druid_context(
        app,
        datasource_config='LATEST_DATASOURCE',
        cls=PopulatingDruidApplicationContext,
        skip_grouped_sketch_sizes=True,
    )

    # Use config files to generate mock query model data
    LOG.info('Generating Query mock data')
    query_data = generate_query_mock_data(
        indicators.DATA_SOURCES,
        aggregation.DIMENSION_CATEGORIES,
        aggregation.CALENDAR_SETTINGS,
        aggregation_rules.CALCULATIONS_FOR_FIELD,
        calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS,
        app.druid_context.dimension_metadata.field_metadata,
    )
    LOG.info('Finished generating Query mock data')

    # Use dimensions from config files to generate a FieldDimensionUsageCache
    field_dimension_usage_cache = FieldDimensionUsageCache(
        DEPLOYMENT_NAME, DRUID_HOST, list({d.id for d in query_data.dimensions})
    )

    # Populate the database
    LOG.info('Beginning table data population')
    run_query_model_transactions(
        args.populate_dimensions_and_datasources_only,
        query_data,
        field_dimension_usage_cache,
    )
    LOG.info('Completed table data population')


if __name__ == '__main__':
    sys.exit(local_main_wrapper(main))
