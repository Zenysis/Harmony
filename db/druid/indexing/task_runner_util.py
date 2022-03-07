import datetime
import json
import os
import pathlib

from glob import glob
from typing import List, Optional, Tuple, Union

import requests

from pylib.file.file_utils import FileUtils

from db.druid.datasource import SiteDruidDatasource
from db.druid.errors import BadIndexingPathException, MissingDatasourceException
from db.druid.metadata import DruidMetadata
from log import LOG
from util.file.directory_util import compute_file_hash


def build_dimension_spec_dimensions(
    dimensions: List[str],
    unfilterable_dimensions: List[str],
) -> List[Union[str, dict]]:
    '''Build a list of dimensions to index.'''
    output: List[Union[str, dict]] = []
    for dimension in dimensions:
        # If the dimension is unfilterable, we can instruct Druid to skip creating
        # a bitmap index for this dimension that we know will never be filtered on. This
        # in theory will improve segment storage size and indexing memory usage.
        if dimension in unfilterable_dimensions:
            output.append(
                {
                    'createBitmapIndex': False,
                    'name': dimension,
                    'type': 'string',
                }
            )
        else:
            output.append(dimension)
    return output


def get_current_datasource_for_site(
    deployment_name: str,
) -> Tuple[Optional[str], Optional[str]]:
    '''Find the current datasource name and version for the current site. If none
    exists, return (None, None).
    '''
    # It's ok if no datasource exists for the current site. We could be
    # creating the first one!
    datasource = version = None
    try:
        # TODO(stephen): It'd be awesome if the version was stored as part of
        # the DruidDatasource object.
        datasource = DruidMetadata.get_most_recent_datasource(deployment_name).name
        version = DruidMetadata.get_datasource_version(datasource)
    except MissingDatasourceException:
        LOG.warning('No datasource exists for site: %s', deployment_name)
    return (datasource, version)


def get_hash_storage_path(
    datasource_name: str,
    datasource_version: str,
    task_hash_dir: str,
):
    filename = f'{datasource_name}_{datasource_version}.hash'
    return os.path.join(task_hash_dir, filename)


def task_contains_new_data(
    cur_datasource: Optional[str],
    cur_version: Optional[str],
    files: List[str],
    task_hash_dir: str,
) -> bool:
    '''Check to see if the current datasource contains the same data that we are trying
    to index.
    '''
    # If no datasource exists yet for this deployment, we definitely have new data.
    if not cur_datasource or not cur_version:
        return True

    # Check to see if the current datasource has an indexing hash we can compare to.
    cur_hash_file = get_hash_storage_path(cur_datasource, cur_version, task_hash_dir)

    # NOTE(stephen): This should only happen on a newly setup pipeline system.
    if not os.path.isdir(task_hash_dir):
        raise RuntimeError(f'You need to create the task hash dir, {task_hash_dir}')

    if not os.path.isfile(cur_hash_file):
        return True

    # Each line of the hash file contains a separate file hash. Compare
    # the current file hashes with the new file hashes to see if there is a
    # difference.
    # NOTE(stephen): Intentionally not using a set here since it's possible
    # for an indexing job to index the same file twice on purpose.
    cur_file_hash = sorted(FileUtils.FileContents(cur_hash_file).split('\n'))
    new_file_hash = sorted(compute_file_hash(f) for f in files)
    return cur_file_hash != new_file_hash


def store_task_hash(
    files: List[str],
    datasource_name: str,
    datasource_version: str,
    task_hash_dir: str,
):
    '''Store a task hash that represents the files that are indexed in a datasource.'''
    hash_filename = get_hash_storage_path(
        datasource_name, datasource_version, task_hash_dir
    )
    pathlib.Path(os.path.dirname(hash_filename)).mkdir(parents=True, exist_ok=True)
    with open(hash_filename, 'w') as hash_file:
        hash_file.write('\n'.join(sorted(compute_file_hash(f) for f in files)))


def run_task(
    task_definition: dict,
    index_url: str,
    dry_run: bool = False,
) -> Optional[str]:
    '''Kick off a new indexing task. Return the task ID if the task was started
    successfully.
    '''
    # If this is a dry-run, change the task type to "noop" to skip
    # building a new datasource.
    if dry_run:
        task_definition['type'] = 'noop'

    LOG.debug('Task definition: %s', json.dumps(task_definition, indent=2))

    r = requests.post(index_url, json=task_definition)
    if not r.ok:
        LOG.error('Failed to start task. Reason: %s', r.reason)
        return None
    return r.json()['task']


def build_datasource_name(
    deployment_name: str, datasource_name_override: Optional[str] = None
) -> str:
    '''Create the datasource name to use when building the indexing task.'''
    if datasource_name_override:
        return datasource_name_override

    return SiteDruidDatasource(deployment_name, datetime.datetime.today()).name


def _validate_file_path(path):
    error_str = ''
    if not path:
        error_str = 'Path cannot be empty.'
    elif path[0] != '/':
        error_str = 'Absolute path must be specified.'
    elif not os.path.exists(path):
        error_str = 'Path must exist.'

    if error_str:
        raise BadIndexingPathException(f'{error_str} Path: {path}')


def build_files_to_index(input_paths: List[str]) -> List[str]:
    '''Given a list of filesystem paths or globs, build a list containing the absolute
    path on the filesystem to all input files referenced. If the path string is a glob,
    resolve the glob first before updating the paths. If the path string is a relative
    path, the user's current working directory will be used to compute the absolute
    path.
    '''
    full_paths = set()
    cwd = os.getcwd()

    for input_path in input_paths:
        absolute_paths = glob(os.path.abspath(os.path.join(cwd, input_path)))
        for absolute_path in absolute_paths:
            _validate_file_path(absolute_path)
            full_paths.add(absolute_path)

    if not full_paths:
        raise BadIndexingPathException('No matching paths found for indexing!')
    return sorted(full_paths)


def write_task_metadata(
    datasource_name: str,
    datasource_version: str,
    task_id: str,
    datasource_name_file: Optional[str] = None,
    datasource_version_file: Optional[str] = None,
    task_id_file: Optional[str] = None,
):
    '''Convenience method for writing various metadata pieces about the task being run
    to output files. Each output file will contain a single line containing its
    corresponding data.

    TODO(stephen, david): If we need more task information, we should add it as a single
    flag and file rather than having the multiple flags we have here.
    '''
    if datasource_name_file:
        FileUtils.CreateFileWithData(datasource_name_file, datasource_name)

    if datasource_version_file:
        FileUtils.CreateFileWithData(datasource_version_file, datasource_version)

    if task_id_file:
        FileUtils.CreateFileWithData(task_id_file, task_id)
