import csv
import io
import os
from typing import Any, Dict, List, Optional

from botocore.response import StreamingBody
import pandas as pd

from log import LOG
from util.connections.connection_manager import ConnectionManager
from util.dataprep.api import DataprepManager, DataprepSetupException

DATAPREP_ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}


def _does_key_path_exist_in_bucket(key: str, connection: ConnectionManager) -> bool:
    try:
        if not connection.does_key_exist_for_bucket(key):
            return False
    except connection.client.exceptions.NoSuchBucket:
        return False
    return True


def get_file_headers(
    filepath: str, file_stream: Optional[StreamingBody] = None
) -> List[str]:
    '''A utility function to get the headers of a file. It supports excel and csv files.
    They can be provided either as a filepath or as a stream.
    '''
    if filepath.endswith(('.xlsx', '.xls')):
        # read_excel requires either a filepath or an object with a `seek` method.
        # Since you cannot seek from a stream, we need to read the stream.
        file_like_object = (
            filepath if file_stream is None else io.BytesIO(file_stream.read())
        )
        df = pd.read_excel(file_like_object, nrows=1)
        return list(df.columns)

    if filepath.endswith('.csv'):
        # NOTE: use utf-8-sig because sometimes excels converted to csvs
        # have extra characters at the beginning of the file
        # NOTE: Explicitly avoiding pandas.read_csv here since even with
        # nrows=1, it decodes the whole file. For Datapreps, we only need the
        # headers and want to let Dataprep handle any encoding issues with the
        # rest of the file.
        if file_stream is None:
            with open(filepath, encoding='utf-8-sig') as csv_file:
                return next(csv.reader(csv_file), [])

        # open doesn't work with a stream, so handle it differently. Take the first
        # line and decode the bytes to a string.
        lines = [next(file_stream.iter_lines(), b'').decode('utf-8-sig')]
        return next(csv.reader(lines))

    return []


def build_self_serve_key_prefix(source_id: str, file_name: str) -> str:
    '''Creates the path for cloud storage with the pattern:
    `self_serve/<source_id>/<file_name>`
    '''
    return f'self_serve/{source_id}/{file_name}'


def check_files_exist(
    source_id: str,
    expected_files: List[str],
    host: Optional[str] = None,
) -> bool:
    '''Check that the provided list of files exists in the self serve folder. The host is only
    necessary to specify Google Cloud Storage, otherwise the default deployment cloud storage
    option will be used. If any files don't exist, then they'll be logged and the function will
    return False.'''
    if expected_files:
        missing_files = []
        prefix = f'self_serve/{source_id}'
        connection = ConnectionManager(host)
        cloud_files = {
            os.path.basename(obj['Key'])
            for obj in connection.get_object_list_for_bucket(prefix)
        }
        for file_name in expected_files:
            if file_name not in cloud_files:
                missing_files.append(file_name)
        if missing_files:
            LOG.error(
                'Expected Dataprep files for source %s not found at %s. The missing files are: %s',
                source_id,
                f'{host}/{connection.bucket_name}/{prefix}',
                ', '.join(missing_files),
            )
            return False
    return True


def migrate_dataprep_self_serve_files(source_id: str, file_names: List[str]) -> None:
    '''Migrate the files with the provided file names from cloud storage to Google Cloud
    Storage.'''
    source_connection = ConnectionManager()
    destination_connection = ConnectionManager('gcs')

    for file_name in file_names:
        file_path = build_self_serve_key_prefix(source_id, file_name)
        file_response = source_connection.get_object(file_path)
        destination_connection.client.upload_fileobj(
            file_response['Body'], destination_connection.bucket_name, file_path
        )
        source_connection.delete_file(file_path)


def delete_dataprep_self_serve_files(
    source_id: str, file_names: List[str], existing_files: bool
) -> None:
    """Delete the files with the provided file names from cloud storage. If the files
    already existed in Dataprep, then they will be deleted from gcs. Otherwise, they
    will be deleted from the deployment's cloud storage option."""
    host = 'gcs' if existing_files else None
    connection = ConnectionManager(host)
    for file_name in file_names:
        file_path = build_self_serve_key_prefix(source_id, file_name)
        connection.delete_file(file_path)


def are_file_names_valid(filenames: List[str], flow_parameterized: bool) -> bool:
    '''Based on parameterization status, validate that input files match
    expected conventions.'''
    if flow_parameterized:
        # Input files must have same extension
        extensions = [file.split('.')[-1] for file in filenames]
        return all(ext == extensions[0] for ext in extensions)
    # If not parameterized, require single input file called self_serve_input
    return len(filenames) == 1 and filenames[0].split('.')[0] == 'self_serve_input'


def fetch_dataprep_initial_config(recipe_id: int, source_id: str) -> Dict[str, Any]:
    '''This function validates the setup of a new Dataprep source.

    Possible config validation failures:
        - bad gcs input (no bucket, bad bucket contents)
        - recipe id does not link to a valid Flow
        - recipe id links to Flow but does not run full Flow

    Returns dict with initial Flow configuration information:
        - isFlowParameterized: dataset parameterization status
        - dataprepExpectedColumns: list of expected input file headers
        - uploadedFiles: list of uploaded input files
    '''
    # Validate that a bucket exists for this source
    key = f'self_serve/{source_id}/'
    connection = ConnectionManager('gcs')
    if not _does_key_path_exist_in_bucket(key, connection):
        raise DataprepSetupException('bucketPathDoesNotExistError')

    # Fetch files with acceptable extensions from source bucket
    source_files = [
        file_object
        for file_object in connection.get_object_list_for_bucket(key)
        if '.' in file_object['Key'][len(key) :]
        and file_object['Key'].split('.')[-1] in DATAPREP_ALLOWED_EXTENSIONS
    ]

    # Error if source bucket doesn't contain any valid input files
    if len(source_files) < 1:
        raise DataprepSetupException('badBucketContentsError')

    # Pull expected headers from the first self-serve file in bucket
    file_name = source_files[0]['Key']
    # `get_object` returns a stream so that we can read in only the header row
    streaming_body = connection.get_object(file_name)['Body']
    # TODO: Catch UnicodeDecodeError and return a specific error.
    file_headers = get_file_headers(file_name, streaming_body)

    # A Dataprep Flow can be parameterized, meaning that multiple input files
    # can be appended to it. Fetch Flow associated with recipe id and check its
    # parameterization status.
    dataprep_manager = DataprepManager()
    flow_is_parameterized = dataprep_manager.fetch_parameterization_status(
        recipe_id, source_id
    )

    # Confirm that file naming conventions are acceptable.
    # Conventions differ for parameterized vs. unparameterized Flows.
    file_metadata = [
        {
            'lastModified': file_object['LastModified'].strftime('%Y-%m-%d %H:%M:%S'),
            'userFileName': file_object['Key'][len(key) :],
        }
        for file_object in source_files
    ]
    filenames = [file['userFileName'] for file in file_metadata]
    if not are_file_names_valid(filenames, flow_is_parameterized):
        if flow_is_parameterized:
            raise DataprepSetupException('badParameterizedFileNamesError')
        raise DataprepSetupException('badReplacementFileNamesError')

    # Confirm that provided recipe id is the final recipe id in the Dataprep Flow.
    # If not, then the job cannot be run.
    if not dataprep_manager.validate_job_can_be_run(recipe_id):
        raise DataprepSetupException('incorrectRecipeIDSelectedError')

    return {
        'isFlowParameterized': flow_is_parameterized,
        'dataprepExpectedColumns': file_headers,
        'uploadedFiles': file_metadata,
    }
