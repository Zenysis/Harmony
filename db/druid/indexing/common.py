import math
import os
from datetime import datetime
from typing import Any, List, Union

from config.druid import DIMENSIONS, UNFILTERABLE_DIMENSIONS
from config.datatypes import BaseRowType

from config.druid_base import FIELD_NAME
from db.druid.config import DruidConfig
from db.druid.indexing.minio_task_builder import MinioObject
from db.druid.indexing.task_runner_util import build_dimension_spec_dimensions
from db.druid.util import build_time_interval
from util.connections.connection_manager import get_connection_values


# Directory location where a hash of the files ingested for a datasource
# are stored
DEFAULT_TASK_HASH_DIR = os.environ[
    "DEFAULT_TASK_HASH_DIR"
]

INDEX_URL = f'{DruidConfig.router_endpoint()}/druid/indexer/v1/task'


def build_data_schema(
    datasource_name: str,
    start_date: datetime,
    end_date: datetime,
) -> dict:
    dimensions = build_dimension_spec_dimensions(DIMENSIONS, UNFILTERABLE_DIMENSIONS)
    return {
        'dataSource': datasource_name,
        'dimensionsSpec': {'dimensions': dimensions},
        'granularitySpec': {
            'intervals': [build_time_interval(start_date, end_date)],
            'queryGranularity': {'type': 'none'},
            'segmentGranularity': 'MONTH',
            'type': 'uniform',
        },
        'metricsSpec': [
            {'name': 'count', 'type': 'count'},
            {'fieldName': 'val', 'name': 'sum', 'type': 'doubleSum'},
            {'fieldName': 'val', 'name': 'min', 'type': 'doubleMin'},
            {'fieldName': 'val', 'name': 'max', 'type': 'doubleMax'},
        ],
        'timestampSpec': {
            'column': BaseRowType.DATE_FIELD,
            'format': 'auto',
        },
    }


def get_max_number_of_files(files: List[Any], concurrent_subtasks: int):
    # Druid tries to assign files to subtasks for us and chooses a sub-optimal split.
    # This is used to manually choose how many files to put in each bucket based on
    # the number of files and concurrent subtasks.
    return math.ceil(len(files) / concurrent_subtasks)


def build_io_config_minio(
    files: List[MinioObject], use_nested_json_format: bool, max_num_files: int
) -> dict:
    flattened_files = flatten_files(files, max_num_files, fs='minio')
    access = get_connection_values()
    return {
        'inputFormat': input_format(use_nested_json_format),
        'inputSource': {
            'uris': flattened_files,
            'type': 's3',
            'properties': {
                'accessKeyId': access[1],
                'secretAccessKey': access[2],
            },
        },
        'type': 'index_parallel',
    }


def build_io_config_local(
    files: List[str], use_nested_json_format: bool, max_num_files: int
) -> dict:
    flattened_files = flatten_files(files, max_num_files)
    return {
        'inputFormat': input_format(use_nested_json_format),
        'inputSource': {
            'files': flattened_files,
            'type': 'local',
        },
        'type': 'index_parallel',
    }


def build_io_config(files: List[Any], use_nested_json_format: bool, max_num_files: int):
    if files and isinstance(files[0], MinioObject):
        return build_io_config_minio(files, use_nested_json_format, max_num_files)
    return build_io_config_local(files, use_nested_json_format, max_num_files)


def input_format(use_nested_json_format):
    # Data is stored either as flat JSON lines or as JSON lines with a nested `data`
    # object that maps field ID to field value.
    if use_nested_json_format:
        return {
            'pivotSpec': [
                {
                    'dimensionFieldName': FIELD_NAME,
                    'metricFieldName': 'val',
                    'rowFieldName': 'data',
                }
            ],
            'type': 'nestedJson',
        }
    return {'type': 'json'}


def flatten_files(
    files: Union[List[MinioObject], List[str]], max_num_files: int, fs='local'
) -> List[str]:
    # We want to have each bucket have the same amount of data, so we rearrange
    # the order of the files we send over. We want the file with runoff to be
    # the one with the biggest file as it can have fewer files than the rest.
    buckets = math.ceil(len(files) / max_num_files)
    bucketed_files: List[List[str]] = [[] for i in range(buckets)]
    if fs == 'minio':
        files.sort(key=lambda file: file.Size, reverse=True)  # type: ignore[attr-defined]
    else:
        files.sort(key=lambda file: os.stat(file).st_size, reverse=True)  # type: ignore[arg-type]

    counter = buckets - 1
    runoff = len(files) % max_num_files
    for file in files:
        if isinstance(file, MinioObject):
            bucketed_files[counter].append(file.uri)
        else:
            bucketed_files[counter].append(file)
        # If the last bucket has reached the runoff amount, (it is the overflow bucket),
        # we will skip the last bucket and start at the second to last bucket.
        if counter == 0 and len(bucketed_files[buckets - 1]) == runoff:
            counter = buckets - 2
        elif counter == 0:
            counter = buckets - 1
        else:
            # unless we are at the first bucket, we will decrement the bucket we are filling
            counter -= 1
    return [file for bucket in bucketed_files for file in bucket]


def build_tuning_config(
    concurrent_subtasks: int,
    use_hashed_partitioning: bool,
    max_number_of_files: int,
) -> dict:
    return {
        'type': 'index_parallel',
        'maxNumConcurrentSubTasks': concurrent_subtasks,
        'maxPendingPersists': 1,
        # Prefer a `roaring` bitmap since it enables high performance filtering of data
        # during querying.
        'indexSpec': {
            'bitmap': {
                'type': 'roaring',
            },
        },
        # Hashed partitioning results in the fewest number of segments (one per month)
        # and will "roll up" rows that share dimensions into a single row in the segment
        # storage. This is the preferred indexing choice since fewer segments leads to
        # faster queries. However, it is also the slower form of indexing since it
        # requires two passes over the data (one to collect the data into intermediate
        # segments, and another pass to collapse those intermediate segments into the
        # final segment set). In `dynamic` partitioning, there is only a single pass
        # over the data, which results in much faster indexing. However, depending on
        # the parallelization, there might be more segments generated. If you use
        # `dynamic` partitioning, it can be helpful to run compaction over the
        # datasource when you are done to collapse the segments into the optimal set in
        # the background.
        'forceGuaranteedRollup': use_hashed_partitioning,
        'partitionsSpec': (
            {'type': 'hashed', 'numShards': 1}
            if use_hashed_partitioning
            else {'type': 'dynamic'}
        ),
        # Specify the splitHintSpec so that Druid can efficiently parallelize the file
        # ingestion. We specify `maxNumFiles` such that each indexing sub task will
        # process the same number of files.
        'splitHintSpec': {
            'maxNumFiles': max_number_of_files,
            'type': 'maxSize',
        },
        # The timeout to wait for the new datasource to propagate to the whole cluster
        # and the coordinator to indicate new segments are available for querying. Wait
        # for 2 minutes. Note this doesn't guarantee the datasource has propagated as
        # the overall indexing task will still succeed if this timeout is reached.
        'awaitSegmentAvailabilityTimeoutMillis': 120000,
    }


def build_datasource_version(datasource_creation_timestamp: str) -> str:
    '''NOTE: Druid does not provide a way to set the datasource version during
    native indexing, and it does not provide a way to get the segment version of an
    in-progress indexing task. We try to estimate what it will become by truncating the
    milliseconds off of the datasource creation timestamp since normally the segment
    version timestamp is just a few milliseconds after the datasource creation
    timestamp that we get from indexing.
    '''
    return datasource_creation_timestamp.split('.')[0]
