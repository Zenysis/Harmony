#!/usr/bin/env python
# Compact a datasource so that there is only one segment per month for the datasource.
# This is useful when the indexing task generates multiple segments for a single month
# like when `dynamic` partitioning is used. When running in parallel, a separate
# compaction task will be run for each month in the datasource. The Coordinator will
# manage the running of these tasks to ensure server resources are not overloaded.
import math
import sys

from datetime import datetime, timedelta
from typing import List

from pylib.base.flags import Flags

from config.general import DEPLOYMENT_NAME
from config.druid import DIMENSIONS, UNFILTERABLE_DIMENSIONS
from config.druid_base import FIELD_NAME
from config.datatypes import BaseRowType
from db.druid.config import DruidConfig
from db.druid.indexing.task_runner_util import (
    build_datasource_name,
    build_dimension_spec_dimensions,
    build_files_to_index,
    get_current_datasource_for_site,
    run_task,
    store_task_hash,
    task_contains_new_data,
    write_task_metadata,
)
from db.druid.util import DRUID_DATE_FORMAT, build_time_interval
from log import LOG

# Default date range to index data for.
TODAY = datetime.today()
DEFAULT_MIN_DATA_DATE_STR = '2009-01-01'
DEFAULT_MAX_DATA_DATE_STR = (TODAY + timedelta(days=366)).strftime(DRUID_DATE_FORMAT)

# Directory location where a hash of the files ingested for a datasource
# are stored
DEFAULT_TASK_HASH_DIR = '/home/share/data/logs/druid_indexing/hash'

INDEX_URL = '%s/druid/indexer/v1/task' % (DruidConfig.router_endpoint())


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


def build_io_config(
    files: List[str],
    use_nested_json_format: bool,
) -> dict:
    # Data is stored either as flat JSON lines or as JSON lines with a nested `data`
    # object that maps field ID to field value.
    input_format: dict = {'type': 'json'}
    if use_nested_json_format:
        input_format = {
            'pivotSpec': [
                {
                    'dimensionFieldName': FIELD_NAME,
                    'metricFieldName': 'val',
                    'rowFieldName': 'data',
                }
            ],
            'type': 'nestedJson',
        }

    return {
        'inputFormat': input_format,
        'inputSource': {
            'files': files,
            'type': 'local',
        },
        'type': 'index_parallel',
    }


def build_tuning_config(
    concurrent_subtasks: int,
    use_hashed_partitioning: bool,
    file_count: int,
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
        # process the same number of files. Without specifying this, Druid tries to
        # assign files to subtasks for us and chooses a sub-optimal split.
        'splitHintSpec': {
            'maxNumFiles': math.ceil(file_count / concurrent_subtasks),
            'type': 'maxSize',
        },
    }


def build_datasource_version(datasource_creation_timestamp: str) -> str:
    '''HACK(stephen): Druid does not provide a way to set the datasource version during
    native indexing, and it does not provide a way to get the segment version of an
    in-progress indexing task. We try to estimate what it will become by truncating the
    milliseconds off of the datasource creation timestamp since normally the segment
    version timestamp is just a few milliseconds after the datasource creation
    timestamp that we get from indexing.
    '''
    return datasource_creation_timestamp.split('.')[0]


def main():
    # Required flags
    Flags.PARSER.add_argument(
        '--data_files',
        type=str,
        required=True,
        nargs='+',
        help='Path to JSON data files to be ingested',
    )

    # Optional flags that override default values
    Flags.PARSER.add_argument(
        '--datasource_name',
        type=str,
        default='',
        help='Optional datasource name. If unspecified, one will be generated.',
    )
    Flags.PARSER.add_argument(
        '--concurrent_subtasks',
        type=int,
        default=6,
        help='Number of concurrent subtasks that can be used to build this datasource',
    )
    Flags.PARSER.add_argument(
        '--partitioning_type',
        choices=['hashed', 'dynamic'],
        default='hashed',
        help='Which style of partitioning to use for segment generation',
    )
    Flags.PARSER.add_argument(
        '--use_nested_json_format',
        action='store_true',
        default=False,
        help='The JSON lines that will be read during indexing use the nested format',
    )
    Flags.PARSER.add_argument(
        '--task_hash_dir',
        type=str,
        default=DEFAULT_TASK_HASH_DIR,
        help='Directory where indexing task hashes are stored',
    )
    Flags.PARSER.add_argument(
        '--force',
        action='store_true',
        default=False,
        help='Force the datasource to be created even if '
        'a datasource already exists with the same '
        'data',
    )
    Flags.PARSER.add_argument(
        '--dry_run',
        action='store_true',
        default=False,
        help='Issue a "noop" indexing task and skip building a new datasource',
    )
    Flags.PARSER.add_argument(
        '--min_data_date',
        type=str,
        default=DEFAULT_MIN_DATA_DATE_STR,
        help='Optional earliest data date string: YYYY-MM-DD',
    )
    Flags.PARSER.add_argument(
        '--max_data_date',
        type=str,
        default=DEFAULT_MAX_DATA_DATE_STR,
        help='Optional latest data date string: YYYY-MM-DD',
    )
    Flags.PARSER.add_argument(
        '--datasource_name_file',
        type=str,
        default='',
        help='File to store the datasource name in',
    )
    Flags.PARSER.add_argument(
        '--datasource_version_file',
        type=str,
        default='',
        help='File to store the datasource version in',
    )
    Flags.PARSER.add_argument(
        '--task_id_file',
        type=str,
        default='',
        help='File to store the indexing task ID in',
    )
    Flags.InitArgs()

    datasource_name = build_datasource_name(DEPLOYMENT_NAME, Flags.ARGS.datasource_name)
    start_date = datetime.strptime(Flags.ARGS.min_data_date, DRUID_DATE_FORMAT)
    end_date = datetime.strptime(Flags.ARGS.max_data_date, DRUID_DATE_FORMAT)

    task_hash_dir = Flags.ARGS.task_hash_dir
    files_to_index = build_files_to_index(Flags.ARGS.data_files)

    (cur_datasource, cur_version) = get_current_datasource_for_site(DEPLOYMENT_NAME)
    cur_version = build_datasource_version(cur_version)
    if not Flags.ARGS.force and not task_contains_new_data(
        cur_datasource, cur_version, files_to_index, task_hash_dir
    ):
        LOG.info(
            '##### Skipping indexing since existing datasource '
            'contains the same data specified in this task. #####'
        )
        LOG.info('##### Current datasource: %s #####', cur_datasource)
        LOG.info('##### Current version: %s #####', cur_version)
        return 0

    indexing_task = {
        'spec': {
            'dataSchema': build_data_schema(datasource_name, start_date, end_date),
            'ioConfig': build_io_config(
                files_to_index, Flags.ARGS.use_nested_json_format
            ),
            'tuningConfig': build_tuning_config(
                Flags.ARGS.concurrent_subtasks,
                Flags.ARGS.partitioning_type != 'dynamic',
                len(files_to_index),
            ),
        },
        'type': 'index_parallel',
    }

    dry_run = Flags.ARGS.dry_run
    task_id = run_task(indexing_task, INDEX_URL, dry_run)
    if not task_id:
        return 1

    # HACK(stephen): Pull the datasource creation timestamp from the task ID.
    datasource_version = build_datasource_version(task_id.rsplit('_', 1)[1])
    if not dry_run:
        store_task_hash(
            files_to_index, datasource_name, datasource_version, task_hash_dir
        )

    # NOTE(david, stephen): If we need more task information we should add it a
    # single flag and file rather than having the multiple flags we have here.
    write_task_metadata(
        datasource_name,
        datasource_version,
        task_id,
        datasource_name_file=Flags.ARGS.datasource_name_file,
        datasource_version_file=Flags.ARGS.datasource_version_file,
        task_id_file=Flags.ARGS.task_id_file,
    )

    LOG.info('Successfully started indexing task. Task ID: %s', task_id)
    return 0


if __name__ == '__main__':
    sys.exit(main())
