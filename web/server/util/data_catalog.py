import csv
import os
import zipfile
import related
import sqlalchemy

from data.query.models.calculation import (
    AverageCalculation,
    AverageOverTimeCalculation,
    CohortCalculation,
    ComplexCalculation,
    CountCalculation,
    CountDistinctCalculation,
    FormulaCalculation,
    LastValueCalculation,
    MaxCalculation,
    MinCalculation,
    SyntheticCalculation,
    WindowCalculation,
    SumCalculation,
)
from data.query.models.calculation.last_value_calculation import AggregationOperation
from data.query.models.calculation.synthetic_calculation.window_calculation import (
    WindowOperation,
    DEFAULT_WINDOW_SIZE,
)
from data.query.models.query_filter import FieldFilter
from log import LOG
from models.alchemy.query import (
    Category,
    Dimension,
    Field,
    FieldPipelineDatasourceMapping,
    FieldCategoryMapping,
    PipelineDatasource,
)


# TODO(solo,yitian): Add support for cohort and formula calculation
# This script currently doesn't support cohort and formula.
# because it's pretty difficult to mass import these two types.


CALCULATION_TYPE_MAPPINGS = {
    'AVG': AverageCalculation,
    'AVERAGE_OVER_TIME': AverageOverTimeCalculation,
    'COHORT': CohortCalculation,
    'COMPLEX': ComplexCalculation,
    'COUNT': CountCalculation,
    'COUNT_DISTINCT': CountDistinctCalculation,
    'FORMULA': FormulaCalculation,
    'LAST_VALUE': LastValueCalculation,
    'MAX': MaxCalculation,
    'MIN': MinCalculation,
    'SYNTHETIC': SyntheticCalculation,
    'WINDOW': WindowCalculation,
    'SUM': SumCalculation,
}


WINDOW_OPERATION_MAPPINGS = {
    'AVERAGE': WindowOperation.AVERAGE,
    'MAX': WindowOperation.MAX,
    'MIN': WindowOperation.MIN,
    'SUM': WindowOperation.SUM,
}

AGGREGATION_OPERATION_MAPPINGS = {
    'AVERAGE': AggregationOperation.AVERAGE,
    'COUNT': AggregationOperation.COUNT,
    'MAX': AggregationOperation.MAX,
    'MIN': AggregationOperation.MIN,
    'SUM': AggregationOperation.SUM,
}


def is_valid_calculation(calculation):
    '''A simple calculation validation that ensures calculation type string
    is mapped to a defined calculation model
    '''
    return calculation in CALCULATION_TYPE_MAPPINGS


def validate_row(
    field_id,
    name,
    short_name,
    description,
    calculation,
    category_id,
    pipeline_datasource_id,
    error_msgs,
    transaction,
):
    '''We cannot add/update a field if
    (1) id value is missing OR
    (2) this is a new field and there are missing column values OR
    (3) category_id exists but is invalid
    (4) pipeline_datasource_id exists but is invalid
    If any of the above conditions are true, we skip and don't add/update
    the current row.
    '''
    skip_row = False
    has_empty_cells = False
    has_invalid_category_id = False
    has_invalid_datasource_id = False
    # Intentionally not returning if this statement is true so that we can
    # collect additional statistics about the validity of the input row.
    if not field_id:
        err_msg = 'Id value is missing.'
        error_msgs.append(err_msg)
        LOG.error(err_msg)
        skip_row = True
        has_empty_cells = True

    field_exists = transaction.find_by_id(Field, field_id) is not None

    if not field_exists and not (
        name
        or short_name
        or category_id
        or pipeline_datasource_id
        or calculation
        or description
    ):
        err_msg = 'Cannot populate a new field with missing properties'
        error_msgs.append(err_msg)
        LOG.error(err_msg)
        skip_row = True
        has_empty_cells = True
    else:
        if calculation and not is_valid_calculation(calculation):
            err_msg = 'Invalid calculation'
            error_msgs.append(err_msg)
            LOG.error(err_msg)
            skip_row = True
        if category_id and not transaction.find_by_id(Category, category_id):
            err_msg = 'Category id "%s" does not exist' % category_id
            error_msgs.append(err_msg)
            LOG.error(err_msg)
            skip_row = True
            has_invalid_category_id = True
        if pipeline_datasource_id and not transaction.find_by_id(
            PipelineDatasource, pipeline_datasource_id
        ):
            err_msg = (
                'Pipeline datasource id "%s" does not exist' % pipeline_datasource_id
            )
            error_msgs.append(err_msg)
            LOG.error(err_msg)
            skip_row = True
            has_invalid_datasource_id = True

    return (
        has_empty_cells,
        skip_row,
        has_invalid_category_id,
        has_invalid_datasource_id,
        error_msgs,
    )


def build_calculation(
    calculation_type, calculation_property, calculation_sub_property, field_id
):
    calculation_type = calculation_type.strip()
    calculation_cls = CALCULATION_TYPE_MAPPINGS[calculation_type]
    query_filter = FieldFilter(field_id=field_id)
    if calculation_type == 'COUNT_DISTINCT':
        calc = calculation_cls(filter=query_filter, dimension=calculation_property)

    elif calculation_type == 'LAST_VALUE':
        operation = AGGREGATION_OPERATION_MAPPINGS.get(
            calculation_property, AggregationOperation.SUM
        )
        calc = calculation_cls(filter=query_filter, operation=operation)
    elif calculation_type == 'WINDOW':
        operation = WINDOW_OPERATION_MAPPINGS.get(
            calculation_property, WindowOperation.SUM
        )
        size = (
            int(calculation_sub_property)
            if calculation_sub_property
            else DEFAULT_WINDOW_SIZE
        )
        calc = calculation_cls(filter=query_filter, operation=operation, size=size)
    else:
        calc = calculation_cls(filter=query_filter)

    return related.to_dict(calc)


# pylint: disable=R0913
def add_or_update_field(
    field_id,
    name,
    short_name,
    description,
    calculation,
    category_id,
    pipeline_datasource_id,
    calculation_property,
    calculation_sub_property,
    transaction,
):
    existing_field = transaction.find_by_id(Field, field_id)

    calculation_obj = (
        build_calculation(
            calculation, calculation_property, calculation_sub_property, field_id
        )
        if calculation
        else None
    )
    if existing_field:
        new_field = existing_field
        new_field.name = name or existing_field.name
        new_field.description = description or existing_field.description
        new_field.short_name = short_name or existing_field.short_name
        new_field.calculation = calculation_obj or existing_field.calculation
    else:
        new_field = Field(
            id=field_id,
            name=name,
            short_name=short_name,
            description=description,
            calculation=calculation_obj,
        )
    transaction.add_or_update(new_field)
    if category_id:
        # Currently we assume fields only map to 1 category.
        field_category = transaction.find_one_by_fields(
            FieldCategoryMapping, True, {'field_id': field_id}
        )
        if not field_category:
            transaction.add_or_update(
                FieldCategoryMapping(field_id=field_id, category_id=category_id)
            )
        else:
            field_category.category_id = category_id
            transaction.add_or_update(field_category)

    if pipeline_datasource_id:
        # Currently we assume fields only map to 1 data source.
        field_data_source = transaction.find_one_by_fields(
            FieldPipelineDatasourceMapping, True, {'field_id': field_id}
        )
        if not field_data_source:
            transaction.add_or_update(
                FieldPipelineDatasourceMapping(
                    field_id=field_id, pipeline_datasource_id=pipeline_datasource_id
                )
            )
        else:
            field_data_source.pipeline_datasource_id = pipeline_datasource_id
            transaction.add_or_update(field_data_source)


def populate_fields(file_path, transaction):
    num_rows_read = 0
    num_rows_modified = 0
    num_rows_empty_cells = 0
    num_rows_invalid_category_id = 0
    num_rows_invalid_datasource_id = 0
    error_msgs = []

    with open(file_path, 'r') as input_file:
        reader = csv.DictReader(input_file)
        for row in reader:
            num_rows_read += 1

            field_id = row.get('id')
            name = row.get('name')
            short_name = row.get('short_name')
            description = row.get('description')
            calculation = row.get('calculation')
            calculation_property = row.get('calculation_property')
            calculation_sub_property = row.get('calculation_sub_property')
            category_id = row.get('category_id')
            pipeline_datasource_id = row.get('pipeline_datasource_id')

            name = name.strip() if name else name
            short_name = short_name.strip() if short_name else short_name
            description = description.strip() if description else description

            (
                has_empty_cells,
                skip_row,
                has_invalid_category_id,
                has_invalid_datasource_id,
                error_msgs,
            ) = validate_row(
                field_id,
                name,
                short_name,
                description,
                calculation,
                category_id,
                pipeline_datasource_id,
                error_msgs,
                transaction,
            )

            if has_empty_cells:
                num_rows_empty_cells += 1
            if has_invalid_category_id:
                num_rows_invalid_category_id += 1
            if has_invalid_datasource_id:
                num_rows_invalid_datasource_id += 1
            if skip_row:
                LOG.info('Skipping field "%s"', name)
                continue

            add_or_update_field(
                field_id,
                name,
                short_name,
                description,
                calculation,
                category_id,
                pipeline_datasource_id,
                calculation_property,
                calculation_sub_property,
                transaction,
            )

            num_rows_modified += 1

    output_stats = (
        'Number of rows read: %d \n'
        'Number of rows modified: %d \n'
        'Number of rows with empty cells: %d \n'
        'Number of rows with invalid category ids: %d \n'
        'Number of rows with invalid datasource ids: %d \n'
        % (
            num_rows_read,
            num_rows_modified,
            num_rows_empty_cells,
            num_rows_invalid_category_id,
            num_rows_invalid_datasource_id,
        )
    )

    LOG.info(output_stats)
    return output_stats, error_msgs


def write_data_to_csv(temp_dir, zip_file, filename, headers, data):
    '''
    Writes csv data to a zip file
    '''
    output_file = os.path.join(temp_dir, filename)
    with open(output_file, 'w') as f:
        dict_writer = csv.DictWriter(f, fieldnames=headers)
        dict_writer.writeheader()
        dict_writer.writerows(data)
    zip_file.write(
        output_file, filename, compress_type=zipfile.ZIP_DEFLATED, compresslevel=3
    )


def zip_data_catalog_metadata(transaction, temp_dir_name, zip_file):
    # NOTE(solo): The design of the Transaction class makes it very difficult to write performant
    # sqlalchemy queries. We use the session to perform this query well
    session = transaction.run_raw()

    parent = sqlalchemy.orm.aliased(Category)
    raw_categories = (
        session.query(Category.id, Category.name)
        .outerjoin(parent, Category.parent_id == parent.id)
        .add_columns(parent.id.label('parent_id'), parent.name.label('parent_name'))
        .all()
    )
    categories = [
        {
            'id': c.id,
            'name': c.name,
            'parentId': c.parent_id or '',
            'parentName': c.parent_name or '',
        }
        for c in raw_categories
    ]

    write_data_to_csv(
        temp_dir_name,
        zip_file,
        'categories.csv',
        ['id', 'name', 'parentId', 'parentName'],
        categories,
    )
    sources = [
        {'id': s.id, 'name': s.name}
        for s in session.query(PipelineDatasource.id, PipelineDatasource.name)
    ]
    write_data_to_csv(
        temp_dir_name, zip_file, 'pipelinesources.csv', ['id', 'name'], sources
    )

    dimensions = [
        {'id': d.id, 'name': d.name}
        for d in session.query(Dimension.id, Dimension.name)
    ]
    write_data_to_csv(
        temp_dir_name, zip_file, 'dimensions.csv', ['id', 'name'], dimensions
    )
