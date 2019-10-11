#!/usr/bin/env python
# Run a druid indexing task for a given site integration
# Example invocation:
# ZEN_ENV='et' ./run_indexing.py \
#   --data_files '/home/share/data/ethiopia/*/current/processed_rows.*'
# Advanced usage can be found with the help menu

import datetime
import os
import sys

from glob import glob

import requests

from pylib.base.flags import Flags
from pylib.file.file_utils import FileUtils

# HACK(stephen): Really annoying hack to fix conflicting module imports
# due to overuse of "util" module and folder name.
sys.path = [path for path in sys.path if 'db/druid' not in path]

# pylint: disable=C0413
from config.general import DEPLOYMENT_NAME
from config.druid import DIMENSIONS
from config.datatypes import BaseRowType
from db.druid.config import DruidConfig
from db.druid.datasource import SiteDruidDatasource
from db.druid.errors import MissingDatasourceException
from db.druid.indexing.task_builder import DruidIndexingTaskBuilder
from db.druid.metadata import DruidMetadata
from db.druid.util import DRUID_DATE_FORMAT

INDEX_URL = '%s/druid/indexer/v1/task' % (DruidConfig.indexing_endpoint())

# Directory location where a hash of the files ingested for a datasource
# are stored
DEFAULT_TASK_HASH_DIR = '/home/share/data/logs/druid_indexing/hash'

# Date range to index data for.
TODAY = datetime.datetime.today()
DEFAULT_MIN_DATA_DATE_STR = '2009-01-01'
DEFAULT_MAX_DATA_DATE_STR = (TODAY + datetime.timedelta(days=366)).strftime(DRUID_DATE_FORMAT)

# Return the absolute path for the given input path. If the input path is a
# glob, it will be expanded into a list of files matching the pattern. If the
# input path is a relative path, the working directory specified will be used
# to compute the absolute path.
def build_absolute_paths(input_path, working_directory):
    return glob(os.path.abspath(os.path.join(working_directory, input_path)))


def get_current_datasource_for_site():
    # It's ok if no datasource exists for the current site. We could be
    # creating the first one!
    datasource = version = None
    try:
        from config.database import DATASOURCE

        datasource = DATASOURCE.name
        # TODO(stephen): It'd be awesome if the version was stored as part of
        # the DruidDatasource object.
        version = DruidMetadata.get_datasource_version(datasource)
    except MissingDatasourceException:
        print('No datasource exists for site: %s' % DEPLOYMENT_NAME)
    return (datasource, version)


def build_indexing_task(version):
    # Create a set of absolute paths for the input path list
    input_paths = Flags.ARGS.data_files
    cwd = os.getcwd()
    full_paths = set()
    for path in input_paths:
        full_paths.update(build_absolute_paths(path, cwd))

    assert len(full_paths) > 0, 'No matching paths found for indexing!'

    # Parse the task definition overrides if specified. Defaults to None
    task_template_json = FileUtils.FileContents(Flags.ARGS.task_template_file)
    metrics_spec_json = FileUtils.FileContents(Flags.ARGS.metrics_spec_file)
    tuning_config_json = FileUtils.FileContents(Flags.ARGS.tuning_config_file)

    # If no datasource name is specified, generate a valid site datasource
    # and use its name.
    datasource_name = (
        Flags.ARGS.datasource_name or SiteDruidDatasource(DEPLOYMENT_NAME, TODAY).name
    )

    min_data_date = datetime.datetime.strptime(
        Flags.ARGS.min_data_date, DRUID_DATE_FORMAT
    )
    max_data_date = datetime.datetime.strptime(
        Flags.ARGS.max_data_date, DRUID_DATE_FORMAT
    )
    return DruidIndexingTaskBuilder(
        datasource_name,
        DIMENSIONS,
        BaseRowType.DATE_FIELD,
        full_paths,
        min_data_date,
        max_data_date,
        task_template_json,
        metrics_spec_json,
        tuning_config_json,
        version,
    )


def get_hash_storage_path(datasource_name, datasource_version):
    filename = '%s_%s.hash' % (datasource_name, datasource_version)
    return os.path.join(Flags.ARGS.task_hash_dir, filename)


def task_contains_new_data(indexing_task, cur_datasource, cur_version):
    # Check to see if the current datasource has an indexing hash we
    # can compare to
    cur_hash_file = get_hash_storage_path(cur_datasource, cur_version)
    if not os.path.isdir(Flags.ARGS.task_hash_dir):
        raise RuntimeError(
            'You need to create the task hash dir, %s' % Flags.ARGS.task_hash_dir
        )
    if not os.path.isfile(cur_hash_file):
        return True

    # Each line of the hash file contains a separate file hash. Compare
    # the current file hashes with the new file hashes to see if there is a
    # difference.
    # NOTE(stephen): Intentionally not using a set here since it's possible
    # for an indexing job to index the same file twice on purpose.
    cur_file_hash = sorted(FileUtils.FileContents(cur_hash_file).split('\n'))
    new_file_hash = sorted(indexing_task.get_file_hashes())
    return cur_file_hash != new_file_hash


def store_task_hash(indexing_task):
    hash_filename = get_hash_storage_path(
        indexing_task.datasource, indexing_task.version
    )
    with open(hash_filename, 'w') as hash_file:
        hash_file.write(indexing_task.get_task_hash())


# Kick off a new indexing task
def run_task(indexing_task, dry_run=False):
    task_dict = indexing_task.task_definition
    # TODO(stephen): Switch to the log library so that we can specify
    # a loglevel as a flag. Then I won't have to comment out potentially
    # useful debug statements.
    # print 'Running task with definition:'
    # print json.dumps(task_dict, indent=2, sort_keys=True)

    # If this is a dry-run, change the task type to "noop" to skip
    # building a new datasource.
    if dry_run:
        task_dict['type'] = 'noop'

    r = requests.post(INDEX_URL, json=task_dict)
    if not r.ok:
        print('Failed to start task. Reason: %s' % r.reason)
        return None
    return r.json()['task']


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
        help='Optional datasource name. If unspecified, ' 'one will be generated.',
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
        help='Directory where indexing task hashes are ' 'stored',
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
        help='Issue a "noop" indexing task and skip ' 'building a new datasource',
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
    Flags.InitArgs()

    # Create deterministic version number so that we can differentiate the
    # current live datasources even if they have the same datasource name.
    # NOTE(stephen): For some weird reason, this string version value has to
    # resolve to a value less than the task "lock" version, which is the
    # formatted timestamp that the druid indexing task actually began. This is
    # dumb. https://github.com/druid-io/druid/pull/3559
    version = TODAY.strftime('%Y-%m-%d.%H%M%S')
    indexing_task = build_indexing_task(version)
    indexing_task.print_overview()
    print('')

    (cur_datasource, cur_version) = get_current_datasource_for_site()
    if (
        not Flags.ARGS.force
        and cur_datasource
        and cur_version
        and not task_contains_new_data(indexing_task, cur_datasource, cur_version)
    ):
        print(
            '##### Skipping indexing since existing datasource '
            'contains the same data specified in this task. #####'
        )
        print('##### Current datasource: %s #####' % cur_datasource)
        print('##### Current version: %s #####' % cur_version)
        # TODO(stephen): Switch to the log library so that we can specify
        # a loglevel as a flag. Then I won't have to comment out potentially
        # useful debug statements.
        # print 'Current task hash:'
        # print indexing_task.get_task_hash()
        return 0

    dry_run = Flags.ARGS.dry_run
    task_id = run_task(indexing_task, dry_run)
    if not task_id:
        return 1

    if not dry_run:
        store_task_hash(indexing_task)

    output_task_id_file = Flags.ARGS.output_task_id_file
    if output_task_id_file:
        FileUtils.CreateFileWithData(output_task_id_file, task_id)

    print('Successfully started indexing task. Task ID: %s' % task_id)
    return 0


if __name__ == '__main__':
    sys.exit(main())
