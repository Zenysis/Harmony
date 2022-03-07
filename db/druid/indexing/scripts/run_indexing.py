#!/usr/bin/env python
# Run a druid indexing task for a given site integration
# Example invocation:
# ZEN_ENV='et' ./run_indexing.py \
#   --data_files '/home/share/data/ethiopia/*/current/processed_rows.*'
# Advanced usage can be found with the help menu

import datetime
import sys

from pylib.base.flags import Flags
from pylib.file.file_utils import FileUtils

# pylint: disable=C0413
from config.general import DEPLOYMENT_NAME
from config.druid import DIMENSIONS, UNFILTERABLE_DIMENSIONS
from config.datatypes import BaseRowType
from db.druid.config import DruidConfig
from db.druid.indexing.legacy_task_builder import DruidIndexingTaskBuilder
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
from db.druid.util import DRUID_DATE_FORMAT

INDEX_URL = '%s/druid/indexer/v1/task' % (DruidConfig.indexing_endpoint())

# Directory location where a hash of the files ingested for a datasource
# are stored
DEFAULT_TASK_HASH_DIR = '/home/share/data/logs/druid_indexing/hash'

# Date range to index data for.
TODAY = datetime.datetime.today()
DEFAULT_MIN_DATA_DATE_STR = '2009-01-01'
DEFAULT_MAX_DATA_DATE_STR = (TODAY + datetime.timedelta(days=366)).strftime(
    DRUID_DATE_FORMAT
)


def build_indexing_task(
    datasource_name: str, datasource_version: str
) -> DruidIndexingTaskBuilder:
    # Create a set of absolute paths for the input path list
    full_paths = build_files_to_index(Flags.ARGS.data_files)

    # Parse the task definition overrides if specified. Defaults to None
    task_template_json = FileUtils.FileContents(Flags.ARGS.task_template_file)
    metrics_spec_json = FileUtils.FileContents(Flags.ARGS.metrics_spec_file)
    tuning_config_json = FileUtils.FileContents(Flags.ARGS.tuning_config_file)

    min_data_date = datetime.datetime.strptime(
        Flags.ARGS.min_data_date, DRUID_DATE_FORMAT
    )
    max_data_date = datetime.datetime.strptime(
        Flags.ARGS.max_data_date, DRUID_DATE_FORMAT
    )

    return DruidIndexingTaskBuilder(
        datasource_name,
        build_dimension_spec_dimensions(DIMENSIONS, UNFILTERABLE_DIMENSIONS),
        BaseRowType.DATE_FIELD,
        full_paths,
        min_data_date,
        max_data_date,
        task_template_json,
        metrics_spec_json,
        tuning_config_json,
        datasource_version,
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
        '--task_template_file',
        type=str,
        default='',
        help='Optional indexing template to use',
    )
    Flags.PARSER.add_argument(
        '--metrics_spec_file', type=str, default='', help='Optional metrics spec to use'
    )
    Flags.PARSER.add_argument(
        '--tuning_config_file',
        type=str,
        default='',
        help='Optional task tuning config to use',
    )
    Flags.PARSER.add_argument(
        '--task_hash_dir',
        type=str,
        default=DEFAULT_TASK_HASH_DIR,
        help='Directory where indexing task hashes are stored',
    )
    Flags.PARSER.add_argument(
        '--output_task_id_file',
        type=str,
        default='',
        help='File to store the indexing task ID in',
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
        '--output_datasource_name_file',
        type=str,
        default='',
        help='File to store the datasource name in',
    )
    Flags.PARSER.add_argument(
        '--output_datasource_version_file',
        type=str,
        default='',
        help='File to store the datasource version in',
    )
    Flags.InitArgs()

    task_hash_dir = Flags.ARGS.task_hash_dir
    datasource_name = build_datasource_name(DEPLOYMENT_NAME, Flags.ARGS.datasource_name)

    # Create deterministic version number so that we can differentiate the
    # current live datasources even if they have the same datasource name.
    # NOTE(stephen): For some weird reason, this string version value has to
    # resolve to a value less than the task "lock" version, which is the
    # formatted timestamp that the druid indexing task actually began.
    # https://github.com/druid-io/druid/pull/3559
    datasource_version = TODAY.strftime('%Y-%m-%d.%H%M%S')

    indexing_task = build_indexing_task(datasource_name, datasource_version)
    indexing_task.print_overview()
    print('')

    files_to_index = indexing_task.paths
    (cur_datasource, cur_version) = get_current_datasource_for_site(DEPLOYMENT_NAME)
    if not Flags.ARGS.force and not task_contains_new_data(
        cur_datasource, cur_version, files_to_index, task_hash_dir
    ):
        print(
            '##### Skipping indexing since existing datasource '
            'contains the same data specified in this task. #####'
        )
        print('##### Current datasource: %s #####' % cur_datasource)
        print('##### Current version: %s #####' % cur_version)
        return 0

    dry_run = Flags.ARGS.dry_run
    task_id = run_task(indexing_task.task_definition, INDEX_URL, dry_run)
    if not task_id:
        return 1

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
        datasource_name_file=Flags.ARGS.output_datasource_name_file,
        datasource_version_file=Flags.ARGS.output_datasource_version_file,
        task_id_file=Flags.ARGS.output_task_id_file,
    )

    print('Successfully started indexing task. Task ID: %s' % task_id)
    return 0


if __name__ == '__main__':
    sys.exit(main())
