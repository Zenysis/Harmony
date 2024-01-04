#!/usr/bin/env python
# This script sends off a request to kick off native indexing parallel tasks.
# It takes in a number of concurrent subtasks and a list of files to index.
# Druid will create a supervisor task called index_parallel and creates
# worker tasks to process groups of files. It does not use Hadoop.
import sys

from datetime import datetime, timedelta

from pylib.base.flags import Flags

from config.general import DEPLOYMENT_NAME
from db.druid.config import DruidConfig
from db.druid.indexing.common import (
    build_data_schema,
    get_max_number_of_files,
    INDEX_URL,
    build_io_config,
    build_tuning_config,
    build_datasource_version,
)
from db.druid.indexing.minio_task_builder import (
    store_task_hash as store_minio_task_hash,
    build_files_to_index as build_minio_files_to_index,
)
from db.druid.indexing.task_runner_util import (
    build_datasource_name,
    get_current_datasource_for_site,
    run_task,
    task_contains_new_data,
    write_task_metadata,
    build_files_to_index,
    store_task_hash,
)
from db.druid.util import DRUID_DATE_FORMAT
from log import LOG

# Default date range to index data for.
TODAY = datetime.today()
DEFAULT_MIN_DATA_DATE_STR = '2009-01-01'
DEFAULT_MAX_DATA_DATE_STR = (TODAY + timedelta(days=10 * 365 + 1)).strftime(
    DRUID_DATE_FORMAT
)


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
        required=True,
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
    Flags.PARSER.add_argument(
        '--file_system',
        type=str,
        default='local',
        help='Whether to use Minio or Local Filesystem',
    )
    Flags.PARSER.add_argument(
        '--local_server_shared_folder',
        type=str,
        default=None,
        help='Path to the shared druid folder on the local server',
    )
    Flags.PARSER.add_argument(
        '--druid_server_shared_folder',
        type=str,
        default='/home/share',
        help='Path to the shared druid folder on the druid server',
    )
    Flags.InitArgs()

    datasource_name = build_datasource_name(DEPLOYMENT_NAME, Flags.ARGS.datasource_name)
    start_date = datetime.strptime(Flags.ARGS.min_data_date, DRUID_DATE_FORMAT)
    end_date = datetime.strptime(Flags.ARGS.max_data_date, DRUID_DATE_FORMAT)

    task_hash_dir = Flags.ARGS.task_hash_dir
    using_minio = Flags.ARGS.file_system == 'minio'
    if using_minio:
        files_to_index = build_minio_files_to_index(
            Flags.ARGS.data_files, DEPLOYMENT_NAME
        )
    else:
        files_to_index = build_files_to_index(Flags.ARGS.data_files)

    (cur_datasource, cur_version) = get_current_datasource_for_site(DEPLOYMENT_NAME)
    if not Flags.ARGS.force and not task_contains_new_data(
        cur_datasource,
        cur_version,
        files_to_index,
        task_hash_dir,
        storage=Flags.ARGS.file_system,
    ):
        cur_version = build_datasource_version(cur_version)
        LOG.info(
            '##### Skipping indexing since existing datasource '
            'contains the same data specified in this task. #####'
        )
        LOG.info('##### Current datasource: %s #####', cur_datasource)
        LOG.info('##### Current version: %s #####', cur_version)
        return 0

    if Flags.ARGS.concurrent_subtasks <= 0:
        raise ValueError('Native Indexing must have at least one concurrent subtask')

    if len(files_to_index) == 0:
        raise ValueError('Native Indexing must index at least one file')

    max_num_files = get_max_number_of_files(
        files_to_index, Flags.ARGS.concurrent_subtasks
    )
    indexing_task = {
        'spec': {
            'dataSchema': build_data_schema(datasource_name, start_date, end_date),
            'ioConfig': build_io_config(
                files_to_index,
                Flags.ARGS.use_nested_json_format,
                max_num_files,
                Flags.ARGS.local_server_shared_folder,
                Flags.ARGS.druid_server_shared_folder,
            ),
            'tuningConfig': build_tuning_config(
                Flags.ARGS.concurrent_subtasks,
                Flags.ARGS.partitioning_type != 'dynamic',
                max_num_files,
            ),
        },
        'type': 'index_parallel',
    }

    dry_run = Flags.ARGS.dry_run
    task_id = run_task(
        indexing_task,
        INDEX_URL,
        dry_run=dry_run,
        druid_config=DruidConfig,
    )
    if not task_id:
        return 1

    # NOTE: Pull the datasource creation timestamp from the task ID.
    datasource_version = build_datasource_version(task_id.rsplit('_', 1)[1])
    if not dry_run:
        if using_minio:
            store_minio_task_hash(
                files_to_index, datasource_name, datasource_version, task_hash_dir
            )
        else:
            store_task_hash(
                files_to_index, datasource_name, datasource_version, task_hash_dir
            )

    # NOTE: If we need more task information we should add it a
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
