import csv
import gzip
import mimetypes
import os
import re
from collections import Counter
from datetime import datetime
from http.client import BAD_REQUEST, CONFLICT, NOT_FOUND
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Set, Tuple, TypedDict, Union

import pandas as pd
import related
from flask import current_app, Response
from flask.wrappers import Request
from flask_user import current_user
from slugify import slugify
from werkzeug.exceptions import abort

from config.general import DEPLOYMENT_NAME
from config.system import STANDARD_DATA_DATE_FORMAT
from data.pipeline.self_serve.types import ColumnNameMapping, SourceConfigType
from db.postgres.utils import make_temp_directory
from log import LOG
from models.alchemy.data_upload.model import (
    DataUploadFileSummary,
    DataprepFlow,
    DataprepJob,
    SelfServeSource,
)
from models.alchemy.query import PipelineDatasource
from util.connections.connection_manager import ConnectionManager
from util.dataprep.api import (
    COMPLETED_STATUSES,
    FAILED_JOB,
    DataprepManager,
)
from util.dataprep.utils import (
    build_self_serve_key_prefix,
    check_files_exist,
    delete_dataprep_self_serve_files,
    get_file_headers,
    fetch_dataprep_initial_config,
    migrate_dataprep_self_serve_files,
    DataprepSetupException,
)
from web.server.api.data_upload_api_schema import SOURCE_ID_PATTERN
from web.server.configuration.flask import DATA_UPLOAD_FOLDER
from web.server.data.data_access import Transaction
from web.server.data.status import MAX_TIME_FIELD, MIN_TIME_FIELD
from web.server.environment import IS_PRODUCTION, IS_TEST
from web.server.services.self_serve.self_serve_connection import SelfServeConnection


DATA_TYPES_MAP: Dict[str, str] = {
    'b': 'bool',
    'i': 'number',
    'u': 'number',
    'f': 'number',
    # Map timedelta (m) to datetime
    'm': 'datetime',
    'M': 'datetime',
    'O': 'string',
    'S': 'string',
    # Map unicode (U) to string
    'U': 'string',
    'V': 'void',
}

# TODO: Figure out the best way to translate these errors.
COLUMN_COUNT_ERROR = 'Uploaded data does not have enough columns.'
DATE_COUNT_ERROR = 'Uploaded data has no valid date columns.'
DUPLICATE_COLS_ERROR = 'Uploaded data has duplicate columns.'
FIELD_COUNT_ERROR = 'Uploaded data has no valid indicator columns.'
FILE_EXTENSION_ERROR = 'Invalid file extension.'
FILE_NAME_ERROR = 'Invalid filename for uploaded file.'
INVALID_SOURCE_ID = 'Invalid source id'


def get_unrecognized_data_type_error(column_name: str) -> str:
    return f'Column {column_name} has an unrecognized data type.'


DATAPREP_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

# Corresponds to the frontend ColumnType
DIMENSION = 'DIMENSION'
FIELD = 'FIELD'
DATE = 'DATE'
UNKNOWN = 'UNKNOWN'

# NOTE: Currently not supporting excel files for non-Dataprep sources because
# process_csv only accepts csv input files. This means we would need to convert the
# excel files to CSVs, and up to now we have not converted any input files.
ALLOWED_EXTENSIONS = {'.csv'}
ALLOWED_COMPRESSIONS = {'.gz'}

NUMBER_PREVIEW_ROWS = 20

# NOTE: Many changes are disabled when working locally so the pipeline and Dataprep
# is not affected. For CSV files, changes can affect the active_sources and config files
# used in the pipeline. For Dataprep files, changes can overwrite, delete, or add to the
# input Dataprep files. It can also lead to a disconnect between the job status stored in
# production and the latest one in Dataprep.
ENABLE_REMOTE_CHANGES = IS_PRODUCTION and not IS_TEST


class ColumnSpecType(TypedDict):
    name: str
    columnType: Literal['DIMENSION', 'FIELD', 'DATE']
    datatype: Literal['datetime', 'number', 'string']
    match: Optional[str]
    ignoreColumn: bool


class DateRangeType(TypedDict):
    startDate: Optional[str]
    endDate: Optional[str]


class CSVFileSummary(TypedDict):
    sourceId: str
    columnMapping: List[ColumnSpecType]
    filePath: str
    filePreview: List[dict]


# NOTE: Ideally this would not be necessary, but I couldn't figure out how to
# add validation on the request body.
def validate_source_id(source_id: str) -> None:
    if not re.match(SOURCE_ID_PATTERN, source_id):
        abort(BAD_REQUEST, INVALID_SOURCE_ID)


def compress_file(filepath: str) -> str:
    compressed_file_path = f'{filepath}.gz'
    with open(filepath, 'rb') as uncompressed_file:
        with gzip.open(compressed_file_path, 'wb') as compressed_file:
            compressed_file.writelines(uncompressed_file)
    return compressed_file_path


def validate_file_extension(
    filename: str, allowed_extensions: Set[str], compression_allowed: bool
) -> Optional[str]:
    '''This function takes a filename and validates whether it has the right extension
    and returns the extension.

    Args
    ----
    filename (str): The name of the file to validate
    allowed_extensions (Set[str]): The extensions that are valid for this file. Dataprep
        sources must match the existing extension, and non-Dataprep sources must be CSVs.
    compression_allowed (bool): Whether to check for the allowed compressions. For Dataprep
        sources, we require exact extension matches while non-Dataprep sources can be
        compressed or not.

    returns
    --------
    str: the extension if it is valid else aborts the request
    '''
    compression = ''
    if compression_allowed:
        for compression in ALLOWED_COMPRESSIONS:
            if filename.endswith(compression):
                filename = filename.rstrip(compression)
                break
            compression = ''
    extension = ''.join(Path(filename).suffixes)
    if extension not in allowed_extensions:
        abort(BAD_REQUEST, FILE_EXTENSION_ERROR)
    return f'{extension}{compression}'


def handle_self_server_upload(source_id: str, request: Request) -> CSVFileSummary:
    '''This function handles a non-Dataprep self serve source. If the file passes
    validation, it will be uploaded to object storage.

    Args
    ----
        source_id: The source's slugified id.
        request: A 'flask.wrappers.Request' object.
    returns
    --------
        CSVFileSummary dictionary with information about the file
    '''
    # The source has not necessarily been created yet, so we can't check the source id exists.
    validate_source_id(source_id)

    with make_temp_directory() as temp_dir:
        data_upload_folder = temp_dir if IS_PRODUCTION else DATA_UPLOAD_FOLDER
        filepath = process_uploaded_file(
            request,
            source_id,
            ALLOWED_EXTENSIONS,
            compression_allowed=True,
            standardize_filename=True,
            use_date_in_filename=True,
            data_upload_folder=data_upload_folder,
        )
        column_mapping, file_preview = generate_summary(source_id, filepath)

        if ENABLE_REMOTE_CHANGES:
            if not filepath.endswith('.gz'):
                filepath = compress_file(filepath)
            self_serve_conn = SelfServeConnection(source_id)
            self_serve_conn.upload_data_file(filepath, True)
        else:
            LOG.info('Not a production instance, skipping uploading dataprep file.')

        return {
            'sourceId': source_id,
            'columnMapping': column_mapping,
            'filePath': os.path.basename(filepath),
            'filePreview': file_preview,
        }


def process_uploaded_file(
    request: Request,
    source_id: str,
    allowed_extensions: Set[str],
    compression_allowed: bool,
    standardize_filename: bool,
    use_date_in_filename: bool,
    data_upload_folder: str = DATA_UPLOAD_FOLDER,
) -> str:
    '''Verify file extension, rename the uploaded file with a standardized name, and move the
    file to the correct folder.'''
    # Check uploaded file has a file name
    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        abort(BAD_REQUEST, FILE_NAME_ERROR)
    filename = uploaded_file.filename
    filename_root = Path(filename).stem

    # Get and validate file extension
    extension = validate_file_extension(
        filename, allowed_extensions, compression_allowed
    )

    # Move the file to the correct location with the appropriate file name.
    upload_folder = os.path.join(data_upload_folder, "self_serve", source_id)
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    # Replace the uploaded file name with a standard name
    if standardize_filename:
        filename_root = 'self_serve_input'
    # Add a timestamp to the file name so that we don't overwrite files
    if use_date_in_filename:
        datestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename_root = f'{filename_root}_{datestamp}'
    uploaded_file_name = os.path.join(upload_folder, f'{filename_root}{extension}')
    uploaded_file.save(uploaded_file_name)
    return uploaded_file_name


def check_column_mapping(column_mapping: List[ColumnSpecType]):
    '''Checks that the column mapping defines a valid CSV file.'''
    count_fields = 0
    count_dates = 0
    if len(column_mapping) < 3:
        abort(BAD_REQUEST, COLUMN_COUNT_ERROR)
    for column in column_mapping:
        # If we can't assign a column a type, throw an error
        if column['columnType'] == UNKNOWN:
            abort(BAD_REQUEST, get_unrecognized_data_type_error(column['name']))

        if column['columnType'] == FIELD:
            count_fields += 1
        if column['columnType'] == DATE:
            count_dates += 1
    if count_fields < 1:
        abort(BAD_REQUEST, FIELD_COUNT_ERROR)
    if count_dates < 1:
        abort(BAD_REQUEST, DATE_COUNT_ERROR)


def create_column_mappings(df: pd.DataFrame, source_id: str) -> List[ColumnSpecType]:
    '''This function creates a column_mapping from the column names of the provided
    dataframe. It also matches column names the dimensions for the deployment. If a
    previous column mapping for the same source exists in the db, then any columns
    with the same name and type will have their column spec reused.

    Args
    ----
        df (DataFrame): The dataframe from which to create the summary

    Returns
    -------
        list: List of fields
    '''
    existing_column_mapping = get_column_mapping_by_source_id(source_id)
    column_mapping = []
    # Remove special characters and lowercase all
    dimension_search_lookup = {
        slugify(dimension, separator=''): dimension
        for dimension in current_app.zen_config.aggregation.DIMENSIONS
    }

    for column in df.columns:
        field_datatype = DATA_TYPES_MAP.get(df[column].dtype.kind)
        match = None
        field_type = UNKNOWN

        # Check if the same column existed in the previous mapping. If so, use it
        if (
            column in existing_column_mapping
            and existing_column_mapping[column]['datatype'] == field_datatype
        ):
            column_mapping.append(existing_column_mapping[column])
            continue

        # Assume that dates are date
        if field_datatype == 'datetime':
            field_type = DATE
        else:
            # Look for a dimension match
            slugified_name = slugify(column, separator='')
            if slugified_name in dimension_search_lookup:
                field_type = DIMENSION
                match = dimension_search_lookup[slugified_name]
            # Assume that numbers are indicators if column name is not in dimensions
            elif field_datatype == "number":
                field_type = FIELD
            # Assume that all other strings are dimensions
            elif field_datatype == 'string':
                field_type = DIMENSION

        # NOTE: mypy does not like unions of literal types here
        column_mapping.append(
            {
                'name': column,
                'columnType': field_type,  # type: ignore[typeddict-item]
                'datatype': field_datatype,  # type: ignore[typeddict-item]
                'match': match,
                'ignoreColumn': False,
            }
        )
    check_column_mapping(column_mapping)
    return column_mapping


def convert_date_columns(df: pd.DataFrame) -> pd.DataFrame:
    '''This functions takes a dataframe and finds all datatime columns and converts
    them to datetime python type. It also validates to make sure that all dates are in
    format `%Y-%m-%d`

    Args
    ----
        df (DataFrame): DataFrame to convert

    Returns
    --------
        DataFrame: Converted DataFrame
    '''
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                df[col] = pd.to_datetime(df[col], format=STANDARD_DATA_DATE_FORMAT)
            except ValueError:
                pass
    return df


def get_csv_dataframe(file_path: str) -> pd.DataFrame:
    '''This function takes a path to the csv and returns the dataframe.'''
    # Pandas will default convert some values to nan. Change the default to align to the pipeline.
    df = pd.read_csv(file_path, header=None, keep_default_na=False, na_values=[''])
    df = df.rename(columns=df.iloc[0], copy=False).iloc[1:].reset_index(drop=True)
    if len(df.columns) != len(set(df.columns)):
        abort(BAD_REQUEST, DUPLICATE_COLS_ERROR)
    # Reset the types after initially reading the headers as the first row
    df = df.apply(lambda column: pd.to_numeric(column, errors='ignore'))
    return df


def generate_summary(
    source_id: str, file_path: str
) -> Tuple[List[ColumnSpecType], Any]:
    '''This function takes a path to the csv and generates a complete summary

    Args
    ----
        source_id (str): The file source_id
        path_to_csv (str): Filesystem path to csv

    Returns
    --------
        Tuple of (column_mapping, file_preview):
        - column_mapping: the list of column specs
        - file_preview: a sample of the first few rows, converted into a list of dictionaries
          NOTE: mypy doesn't play well with pandas, so this is an Any return type

    '''
    df = get_csv_dataframe(file_path)
    # get the file preview before converting the date columns so that we don't have
    # to convert the dates back to strings to display on the frontend
    file_preview = df[:NUMBER_PREVIEW_ROWS].fillna('').to_dict(orient='records')
    df = convert_date_columns(df)
    column_mapping = create_column_mappings(df, source_id)
    return column_mapping, file_preview


def get_summary_by_id(summary_id: int) -> DataUploadFileSummary:
    '''This function fetches a summary object from database given the summary_id

    Args
    ----
        id (int): Primary Key for summary to be fetched

    Returns
    -------
        DataUploadFileSummary
    '''
    with Transaction() as transaction:
        summary = transaction.find_one_by_fields(
            DataUploadFileSummary, True, {'id': summary_id}
        )
    return summary


def get_self_serve_source_by_source_id(source_id: str) -> Optional[SelfServeSource]:
    '''This function fetches a SelfServeSource object from database given the
    source_id

        Args
        ----
            source_id (str): source_id for SelfServeSource to be fetched

        Returns
        -------
            SelfServeSource
    '''
    with Transaction() as transaction:
        self_serve_source = transaction.find_one_by_fields(
            SelfServeSource, True, {'source_id': source_id}
        )
    return self_serve_source


def get_file_summaries_by_source_id(
    source_id: str,
) -> List[DataUploadFileSummary]:
    '''This function fetches a list of DataUploadFileSummary objects associated
    with the SelfServeSource with the given source_id from the database.
        Args
        ----
            source_id (str): source_id for SelfServeSource query condition

        Returns
        -------
            List of DataUploadFileSummary
    '''
    self_serve_source = get_self_serve_source_by_source_id(source_id)
    if self_serve_source is None:
        return []
    file_summary_list = []
    with Transaction() as transaction:
        for file_summary in transaction.find_all_by_fields(
            DataUploadFileSummary, {'self_serve_source_id': self_serve_source.id}
        ):
            file_summary_list.append(file_summary)
    return file_summary_list


def get_pipeline_datasource_by_id(source_id: str) -> Optional[PipelineDatasource]:
    '''This function fetches a PipelineDatasource object from database given the
    source_id.

        Args
        ----
            source_id (str): id for PipelineDatasource to be fetched

        Returns
        -------
            PipelineDatasource
    '''
    with Transaction() as transaction:
        pipeline_datasource = transaction.find_by_id(PipelineDatasource, source_id)
    return pipeline_datasource


def get_column_mapping_by_source_id(source_id: str) -> Dict[str, ColumnSpecType]:
    '''This function fetches the column mapping as a map of column name to column spec from
    the database given the source_id. It returns an empty dictionary if the source_id does
    not have an associated source yet.

        Args
        ----
            source_id (str): source_id for SelfServeSource to be fetched

        Returns
        -------
            Map between column name to column spec
    '''
    file_summaries = get_file_summaries_by_source_id(source_id)
    if len(file_summaries) > 0:
        # $SingleInputSourceHack: A specific file summary whose column mapping is
        # being fetched should be passed into this function.
        file_summary = file_summaries[0]
        # NOTE: there are no types enforced on the column_mapping stored in the db
        column_mapping_map: Dict[str, ColumnSpecType] = {
            column_spec['name']: column_spec  # type: ignore
            for column_spec in file_summary.column_mapping
        }
        return column_mapping_map
    return {}


def get_all_source_ids() -> List[str]:
    with Transaction() as transaction:
        sources = transaction.run_raw().query(PipelineDatasource.id).all()
        return [source[0] for source in sources]


def get_date_col_name(column_mapping: List[ColumnSpecType]) -> Optional[str]:
    for column_spec in column_mapping:
        if column_spec['columnType'] == DATE and not column_spec['ignoreColumn']:
            return column_spec['name']
    return None


def get_col_type_mapping(
    column_type: Literal['FIELD', 'DIMENSION'],
    column_mapping: List[ColumnSpecType],
) -> List[ColumnNameMapping]:
    '''Gets the column mappings for the specified column_type and converts them to the format used
    by the pipeline.
    '''
    specs = []
    for column_spec in column_mapping:
        if column_spec['columnType'] != column_type or column_spec['ignoreColumn']:
            continue
        name = column_spec['name']
        match = column_spec['match']
        # NOTE: `match` should not be empty for a dimension or field because the frontend
        # should not allow this to be submitted.
        if not match:
            if column_type == DIMENSION:
                LOG.error('No match specified for dimension %s', name)
                continue
            if column_type == FIELD:
                LOG.error('No match specified for field %s', name)
                continue

        specs.append(
            # mypy-related-issue
            ColumnNameMapping(  # type: ignore[call-arg]
                input_name=name, output_name=match
            )
        )
    return specs


def get_source_config(source_id: str) -> SourceConfigType:
    '''Gets source_id's column mapping from postgres and creates a json config that can be used
    by the pipeline.
    '''
    data_upload_file_summaries = get_file_summaries_by_source_id(source_id)

    if len(data_upload_file_summaries) == 0:
        LOG.error('No data upload file summaries associated with source')
        abort(NOT_FOUND)

    # $SingleInputSourceHack: The source config will need to be updated to store
    # multiple input files.
    file_summary = data_upload_file_summaries[0]

    # NOTE: there are no types enforced on the column_mapping stored in the db
    column_mapping: List[ColumnSpecType] = file_summary.column_mapping  # type: ignore

    # mypy-related-issue
    return SourceConfigType(  # type: ignore[call-arg]
        date_column=get_date_col_name(column_mapping),
        data_filename=file_summary.file_path,
        dimensions=get_col_type_mapping('DIMENSION', column_mapping),
        fields=get_col_type_mapping('FIELD', column_mapping),
        source=source_id,
    )


def update_csv_source_remote_files(source_id: str) -> None:
    '''Updates the remote bucket files for the given CSV source, including the source's
    config file and the active_sources for the deployment. It will also set the new input
    files to not expire. Assumes that all information (such as column mappings) has already
    been updated in the correct db objects.
    '''
    self_serve_source = get_self_serve_source_by_source_id(source_id)
    if self_serve_source is None:
        abort(NOT_FOUND, INVALID_SOURCE_ID)

    if not ENABLE_REMOTE_CHANGES:
        LOG.info('Not a production instance, skipping writing to remote buckets.')
        return

    # Get the latest file paths to update in object storage.
    files_to_update = []
    max_date = None
    for file_summary in get_file_summaries_by_source_id(source_id):
        if max_date is None or max_date < file_summary.created:
            max_date = file_summary.created
            files_to_update = [file_summary.file_path]
        elif max_date == file_summary.created:
            files_to_update.append(file_summary.file_path)

    self_serve_conn = SelfServeConnection(source_id)
    for file_path in files_to_update:
        self_serve_conn.update_to_never_expire(file_path)

    config = get_source_config(source_id)
    config_json = related.to_json(config)
    self_serve_conn.update_config(config_json)
    LOG.info('Config file added for source %s', source_id)
    self_serve_conn.add_active_source()
    LOG.info('Source %s added to active sources', source_id)


def get_file_preview(source_id: str) -> Any:
    '''Gets a preview of one of the source's csv files.
    Return type is actually List[Dict[str, str]] but mypy doesn't play well with DictReader
    '''
    # NOTE: We don't aggregate any of the rows currently, which means
    # the results that the preview rows the user sees won't match exactly with what they
    # will see in AQT. Additionally, when we want to support unpivoted CSVs, we will
    # also need to do some extra work to format this output.
    data_upload_file_summaries = get_file_summaries_by_source_id(source_id)

    if len(data_upload_file_summaries) == 0:
        LOG.error('No data upload file summaries associated with source')
        abort(NOT_FOUND)

    # $SingleInputSourceHack: Either a specific file summary should be passed into
    # this function or else the preview should encapsulate all files.
    file_summary = data_upload_file_summaries[0]
    self_serve_conn = SelfServeConnection(source_id)
    data_rows = self_serve_conn.get_data_rows(file_summary.file_path)
    return csv.DictReader(data_rows[:NUMBER_PREVIEW_ROWS])


def get_source_date_range(source_id: str) -> DateRangeType:
    '''Gets the date range for the source id from Druid. If the source doesn't
    have any data in Druid, returns None for the start and end dates.
    '''
    druid_context = current_app.druid_context
    data_status = druid_context.data_status_information.status
    start_date = data_status.get(source_id, {}).get(MIN_TIME_FIELD)
    end_date = data_status.get(source_id, {}).get(MAX_TIME_FIELD)

    return {
        'startDate': datetime.strftime(start_date, STANDARD_DATA_DATE_FORMAT)
        if start_date
        else None,
        'endDate': datetime.strftime(end_date, STANDARD_DATA_DATE_FORMAT)
        if end_date
        else None,
    }


def get_sources_date_ranges() -> Dict[str, DateRangeType]:
    return {source: get_source_date_range(source) for source in get_all_source_ids()}


def delete_source_from_object_storage(source_id: str) -> None:
    '''Removes this source from `active_source.txt` in object stoage if present and
    deletes the source's folder.
    '''
    self_serve_source = get_self_serve_source_by_source_id(source_id)
    # The source has already been deleted from the database, so we can't check the source id exists.
    if self_serve_source is not None:
        abort(BAD_REQUEST, INVALID_SOURCE_ID)

    if not ENABLE_REMOTE_CHANGES:
        LOG.info('Not a production instance, skipping updating remote buckets.')
        return

    self_serve_conn = SelfServeConnection(source_id)
    self_serve_conn.remove_active_source()
    LOG.info('Removed source %s from active sources', source_id)

    prefix = os.path.join('self_serve', source_id)
    self_serve_conn.connection_manager.delete_files(prefix)


def is_dataprep_source(source: SelfServeSource) -> bool:
    '''This function checks if a self serve source has a Dataprep flow and returns `True`.'''
    return bool(source and source.dataprep_flow_id)


def get_dataprep_time(response, field: str):
    '''Uses the response from Dataprep to get the time. Sometimes the date fields are not
    there, so by default use utc current time.
    '''
    if response.get(field):
        return datetime.strptime(response.get(field), DATAPREP_DATE_FORMAT)
    return datetime.utcnow()


def create_dataprep_job(
    flow: DataprepFlow, job_info: Optional[Dict[str, str]] = None
) -> DataprepJob:
    '''This function creates a `DataprepJob` database entry

    Args
    ----
        flow: (DataprepFlow) - The flow whose job we are trying to fetch.
        job_info: (optional Dict) - The info of the job that was created. If None,
            then the job failed and should be created with a null job id.

    returns
    -------
        `DataprepJob` object that has just been created
    '''
    if job_info is None:
        job = DataprepJob(
            status=FAILED_JOB,
            dataprep_flow_id=flow.id,
        )
    else:
        job = DataprepJob(
            job_id=int(job_info['id']),
            status=job_info.get('status'),
            dataprep_flow_id=flow.id,
            created_on_dataprep=get_dataprep_time(job_info, 'createdAt'),
            last_modified_on_dataprep=get_dataprep_time(job_info, 'updatedAt'),
        )
    with Transaction() as transaction:
        transaction.add_or_update(job)
    return job


def validate_dataprep_input(
    source_id: str, request: Request
) -> Dict[str, Union[str, List[str], bool]]:
    '''This function handles validating a Dataprep self serve source file. If the file
    passes validation, it will be uploaded to object storage to be used in later api
    calls.

    Args
    ----
        source_id: The source's slugified id.
        request: A 'flask.wrappers.Request' object.

    returns
    --------
        Dictionary storing:
            missingHeaders: List of headers that were expected but not found in the uploaded file
            extraHeaders: List of headers that were not expected but found in the uploaded file
            orderCorrect: Boolean indicating if the headers were in the correct order. If there
                are missing or extra headers, this will be false.
            filePath: Generated file name for the file
    '''
    self_serve_source = get_self_serve_source_by_source_id(source_id)
    if self_serve_source is None:
        abort(NOT_FOUND, INVALID_SOURCE_ID)

    data_upload_file_summaries = get_file_summaries_by_source_id(source_id)
    if len(data_upload_file_summaries) == 0:
        LOG.error('No data upload file summaries associated with source')
        abort(NOT_FOUND)
    # All file summaries will have the same extension, so take the first.
    extension = ''.join(Path(data_upload_file_summaries[0].user_file_name).suffixes)

    with make_temp_directory() as temp_dir:
        data_upload_folder = temp_dir if IS_PRODUCTION else DATA_UPLOAD_FOLDER
        filepath = process_uploaded_file(
            request,
            source_id,
            {extension},
            compression_allowed=False,
            standardize_filename=not self_serve_source.dataprep_flow.appendable,
            use_date_in_filename=self_serve_source.dataprep_flow.appendable,
            data_upload_folder=data_upload_folder,
        )
        filename = os.path.basename(filepath)
        # TODO: Catch UnicodeDecodeError and return a specific error.
        columns = get_file_headers(filepath)
        expected_columns = self_serve_source.dataprep_flow.expected_columns

        # Don't use sets here since there can be duplicate columns
        file_counter = Counter(columns)
        expected_counter = Counter(expected_columns)
        missing_headers = list((expected_counter - file_counter).elements())
        extra_headers = list((file_counter - expected_counter).elements())
        order_correct = columns == expected_columns

        # Only upload the file if it passes validation
        if not (missing_headers or extra_headers or not order_correct):
            if ENABLE_REMOTE_CHANGES:
                # Save the file to object storage so it's accessible for later api calls
                self_serve_conn = SelfServeConnection(source_id)
                self_serve_conn.upload_data_file(filepath, True)
                LOG.info(
                    'File %s uploaded to object storage for source %s',
                    filename,
                    source_id,
                )
            else:
                LOG.info('Not a production instance, skipping uploading dataprep file.')
        return {
            'missingHeaders': missing_headers,
            'extraHeaders': extra_headers,
            'orderCorrect': order_correct,
            'filePath': filename,
        }


def upload_and_start_dataprep_job(
    source_id: str,
    files_to_upload: List[Dict[str, str]],
    files_to_delete: List[Dict[str, str]],
) -> None:
    '''This function uploads the file(s) in filePathsToUpload to GCS, deletes the
    files in filePathsToDelete from GCS, and starts the Dataprep job.

    Args
    -----
        source_id: The id of the SelfServeSource
        files_to_upload: List of files to upload to GCS. Contains filePath (the file name for
            storage) and userFileName (the file name for the email).
        files_to_delete: File names to delete from GCS. Contains filePath (the file name for
            storage) and userFileName (the file name for the email).
    '''
    self_serve_source = get_self_serve_source_by_source_id(source_id)
    if self_serve_source is None:
        abort(NOT_FOUND, INVALID_SOURCE_ID)

    if not ENABLE_REMOTE_CHANGES:
        LOG.info(
            'Not a production instance, skipping uploading Dataprep file(s) and running '
            'the Dataprep job.'
        )
        return

    existing_dataprep_file_paths = [file['filePath'] for file in files_to_delete]
    new_file_paths = [file['filePath'] for file in files_to_upload]

    # The checks try to make the file handling an atomic change where it either all succeeds
    # or fails without changing the state by checking all files exist first.
    if not check_files_exist(source_id, existing_dataprep_file_paths, host='gcs'):
        # If changes are made in Dataprep, then it's possible for Data Upload to become
        # out of sync with the files actually in Dataprep.
        abort(CONFLICT)

    if not check_files_exist(source_id, new_file_paths):
        # If it somehow takes > 1 day between when the file was first uploaded and submitted,
        # then the file would have been deleted from intermediary object storage.
        abort(NOT_FOUND)

    delete_dataprep_self_serve_files(source_id, existing_dataprep_file_paths, True)
    migrate_dataprep_self_serve_files(source_id, new_file_paths)
    LOG.info('Files updated in Dataprep for source %s', source_id)

    flow = self_serve_source.dataprep_flow
    job_manager = DataprepManager()
    job_response = job_manager.trigger_job(flow.recipe_id)
    if not job_response.ok:
        # At this point, all files have uploaded successfully and only the Dataprep job
        # has failed. Therefore, always save a failed Dataprep job to the database so
        # the user is aware of the status.
        create_dataprep_job(flow)
        abort(BAD_REQUEST, job_response.text)

    job_id = job_response.json().get('id')
    job_info = job_manager.fetch_job_details(job_id)
    create_dataprep_job(flow, job_info)
    LOG.info(
        'Dataprep job kicked off and added to the database for source %s', source_id
    )


def update_all_dataprep_jobs() -> None:
    with Transaction() as transaction:
        # For each Dataprep source, fetch the job details for all jobs that are incomplete.
        for source in transaction.find_all(SelfServeSource):
            if source.dataprep_flow:
                flow = source.dataprep_flow
                job_manager = DataprepManager()
                for job in flow.jobs:
                    if job.status not in COMPLETED_STATUSES:
                        job_info = job_manager.fetch_job_details(job.job_id)
                        # Status and last_modified_on_dataprep should be the only fields changing
                        job.status = job_info['status']
                        job.last_modified_on_dataprep = get_dataprep_time(
                            job_info, 'updatedAt'
                        )
                        transaction.add_or_update(job)


def validate_new_dataprep_setup(
    recipe_id: int, source_id: str
) -> Union[Dict[str, Any], int]:
    '''Validate Dataprep setup and if validation succeeds, fetch Dataprep config.

    Args
    ----
        recipe_id: Dataprep recipe id (pulled from Dataprep URL)
        source_id: Self-serve source id
        request: A 'flask.wrappers.Request' object.

    returns
    --------
        dict: List of uploaded input files, dataset parameterization
            status, and list of expected input file headers.

    If validation fails, aborted with error message id.
    '''
    # TODO Logically, a source id would not yet have been created for a new
    # source, so cannot check if it exists. However for Datapreps, the pipeline
    # datasource record is currently required to exist before setup in Data
    # Upload is possible. Change logic when DU fully supports Datapreps.
    pipeline_datasource = get_pipeline_datasource_by_id(source_id)
    if pipeline_datasource is None:
        abort(NOT_FOUND, INVALID_SOURCE_ID)

    try:
        dataprep_config = fetch_dataprep_initial_config(recipe_id, source_id)
    except DataprepSetupException as e:
        abort(BAD_REQUEST, e.message)

    return dataprep_config


def clean_files_in_object_storage(
    source_id: str, is_dataprep: bool, files_to_clean_up: List[str]
) -> None:
    '''Files are put in object storage before the changes are cancelled.
    If changes are cancelled, then those temporary files need to be deleted.
    '''
    if not ENABLE_REMOTE_CHANGES:
        LOG.info('Not a production instance, skipping cleaning cancelled files.')
        return

    if is_dataprep:
        # Dataprep files are stored in object storage before being copied to GCS.
        delete_dataprep_self_serve_files(source_id, files_to_clean_up, False)
    else:
        self_serve_conn = SelfServeConnection(source_id)
        self_serve_conn.delete_files(files_to_clean_up)


def download_input_file(key: str, source_id: str, is_dataprep: bool) -> Response:
    '''Download the input file associated with parameters.

    Args
    ----
        key: Relative filepath of the file to download
        source_id: Source's slugified id (used to determine full file path)
        is_dataprep: Dataprep source flag (used to determine full file path)
    '''
    # Dataprep input files are stored in GCS.
    if is_dataprep:
        connection = ConnectionManager('gcs')
        full_key_path = build_self_serve_key_prefix(source_id, key)
    # CSV input files are stored on minio server.
    else:
        self_serve_conn = SelfServeConnection(source_id)
        connection = self_serve_conn.connection_manager
        full_key_path = self_serve_conn.get_file_key(key)

    try:
        stored_obj = connection.get_object(full_key_path)
    except connection.client.exceptions.NoSuchKey:
        abort(NOT_FOUND)

    # The mimetypes library is using the mimetype of the base file rather than
    # the correct type for the zipped file.
    if key.endswith('.gz'):
        mimetype: Optional[str] = 'application/gzip'
    else:
        mimetype = mimetypes.guess_type(key)[0]
    return Response(
        stored_obj['Body'].iter_chunks(chunk_size=10240),  # 10KiB chunk
        mimetype=mimetype,
        headers={'Content-Length': stored_obj['ContentLength']},
    )
