#!/usr/bin/env python
import os
import sys
from typing import Dict, List, Optional

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker
import related
from pylib.base.flags import Flags

import config.aggregation as aggregation
import config.aggregation_rules as aggregation_rules
import config.calculated_indicators as calculated_indicators
import config.indicators as indicators

from config.druid import DRUID_HOST
from config.general import DEPLOYMENT_NAME
from data.query.models.calculation.formula_calculation import (
    Constituent,
    FormulaCalculation,
)
from data.query.mock import build_calculation, generate_query_mock_data
from log import LOG
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
from util.credentials.provider import CredentialProvider
from web.server.data.data_access import Transaction
from web.server.configuration.instance import load_instance_configuration_from_file


# List of properties that will potentially appear on a raw indicator definition that are
# necessary for creating its raw calculation.
INDICATOR_CALCULATION_PROPERTIES = (
    'children',
    'filter_field',
    'sources',
    'stock_granularity',
    'subtype',
    'theta_sketch_field',
    'theta_sketch_size',
    'type',
)


def get_session(sql_connection_string):
    # pylint: disable=invalid-name
    Session = sessionmaker()
    engine = create_engine(sql_connection_string)
    Session.configure(bind=engine)
    session = Session()
    return session


def get_indicator_calculation(ind_id):
    '''Build a dictionary containing the low level properties that are needed to
    describe this indicator's calculation. This calculation is the same thing that
    exists on the *raw* indicator definition and is more specific than the Query
    Tool's calculation type that exists for the field.
    '''
    # Use config.indicators.ID_LOOKUP to get the original indicator definition for
    # non-calculated indicators.
    indicator = indicators.ID_LOOKUP[ind_id]
    ind_type = indicator.get('type')

    # If there is no indicator type, then this indicator is either a calculated
    # indicator or it uses the default "SUM" indicator type.
    if not ind_type:
        formula = calculated_indicators.CALCULATED_INDICATOR_FORMULAS.get(ind_id)
        if formula:
            return {'formula': formula, 'type': 'calculated_indicator'}
        # TODO(yitian, stephen): Maybe we should store `type: SUM` for these default
        # indicators? Right now `aggregation_rules.py` doesn't explicitly check for it
        # so adding it in could break things.
        return {}

    output = {}
    for key in INDICATOR_CALCULATION_PROPERTIES:
        # Only store the property if it exists on the original indicator. Since this is
        # not standardized, we need to check for many different properties even though
        # type/subtype are the most common.
        if key in indicator:
            output[key] = indicator[key]
    return output


def build_formula_calculation(field_id, id_to_fields, dimension_id_map):
    '''Try to build a FormulaCalculation for the provided calculated indicator field.
    This requires building every constituent calculation and attaching it to the
    FormulaCalculation returned.
    '''
    formula = calculated_indicators.CALCULATED_INDICATOR_FORMULAS[field_id]
    constituent_ids = calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS[field_id]
    constituents = []
    for constituent_id in constituent_ids:
        # If a query tool compatible calculation exists, we can operate directly on it.
        # Otherwise, we will have to build a calculation for this constituent using the
        # raw calculation.
        if constituent_id in id_to_fields:
            constituent = id_to_fields[constituent_id]
            calculation = constituent.calculation
            name = constituent.canonical_name
        else:
            # Call the Query Tool mock data `build_calculation` method to
            # try to coerce the raw calculation that exists for this
            # constituent into a Query Tool compatible calculation type.
            calculation = build_calculation(
                constituent_id, aggregation_rules.CALCULATIONS_FOR_FIELD
            )
            name = indicators.ID_LOOKUP.get(constituent_id, {}).get(
                'text', constituent_id
            )

        # NOTE(stephen): We cannot use the calculation we found for this constituent
        # directly, we still must attempt to build the "final" calculation
        # representation. This is because the constituent calculation itself could be
        # `COMPLEX` and require unpacking into its final form. This would not be
        # necessary if the Query Tool mock data generator produced FormulaCalculations
        # directly. However, since the FormulaCalculation is not finalized, we will do
        # it here.
        final_calculation = build_final_calculation(
            constituent_id, calculation, id_to_fields, dimension_id_map
        )
        constituents.append(
            Constituent(id=constituent_id, calculation=final_calculation, name=name)
        )

    return FormulaCalculation(constituents=constituents, expression=formula)


def build_final_calculation(field_id, calculation, id_to_fields, dimension_id_map):
    '''Build the calculation that should be stored in the database. This method exists
    so that we can handle ComplexCalculations in a special way. The Query
    Tool mock data generator will still produce ComplexCalculations until we
    are confident in the calculation models we build to handle all the edge
    cases that ComplexCalculation glosses over.
    '''
    # If this calculation is not COMPLEX, that means the Query Tool can
    # already handle the calculation type natively.
    if calculation.type != 'COMPLEX':
        return calculation

    # Handle calculated indicator formulas.
    # NOTE(stephen): Building a FormulaCalculation directly since the Query
    # Tool mock data does not yet generate it for us. It's currently
    # being tested in DataCatalogApp.
    formula = calculated_indicators.CALCULATED_INDICATOR_FORMULAS.get(field_id)
    if formula:
        return build_formula_calculation(field_id, id_to_fields, dimension_id_map)

    # Unfortunately we still have a ComplexCalculation that we cannot resolve at this
    # time.
    # TODO(stephen): Figure out how to eliminate ComplexCalculations from the site since
    # the DB will become the source of truth and config files will no longer be able to
    # resolve the value at query time.
    return calculation


def split_categories_by_type(categories, field_metadata, dimensions):
    '''In Data Catalog, field categories are stored separately from dimension
    categories. Split the original categories into lists for each type and preserve the
    order of categories as they were originally defined.
    '''

    def recursively_find_categories(category, collection):
        if not category or category.id in collection:
            return
        collection.add(category.id)
        recursively_find_categories(category.parent, collection)

    field_category_ids = set()
    dimension_category_ids = set()

    for metadata in field_metadata:
        recursively_find_categories(metadata.category, field_category_ids)

    for dimension in dimensions:
        recursively_find_categories(dimension.category, dimension_category_ids)

    field_categories = []
    dimension_categories = []
    for category in categories:
        if category.id in field_category_ids:
            field_categories.append(category)
        elif category.id in dimension_category_ids:
            dimension_categories.append(category)

    return (field_categories, dimension_categories)


def populate_data_sources(
    data_sources: List[Dict[str, str]], transaction, clean_data_sources
):
    data_source_id_set = set()
    for data_source in data_sources:
        if clean_data_sources:
            data_source_id_set.add(data_source['id'])
        existing_data_source = transaction.find_by_id(
            PipelineDatasource, data_source['id']
        )
        if not existing_data_source:
            transaction.add_or_update(
                PipelineDatasource(id=data_source['id'], name=data_source['name'])
            )
        else:
            existing_data_source.name = data_source['name']
            transaction.add_or_update(existing_data_source)

    # Manually clean dimension table if we are only updating dimensions and data
    # sources
    # HACK(abby): Temporarily disabling this as source ids are being updated and this
    # would cause the pipeline datasource mapping tables to be cleared.
    # if clean_data_sources:
    #     all_db_data_sources = transaction.find_all_by_fields(PipelineDatasource, {})
    #     for data_source in all_db_data_sources:
    #         if data_source.id not in data_source_id_set:
    #             # Clean up field pipeline datasource mappings
    #             for field_mapping in data_source.field_mapping:
    #                 transaction.delete(field_mapping)
    #             transaction.delete(data_source)

    LOG.info('Successfully populated data sources')


def populate_dimensions(dimensions, transaction, clean_dimensions):
    dimension_id_set = set()
    for dimension in dimensions:
        if clean_dimensions:
            dimension_id_set.add(dimension.id)
        existing_dimension = transaction.find_by_id(Dimension, dimension.id)
        if not existing_dimension:
            transaction.add_or_update(Dimension(id=dimension.id, name=dimension.name))
        else:
            existing_dimension.name = dimension.name
            transaction.add_or_update(existing_dimension)

    # Manually clean dimension table if we are only updating dimensions and data
    # sources
    if clean_dimensions:
        all_db_dimensions = transaction.find_all_by_fields(Dimension, {})
        for dimension in all_db_dimensions:
            if dimension.id not in dimension_id_set:
                # Clean up dimension category mappings
                for category_mapping in dimension.category_mapping:
                    transaction.delete(category_mapping)
                # Clean up field dimension mappings
                for field_mapping in dimension.field_mappings:
                    transaction.delete(field_mapping)
                transaction.delete(dimension)

    transaction.run_raw().flush()
    LOG.info('Successfully populated dimensions')


def populate_dimension_category_mappings(dimensions, transaction):
    mappings = []
    for dimension in dimensions:
        mapping_object = {
            'category_id': dimension.category.id,
            'dimension_id': dimension.id,
        }
        if not transaction.find_all_by_fields(
            DimensionCategoryMapping, mapping_object
        ).first():
            mappings.append(mapping_object)
    transaction.run_raw().bulk_insert_mappings(DimensionCategoryMapping, mappings)
    LOG.info('Successfully populated dimension to category mappings')


def populate_categories(categories, category_model_cls, transaction):
    categories_added = set()

    # NOTE(stephen): The root category should always exist in the DB. Make sure that we
    # repopulate it here first since this script truncates the tables.
    if not transaction.find_by_id(category_model_cls, 'root'):
        transaction.add_or_update(category_model_cls(id='root', name='__root__'))
    for category in categories:
        category_stack = []
        category_stack.append((category.id, category.name))
        parent = category.parent
        while parent:
            category_stack.append((parent.id, parent.name))
            parent = parent.parent

        curr_parent_id, curr_parent_name = category_stack.pop()
        # Add parent if it doesn't exist in db.
        if curr_parent_id not in categories_added:
            curr_parent_name = curr_parent_name or curr_parent_id
            if not transaction.find_by_id(category_model_cls, curr_parent_id):
                transaction.add_or_update(
                    category_model_cls(
                        id=curr_parent_id, name=curr_parent_name, parent_id='root'
                    )
                )
            categories_added.add(curr_parent_id)

        while category_stack:
            child_id, child_name = category_stack.pop()
            # Add child if it doesn't exist in db.
            if child_id not in categories_added:
                child_name = child_name or child_id
                if not transaction.find_by_id(category_model_cls, child_id):
                    transaction.add_or_update(
                        category_model_cls(
                            id=child_id, name=child_name, parent_id=curr_parent_id
                        )
                    )
                categories_added.add(child_id)
            curr_parent_id = child_id

    # Need to flush the categories added to the DB so that any foreign key dependencies
    # on this table are available to be referenced (i.e. field category mappings).
    transaction.run_raw().flush()
    LOG.info('Successfully populated %s categories', category_model_cls.__name__)


def populate_fields(
    fields,
    id_to_fields,
    id_to_field_metadata,
    dimensions,
    field_dimension_usage_cache: Optional[FieldDimensionUsageCache],
    field_pipeline_mapping: Dict[str, str],
    transaction,
):
    new_fields = []
    new_field_category_mappings = []
    new_datasource_mappings = []
    new_field_dimension_mappings = []
    dimension_id_map = {dimension.id: dimension for dimension in dimensions}
    for field in fields:
        field_id = field.id
        metadata = id_to_field_metadata[field_id]
        calculation = build_final_calculation(
            field_id, field.calculation, id_to_fields, dimension_id_map
        )

        # NOTE(stephen): Storing the serialized calculation directly in the database so
        # that the frontend can deserialize it into a full model before querying.
        serialized_calculation = related.to_dict(calculation, dict_factory=dict)
        new_fields.append(
            {
                'id': field_id,
                'calculation': serialized_calculation,
                'description': metadata.description,
                'name': field.canonical_name,
                'short_name': field.short_name,
            }
        )
        new_field_category_mappings.append(
            {'category_id': metadata.category.id, 'field_id': field_id}
        )
        if field_id in field_pipeline_mapping:
            new_datasource_mappings.append(
                {
                    'field_id': field_id,
                    'pipeline_datasource_id': field_pipeline_mapping[field_id],
                }
            )

        # NOTE(stephen): Using the field dimension usage cache to find the dimension
        # mapping. Preferring this over the Query Tool Field.metadata property
        # since that value is not always populated and does not dive as
        # deeply into a field's calculation to determine what dimensions
        # are supported.
        if field_dimension_usage_cache:
            enabled_dimensions = field_dimension_usage_cache.compute_enabled_dimensions(
                calculation
            )
            for enabled_dimension in enabled_dimensions:
                new_field_dimension_mappings.append(
                    {'dimension_id': enabled_dimension, 'field_id': field_id}
                )

    # NOTE(stephen): Significant performance improvement if we use the bulk insert.
    # Normally performance isn't that critical for this one-off script, however its
    # useful in this case since we populate the indicator DB many times for each
    # deployment.
    session = transaction.run_raw()
    session.bulk_insert_mappings(Field, new_fields)
    session.flush()

    session.bulk_insert_mappings(FieldCategoryMapping, new_field_category_mappings)
    session.bulk_insert_mappings(
        FieldPipelineDatasourceMapping, new_datasource_mappings
    )
    session.bulk_insert_mappings(FieldDimensionMapping, new_field_dimension_mappings)
    session.flush()
    LOG.info('Successfully populated fields')


def main():
    '''Populates the various query models -- fields, dimensions, pipeline
    datasources, categories, etc.

    To run locally:
        ./scripts/data_catalog/populate_query_models_from_config.py
    '''
    Flags.PARSER.add_argument(
        '-d',
        '--sql_connection_string',
        type=str,
        required=False,
        help='The SQL Connection String to use to connect to the SQL '
        'Database. Can also be specified via the \'DATABASE_URL\' '
        'environment variable. The inline parameter takes priority'
        'over the environment variable.',
    )
    Flags.PARSER.add_argument(
        '--populate_dimensions_and_datasources_only',
        action='store_true',
        required=False,
        default=False,
        help='Only populate dimension and datasource related tables.',
    )

    Flags.InitArgs()

    sql_connection_string = Flags.ARGS.sql_connection_string
    if not sql_connection_string:
        instance_configuration = load_instance_configuration_from_file()
        with CredentialProvider(instance_configuration) as credential_provider:
            sql_connection_string = credential_provider.get('SQLALCHEMY_DATABASE_URI')

    LOG.info('Generating Query mock data')
    query_data = generate_query_mock_data(
        {},
        indicators.DATA_SOURCES,
        aggregation.DIMENSION_PARENTS,
        aggregation.DIMENSION_CATEGORIES,
        aggregation.CALENDAR_SETTINGS,
        aggregation_rules.CALCULATIONS_FOR_FIELD,
        calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS,
        aggregation.DIMENSION_ID_MAP,
        {},
    )
    LOG.info('Finished generating Query mock data')

    populate_dimensions_and_datasources_only = (
        Flags.ARGS.populate_dimensions_and_datasources_only
    )

    # NOTE(stephen): Only populate the supported dimensions for each field if the user
    # has opted in. This will increase how long this script takes to run and the
    # feature is still in active development.
    field_dimension_usage_cache = None
    if not populate_dimensions_and_datasources_only and os.getenv(
        'POPULATE_FIELD_DIMENSION_MAPPING'
    ):
        field_dimension_usage_cache = FieldDimensionUsageCache(
            DEPLOYMENT_NAME, DRUID_HOST, [d.id for d in query_data.dimensions]
        )

    session = get_session(sql_connection_string)

    # First, clear all table values so that we do not get primary key conflicts.
    # NOTE(stephen): This will delete all customizations applied to the query models
    # by the user. It is assumed that when this script is called, the config values
    # are the source of truth and the database needs to be in sync with it.
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

    if not populate_dimensions_and_datasources_only:
        # NOTE(abby): This will also clear the SelfServeSource table.
        table_param = ', '.join(table.__tablename__ for table in tables)

        # Issue the truncate query to postgres. Pylint does not understand the dynamic
        # session object very well.
        # pylint: disable=no-member
        session.connection().execute(
            f'TRUNCATE {table_param} CONTINUE IDENTITY CASCADE'
        )
        session.commit()

    (field_categories, dimension_categories) = split_categories_by_type(
        query_data.linked_categories, query_data.field_metadata, query_data.dimensions
    )

    field_datasource_cache = FieldDatasourcesCache(DEPLOYMENT_NAME, session)

    LOG.info('Beginning data population...')

    with Transaction(get_session=lambda: session) as transaction:
        populate_data_sources(
            field_datasource_cache.datasources.values(),
            transaction,
            clean_data_sources=populate_dimensions_and_datasources_only,
        )
        populate_dimensions(
            query_data.dimensions,
            transaction,
            clean_dimensions=populate_dimensions_and_datasources_only,
        )
        populate_categories(dimension_categories, DimensionCategory, transaction)
        # populate_dimension_category_mappings needs to be called after both
        # populate_dimensions and populate_categories
        populate_dimension_category_mappings(query_data.dimensions, transaction)

        if not populate_dimensions_and_datasources_only:
            field_datasource_cache.build_field_mapping(DEPLOYMENT_NAME, session)
            populate_categories(field_categories, Category, transaction)
            populate_fields(
                query_data.fields,
                query_data.id_to_fields,
                query_data.id_to_field_metadata,
                query_data.dimensions,
                field_dimension_usage_cache,
                field_datasource_cache.field_to_source,
                transaction,
            )


if __name__ == '__main__':
    sys.exit(main())
