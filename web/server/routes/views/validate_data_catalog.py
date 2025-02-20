# mypy: disallow_untyped_defs=True
import csv
import os
import re
import tempfile
import zipfile
from collections import defaultdict
from datetime import datetime
from typing import TYPE_CHECKING, Dict, List, Optional, Set, Tuple, TypedDict, Union

from flask import render_template
from psycopg2.extensions import quote_ident

from log import LOG
from models.alchemy.configuration import Configuration
from models.alchemy.data_upload import (
    DataprepFlow,
    DataprepJob,
    DataUploadFileSummary,
    SelfServeSource,
)
from models.alchemy.query import (
    Category,
    Dimension,
    DimensionCategory,
    DimensionCategoryMapping,
    Field,
    FieldCategoryMapping,
    FieldDimensionMapping,
    FieldPipelineDatasourceMapping,
    PipelineDatasource,
)
from util.file.compression.lz4 import LZ4Reader
from util.connections.connection_manager import ConnectionManager, FileExpiration
from web.server.api.configuration_api_models import (
    get_configuration,
    update_configuration_value,
)
from web.server.configuration.settings import DATA_CATALOG_LAST_IMPORT_DATE_KEY
from web.server.data.data_access import Transaction

if TYPE_CHECKING:
    from typing import TypedDict
else:
    TypedDict = dict


DATA_CATALOG_TABLES = [
    Field.__tablename__,
    Dimension.__tablename__,
    PipelineDatasource.__tablename__,
    Category.__tablename__,
    DimensionCategory.__tablename__,
    FieldDimensionMapping.__tablename__,
    FieldPipelineDatasourceMapping.__tablename__,
    FieldCategoryMapping.__tablename__,
    DimensionCategoryMapping.__tablename__,
    DataUploadFileSummary.__tablename__,
    DataprepFlow.__tablename__,
    DataprepJob.__tablename__,
    SelfServeSource.__tablename__,
]

ID_COLUMNS = {
    FieldCategoryMapping.__tablename__: 'field_id',
    FieldDimensionMapping.__tablename__: 'field_id',
    FieldPipelineDatasourceMapping.__tablename__: 'field_id',
    DimensionCategoryMapping.__tablename__: 'dimension_id',
}

TABLE_DISPLAY_FIELDS = {
    Field.__tablename__: ['id', 'name'],
    Dimension.__tablename__: ['id', 'name'],
    PipelineDatasource.__tablename__: ['id', 'name'],
    Category.__tablename__: ['id', 'name'],
    DimensionCategory.__tablename__: ['id', 'name'],
    FieldDimensionMapping.__tablename__: ['field_id', 'dimension_id'],
    FieldPipelineDatasourceMapping.__tablename__: [
        'field_id',
        'pipeline_datasource_id',
    ],
    FieldCategoryMapping.__tablename__: ['field_id', 'category_id'],
    DimensionCategoryMapping.__tablename__: ['dimension_id', 'category_id'],
    DataUploadFileSummary.__tablename__: ['source_id', 'file_path'],
    DataprepFlow.__tablename__: ['expeced_columns', 'recipe_id'],
    DataprepJob.__tablename__: ['job_id', 'status'],
    SelfServeSource.__tablename__: ['source_id'],
}

DATA_CATALOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S.%f'

DATA_CATALOG_CONFLICTS_DIR = 'data_catalog_conflicts'


class DataCatalogResponse(TypedDict):
    statusCode: int
    validationSummary: Optional[Dict[str, str]]
    dataCatalogChangesFileKey: Optional[str]
    validationMessage: str


class ConflictRecordDict(TypedDict):
    column: str
    current_value: Optional[str]
    incoming_value: Optional[str]
    is_conflict: bool


DATABASE_VERSION_ERROR = 'DATABASE_VERSION_ERROR'
DATA_CONFLICT = 'DATA_CONFLICT'
UNKNOWN_EXCEPTION = 'UNKNOWN_EXCEPTION'
VALIDATION_SUCCESSFUL = 'VALIDATION_SUCCESSFUL'
RE_ALPHANUM_VALIDATE = re.compile('[^0-9a-zA-Z_]+', re.DOTALL)
TIMESTAMP_FORMAT = '%Y-%m-%d %H:%M:%S.%f'
EXCLUDED_COLUMNS = {'last_modified', 'created'}


def get_text_style(element: str, is_error: bool = False) -> str:
    text_class = 'text-danger' if is_error else 'text-success'
    return f'<span class="{text_class}">{element}</span>'


def build_id_map_for_table(
    id_column: str, table_data: List[Dict[str, str]]
) -> Dict[str, Dict[str, str]]:
    '''Converts a table into a dict with the form: {row_id: row}'''
    return {record[id_column]: record for record in table_data}


def get_records_from_db(
    transaction: Transaction, table_name: str, delimiter: str = ';'
) -> List[Dict[str, str]]:
    '''Pulls table records from the database using a copy command and an in-memory file'''
    session = transaction.run_raw()
    connection = session.connection().connection
    cursor = connection.cursor()
    table_ident = quote_ident(table_name, cursor)
    sql_command = cursor.mogrify(
        f'COPY {table_ident} TO STDOUT WITH CSV DELIMITER %s HEADER',
        (delimiter,),
    )
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        cursor.copy_expert(sql_command, temp_file)
        temp_file.close()
        with open(temp_file.name, 'r') as file:
            csv_reader = csv.DictReader(file, delimiter=delimiter)
            return list(csv_reader)


def get_records_from_file(
    table_name: str,
    zip_file: zipfile.ZipFile,
    file_path: str,
    delimiter: str = ';',
) -> List[Dict[str, str]]:
    '''Pulls table records from a zipfile'''
    try:
        file_name = zip_file.extract(f'{table_name}.csv.lz4', path=file_path)
        with LZ4Reader(file_name) as reader:
            csv_reader = csv.DictReader(reader, delimiter=delimiter)
            return list(csv_reader)
    except KeyError:
        return []


def get_unique_records(
    source_dict: Dict[str, Dict[str, str]], other_dict: Dict[str, Dict[str, str]]
) -> List[Dict[str, str]]:
    '''Returns records that are UNIQUE to / only present in source_dtci'''
    unique_record_ids = set(source_dict) - set(other_dict)
    return [source_dict[record_id] for record_id in unique_record_ids]


def get_recently_changed_deleted_records(
    data_catalog_last_import_date: Optional[datetime],
    deleted_records: List[Dict[str, str]],
) -> List[Dict[str, str]]:
    '''
    Returns all deleted records that have a more recent edit date than the last data
    catalog import date
    '''
    if not data_catalog_last_import_date:
        return []

    return [
        record
        for record in deleted_records
        if parse_timestamp(record['last_modified']) > data_catalog_last_import_date
    ]


def get_modified_records(
    id_column: str,
    incoming_common_records: List[Dict[str, str]],
    current_common_records: List[Dict[str, str]],
    data_catalog_last_import_date: Optional[datetime],
    return_conflicts_only: bool = False,
) -> Tuple[Dict[str, List[ConflictRecordDict]], bool]:
    '''
    Returns records that have been modified in source_dict since the last data catalog
    import date
    '''
    has_conflicts = False
    modified_records: Dict[str, List[ConflictRecordDict]] = defaultdict(list)
    for current_record, incoming_record in zip(
        current_common_records, incoming_common_records
    ):
        excluded_columns = EXCLUDED_COLUMNS
        if id_column != 'id':
            excluded_columns = EXCLUDED_COLUMNS.union({'id'})
        current_record_set = frozenset(
            {key: current_record[key].strip() for key in current_record}.items()
        )
        incoming_record_set = frozenset(
            {key: incoming_record[key].strip() for key in incoming_record}.items()
        )
        different_keys = [
            key
            for key, value in current_record_set
            if key not in excluded_columns and (key, value) not in incoming_record_set
        ]
        if different_keys:
            current_updated = current_record.get('last_modified', '')
            incoming_updated = incoming_record.get('last_modified', '')
            for key in different_keys:
                is_conflict = do_records_conflict(
                    incoming_updated=incoming_updated,
                    current_updated=current_updated,
                    data_catalog_last_import_date=data_catalog_last_import_date,
                )
                has_conflicts = has_conflicts or is_conflict
                write_record = not return_conflicts_only or is_conflict
                if write_record:
                    record_id = current_record[id_column]
                    current_value = current_record.get(key, '')
                    incoming_value = incoming_record.get(key, '')
                    show_id_col = id_column != 'id'
                    if show_id_col:
                        modified_records[record_id].append(
                            {
                                'column': id_column,
                                'current_value': get_text_style(record_id),
                                'incoming_value': get_text_style(record_id),
                                'is_conflict': False,
                            }
                        )

                    modified_records[record_id].append(
                        {
                            'column': key,
                            'current_value': get_text_style(current_value, is_conflict),
                            'incoming_value': get_text_style(
                                incoming_value, is_conflict
                            ),
                            'is_conflict': is_conflict,
                        }
                    )
    return modified_records, has_conflicts


def get_filtered_and_sorted_records(
    id_column: str, filter_ids: Set[str], source_records: List[Dict[str, str]]
) -> List[Dict[str, str]]:
    '''Returns records that are present in both source_dict and other_dict'''
    filtered_records = [
        record for record in source_records if record[id_column] in filter_ids
    ]
    filtered_records.sort(key=lambda x: x[id_column])
    return filtered_records


def parse_timestamp(timestamp: str) -> datetime:
    '''Convert timestamp string to datetime'''
    return datetime.strptime(str(timestamp), TIMESTAMP_FORMAT)


def do_records_conflict(
    incoming_updated: str,
    current_updated: str,
    data_catalog_last_import_date: Optional[datetime],
) -> bool:
    if '' in (incoming_updated, current_updated):
        return True

    if not data_catalog_last_import_date:
        return parse_timestamp(current_updated) > parse_timestamp(incoming_updated)

    return (
        parse_timestamp(current_updated) > parse_timestamp(incoming_updated)
        or parse_timestamp(current_updated) > data_catalog_last_import_date
    )


def compare_table_data(
    incoming_table_data: List[Dict[str, str]],
    current_table_data: List[Dict[str, str]],
    data_catalog_last_import_date: Optional[datetime],
    id_column: str = 'id',
    return_conflicts_only: bool = False,
) -> Tuple[Dict[str, List[Dict[str, str]]], bool]:
    '''
    Args:
        incoming_table_data: List of records from the incoming data catalog file
        current_table_data: List of records from the current data catalog table in postgres
        data_catalog_last_import_date: Last date that the data catalog was imported
        table_columns: List of columns for the table
        return_conflicts_only: If True, only return records that are in conflict state

    This function can return 2 possible outcomes:
        - Success / No conflict:
        This state indicates that there are no changes in the current database table that will
        be overwritten by the incoming data catalog file

        - Warning / Potential Conflict
        This state indicates that we might be overwriting some changes made to the current table
        that might still be useful to the users that created them. For this state, we want to
        flag to the user exactly what these changes are for every table record in the following
        format:
            - Table name
            - Current change
            - Incoming change
    '''
    # build dicts for quick record lookups
    incoming_table_dict = build_id_map_for_table(id_column, incoming_table_data)
    current_table_dict = build_id_map_for_table(id_column, current_table_data)
    new_records = get_unique_records(incoming_table_dict, current_table_dict)
    deleted_records = get_unique_records(current_table_dict, incoming_table_dict)
    deleted_but_recently_edited_records = get_recently_changed_deleted_records(
        data_catalog_last_import_date=data_catalog_last_import_date,
        deleted_records=deleted_records,
    )

    # update deleted_records to exclude records that were recently edited
    recently_edited_record_ids = {
        record[id_column] for record in deleted_but_recently_edited_records
    }
    deleted_records = [
        record
        for record in deleted_records
        if record[id_column] not in recently_edited_record_ids
    ]

    # get modified records
    common_record_ids = set(current_table_dict) & set(incoming_table_dict)
    current_common_records = get_filtered_and_sorted_records(
        id_column, common_record_ids, current_table_data
    )
    incoming_common_records = get_filtered_and_sorted_records(
        id_column, common_record_ids, incoming_table_data
    )
    modified_records, has_conflicts = get_modified_records(
        id_column=id_column,
        current_common_records=current_common_records,
        incoming_common_records=incoming_common_records,
        data_catalog_last_import_date=data_catalog_last_import_date,
        return_conflicts_only=return_conflicts_only,
    )

    response = {}
    if new_records:
        response['new_records'] = new_records
    if deleted_records:
        response['deleted_records'] = deleted_records
    if deleted_but_recently_edited_records:
        has_conflicts = True
        response[
            'deleted_but_recently_edited_records'
        ] = deleted_but_recently_edited_records
    if modified_records:
        response['modified_records'] = [modified_records]  # type: ignore[list-item]

    return response, has_conflicts


def contains_valid_zipped_files(tables: List[str], input_file: str) -> bool:
    with zipfile.ZipFile(input_file) as zip_file:
        zip_contents = set(zip_file.namelist())
        expected_files = set([f'{table_name}.csv.lz4' for table_name in tables])
        intersection = zip_contents & expected_files
        return len(list(intersection)) > 0


def validate_data_catalog_table_data(
    tables: List[str],
    input_file: str,
    delimiter: str = ';',
) -> Tuple[Dict[str, str], bool]:
    '''Checks an input file for data conflicts

    Args:
        - input_file: the file we are attemtping to validate
        - tables: the data catalog tables for current deployment
        - delimiter: the delimeter

    Returns:
        - A tuple with defaultdict in the form:

            {
                table_name: {
                    'new_records': [list here],
                    'deleted_records': [list here],
                    'deleted_but_recently_edited_records': [list here],
                    'modified_records': [list here]
                }
            }
        - A boolean indicating whether or not there are conflicts
    '''

    found_conflicts = False
    comparison_results: defaultdict = defaultdict(list)
    last_import_date = get_configuration(DATA_CATALOG_LAST_IMPORT_DATE_KEY)
    data_catalog_last_import_date = (
        parse_timestamp(last_import_date) if last_import_date else None
    )

    with zipfile.ZipFile(
        input_file
    ) as zip_file, Transaction() as transaction, tempfile.TemporaryDirectory() as temp_dir_name:
        for table_name in tables:
            current_table_records = get_records_from_db(
                transaction=transaction, table_name=table_name
            )
            incoming_table_records = get_records_from_file(
                table_name=table_name,
                zip_file=zip_file,
                file_path=temp_dir_name,
            )
            if not current_table_records and not incoming_table_records:
                continue

            id_column = ID_COLUMNS.get(table_name, 'id')
            comparison, has_conflict = compare_table_data(
                id_column=id_column,
                incoming_table_data=incoming_table_records,
                current_table_data=current_table_records,
                data_catalog_last_import_date=data_catalog_last_import_date,
                return_conflicts_only=True,  # allows us to return conflicts only
            )
            if len(comparison) > 0:
                comparison_results[table_name] = comparison
                found_conflicts = found_conflicts or has_conflict

    return comparison_results, found_conflicts


def validate_import_file(
    input_file: str, file_name: str
) -> Tuple[DataCatalogResponse, int]:
    '''Performs a check against a file we're attempting to import into self serve:
    - database record conflicts between data in file and the db
    Args:
        input_file: Path to the zipped file
        delimiter (str): CSV data delimeter
    '''
    status_code = 200
    (validation_summary, contains_conflicts,) = validate_data_catalog_table_data(
        tables=DATA_CATALOG_TABLES,
        input_file=input_file,
    )
    formatted_validation_summary = extract_table_changes(validation_summary)
    response: DataCatalogResponse = {
        'validationMessage': '',
        'dataCatalogChangesFileKey': '',
        'validationSummary': formatted_validation_summary,
        'statusCode': status_code,
    }

    if contains_conflicts:
        status_code = 409
        response['statusCode'] = status_code

        # build conflicts file summary if there are conflicts
        changes_summary_file_key = build_and_upload_table_changes(
            file_name=file_name, validation_summary=validation_summary
        )
        response['dataCatalogChangesFileKey'] = changes_summary_file_key

    if status_code == 200:
        response[
            'validationMessage'
        ] = '''The uploaded file passed validation.
        No conflicts were found with the existing instance metadata.
        '''
        if response['validationSummary']:
            response['validationMessage'] += ' See below for a summary of changes:'

    elif status_code == 409:
        response[
            'validationMessage'
        ] = '''The uploaded file failed validation.
        Conflicts were found with the existing instance metadata.
        '''

    return response, status_code


def extract_table_changes(validation_summary: dict) -> Dict[str, str]:
    '''
    Count the number of new, deleted, and modified records for each table and return a summary
    of the results in the form:
    {
        table_name: 'x new records, y deleted records, z modified records'
    }
    '''
    keys_to_count = ['new_records', 'deleted_records', 'modified_records']
    table_changes = {
        f'{table_name} table': construct_table_changes(
            keys_to_count, validation_summary[table_name]
        )
        for table_name in validation_summary
    }
    return table_changes


def construct_table_changes(keys: List[str], table_results: dict) -> str:
    '''Constructs a list of changes for a given table'''
    table_changes = [
        f'{len(table_results[key][0].keys())} {key.replace("_", " ")}'
        if key == 'modified_records'
        else f'{len(table_results[key])} {key.replace("_", " ")}'
        for key in keys
        if key in table_results
    ]
    return ', '.join(table_changes)


def update_data_catalog_import_date() -> None:
    '''Updates the data catalog import date to the current date'''
    with Transaction() as transaction:
        updated_value = datetime.utcnow().strftime(DATA_CATALOG_DATE_FORMAT)
        key = DATA_CATALOG_LAST_IMPORT_DATE_KEY
        configuration = transaction.find_one_by_fields(
            Configuration, True, {'key': key}
        )
        if not configuration:
            LOG.debug(f'Creating new configuration for {key}')
            configuration = Configuration(
                key=key, overwritten_value=None, overwritten=False
            )
            transaction.add_or_update(configuration, flush=True)

        LOG.debug(f'Updating {key} to {updated_value}')

        update_configuration_value(
            transaction=transaction,
            configuration=configuration,
            updated_value=updated_value,
        )


def build_and_upload_table_changes(
    file_name: str, validation_summary: dict
) -> Optional[str]:
    '''
    This builds and uploads a conflicts summary file to s3 and returns the s3 filepath.

    Args
    ----
        file_name (str): Original name of the data catalog import file
        validation_results: Results from the data catalog import validation
    returns
    -------
        s3_key (str): url of file stored in the data catalog conflicts directory in s3
    '''
    s3_key = ''
    data_catalog_changes = [
        {
            'table_name': table_name,
            'new_records': extract_new_records(table_name, validation_summary),
            'deleted_records': extract_deleted_records(table_name, validation_summary),
            'modified_records': extract_modified_records(
                table_name, validation_summary
            ),
        }
        for table_name in validation_summary
    ]

    if not data_catalog_changes:
        return None

    table_names = validation_summary.keys()

    with tempfile.NamedTemporaryFile(
        prefix=file_name, suffix='.html', delete=False, mode='w'
    ) as data_catalog_file:
        output = render_template(
            'data_catalog_changes.html',
            data_catalog_changes=data_catalog_changes,
            table_names=table_names,
            data_catalog_import_file=file_name,
        )
        data_catalog_file.write(output)
        data_catalog_file.close()
        s3_key = upload_change_summary_file(filepath=data_catalog_file.name)

    return s3_key


def extract_new_records(
    table_name: str, validation_summary: dict
) -> Dict[str, List[str]]:
    '''Extracts new records from the validation summary'''
    if 'new_records' not in validation_summary[table_name]:
        return {}

    new_records = validation_summary[table_name]['new_records']
    headers = TABLE_DISPLAY_FIELDS[table_name]
    rows = defaultdict(list)
    for record in new_records:
        for key in headers:
            rows[key].append(record[key])

    return {'headers': headers, 'rows': list(zip(*rows.values()))}


def extract_deleted_records(
    table_name: str, validation_summary: dict
) -> Dict[str, List[str]]:
    '''Extracts deleted records from the validation summary'''
    if 'deleted_records' not in validation_summary[table_name]:
        return {}

    deleted_records = validation_summary[table_name]['deleted_records']
    headers = TABLE_DISPLAY_FIELDS[table_name]
    rows = defaultdict(list)
    for record in deleted_records:
        for key in headers:
            rows[key].append(record[key])

    return {'headers': headers, 'rows': list(zip(*rows.values()))}


def extract_modified_records(table_name: str, validation_summary: dict) -> List[dict]:
    '''Extracts modified records from the validation summary'''
    if 'modified_records' not in validation_summary[table_name]:
        return []

    modified_records = validation_summary[table_name]['modified_records'][0]
    return [
        {
            'headers': ['#'] + [row_change['column'] for row_change in row_changes],
            'rows': [
                ['Current Value']
                + [row_change['current_value'] for row_change in row_changes],
                ['Incoming Value']
                + [row_change['incoming_value'] for row_change in row_changes],
            ],
        }
        for _, row_changes in modified_records.items()
    ]


def upload_change_summary_file(filepath: str) -> str:
    '''Uploads the temporary file to s3 and returns the s3 key'''
    connection = ConnectionManager('s3')
    s3_key = f'{DATA_CATALOG_CONFLICTS_DIR}/{os.path.basename(filepath)}'
    connection.upload_file(filepath, s3_key, expiration=FileExpiration.ONE_DAY)

    return s3_key


def is_file_key_valid(s3_key: str) -> bool:
    '''Validates that the s3 key is a valid conflicts file key'''
    return s3_key.startswith(f'{DATA_CATALOG_CONFLICTS_DIR}/')
