#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
'''
This file contains utility methods for working with Data Catalog query models:
fields, dimensions, pipeline datasources, categories, etc.

The populate_* functions are used to move Related models built from config files
into the database using SQLAlchemy.
'''
from typing import Dict, List, Optional, Type, TypedDict, Union
import related

# mypy: disable-error-code=attr-defined
from config import aggregation_rules
from config import calculated_indicators
from config import indicators

from data.query.mock import build_calculation
from data.query.models import Category as CategoryModel
from data.query.models import Dimension as DimensionModel
from data.query.models import Field as FieldModel
from data.query.models import FieldMetadata
from data.query.models.calculation import Calculation as CalculationModel
from data.query.models.calculation.formula_calculation import (
    Constituent,
    FormulaCalculation,
)
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
from log import LOG
from scripts.data_catalog.compute_enabled_dimensions import FieldDimensionUsageCache
from web.server.data.data_access import Transaction


class FieldCategoryMappingData(TypedDict):
    category_id: str
    field_id: str


class DatasourceMappingData(TypedDict):
    field_id: str
    pipeline_datasource_id: str


class FieldDimensionMappingData(TypedDict):
    dimension_id: str
    field_id: str


def build_final_calculation(
    field_id: str,
    calculation: CalculationModel,
    id_to_fields: Dict[str, FieldModel],
    dimension_id_map: Dict[str, DimensionModel],
) -> CalculationModel:
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
    # NOTE: Building a FormulaCalculation directly since the Query
    # Tool mock data does not yet generate it for us. It's currently
    # being tested in DataCatalogApp.
    formula = calculated_indicators.CALCULATED_INDICATOR_FORMULAS.get(field_id)
    if formula:
        return _build_formula_calculation(field_id, id_to_fields, dimension_id_map)

    # Unfortunately we still have a ComplexCalculation that we cannot resolve at this
    # time.
    # TODO: Figure out how to eliminate ComplexCalculations from the site since
    # the DB will become the source of truth and config files will no longer be able to
    # resolve the value at query time.
    return calculation


def _build_formula_calculation(
    field_id: str,
    id_to_fields: Dict[str, FieldModel],
    dimension_id_map: Dict[str, DimensionModel],
) -> FormulaCalculation:
    '''Try to build a FormulaCalculation for the provided calculated indicator field.
    This requires building every constituent calculation and attaching it to the
    FormulaCalculation returned.
    '''
    formula = calculated_indicators.CALCULATED_INDICATOR_FORMULAS[field_id]
    constituent_ids = calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS[field_id]
    constituents: List[Constituent] = []
    for constituent_id in constituent_ids:
        # If a query tool compatible calculation exists, we can operate directly on it.
        # Otherwise, we will have to build a calculation for this constituent using the
        # raw calculation.
        if constituent_id in id_to_fields:
            # mypy-related-issue
            constituent = id_to_fields[constituent_id]
            calculation = constituent.calculation  # type: ignore[call-arg]
            name = constituent.canonical_name  # type: ignore[call-arg]
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

        # NOTE: We cannot use the calculation we found for this constituent
        # directly, we still must attempt to build the "final" calculation
        # representation. This is because the constituent calculation itself could be
        # `COMPLEX` and require unpacking into its final form. This would not be
        # necessary if the Query Tool mock data generator produced FormulaCalculations
        # directly. However, since the FormulaCalculation is not finalized, we will do
        # it here.
        final_calculation = build_final_calculation(
            constituent_id, calculation, id_to_fields, dimension_id_map
        )
        # mypy-related-issue
        constituents.append(
            Constituent(  # type: ignore[call-arg]
                id=constituent_id,
                calculation=final_calculation,
                name=name,
            )
        )

    return FormulaCalculation(constituents=constituents, expression=formula)


def populate_data_sources(
    data_sources: List[Dict[str, str]],
    transaction: Transaction,
    clean_data_sources: bool,
) -> None:
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
    if clean_data_sources:
        all_db_data_sources = transaction.find_all_by_fields(PipelineDatasource, {})
        for db_data_source in all_db_data_sources:
            if db_data_source.id not in data_source_id_set:
                # Clean up field pipeline datasource mappings
                for field_mapping in db_data_source.field_mapping:
                    transaction.delete(field_mapping)
                transaction.delete(db_data_source)

    LOG.info('Successfully populated data sources')


def populate_dimensions(
    dimensions: List[DimensionModel], transaction: Transaction, clean_dimensions: bool
) -> None:
    dimension_lookup = {}
    for dimension in dimensions:
        if clean_dimensions:
            dimension_lookup[dimension.id] = dimension
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
            if dimension.id not in dimension_lookup:
                # Clean up dimension category mappings
                for category_mapping in dimension.category_mapping:
                    transaction.delete(category_mapping)
                # Clean up field dimension mappings
                for field_mapping in dimension.field_mappings:
                    transaction.delete(field_mapping)
                transaction.delete(dimension)
            else:
                # Clean up dimension category mappings in the case a dimension
                # changed categories
                for category_mapping in dimension.category_mapping:
                    if (
                        category_mapping.category_id
                        != dimension_lookup[dimension.id].category.id
                    ):
                        transaction.delete(category_mapping)

    transaction.run_raw().flush()
    LOG.info('Successfully populated dimensions')


def populate_dimension_category_mappings(
    dimensions: List[DimensionModel], transaction: Transaction
) -> None:
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


def populate_categories(
    categories: List[CategoryModel],
    category_model_cls: Union[Type[Category], Type[DimensionCategory]],
    transaction: Transaction,
) -> None:
    categories_added = set()

    # NOTE: The root category should always exist in the DB. Make sure that we
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
    fields: List[FieldModel],
    id_to_fields: Dict[str, FieldModel],
    id_to_field_metadata: Dict[str, FieldMetadata],
    dimensions: List[DimensionModel],
    field_dimension_usage_cache: Optional[FieldDimensionUsageCache],
    field_pipeline_mapping: Dict[str, str],
    transaction: Transaction,
) -> None:
    new_fields = []
    new_field_category_mappings: List[FieldCategoryMappingData] = []
    new_datasource_mappings: List[DatasourceMappingData] = []
    new_field_dimension_mappings: List[FieldDimensionMappingData] = []
    dimension_id_map = {dimension.id: dimension for dimension in dimensions}
    for field in fields:
        field_id = field.id
        metadata = id_to_field_metadata[field_id]
        calculation = build_final_calculation(
            field_id, field.calculation, id_to_fields, dimension_id_map
        )

        # NOTE: Storing the serialized calculation directly in the database so
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

        # NOTE: Using the field dimension usage cache to find the dimension
        # mapping. Preferring this over the Query Tool Field.metadata property
        # since that value is not always populated and does not dive as
        # deeply into a field's calculation to determine what dimensions
        # are supported.
        if field_dimension_usage_cache:
            enabled_dimensions = field_dimension_usage_cache.compute_enabled_dimensions(
                calculation
            )
            new_field_dimension_mappings.extend(
                {'dimension_id': enabled_dimension, 'field_id': field_id}
                for enabled_dimension in enabled_dimensions
            )

    # NOTE: Significant performance improvement if we use the bulk insert.
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


def populate_field_dimension_mappings(
    fields: List[FieldModel],
    field_dimension_usage_cache: FieldDimensionUsageCache,
    transaction: Transaction,
) -> None:
    # Clear out existing field-dimension mappings.
    # Safe as table is only updated via this function.
    session = transaction.run_raw()
    session.connection().execute(
        'TRUNCATE field_dimension_mapping CONTINUE IDENTITY CASCADE'
    )
    session.commit()

    new_field_dimension_mappings = []
    for field in fields:
        field_id = field.id
        # TODO: compute_enabled_dimensions doesn't support cohort calcs
        enabled_dimensions = field_dimension_usage_cache.compute_enabled_dimensions(
            field.calculation
        )
        for enabled_dimension in enabled_dimensions:
            new_field_dimension_mappings.append(
                {'dimension_id': enabled_dimension, 'field_id': field_id}
            )

    session.bulk_insert_mappings(FieldDimensionMapping, new_field_dimension_mappings)
    session.flush()
    LOG.info('Successfully populated field-dimension mappings')
