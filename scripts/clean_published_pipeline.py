#!/usr/bin/env python
from builtins import input
import datetime
import os
import shutil
import sys

from pylib.base.flags import Flags

from util.file.directory_util import compute_dir_hash, equal_dir_content

DRUID_SHARED_FOLDER = os.environ.get('DRUID_SHARED_FOLDER', '/home/share')

# Base directory of where to begin search.
MAIN_DIR = f'{DRUID_SHARED_FOLDER}/data'

# Directories to whitelist
WHITELIST_DIRS = set(['current'])

# List of directories in the published directories.
VALID_PUBLISH_DIRS = os.listdir(MAIN_DIR)


def main():
    Flags.PARSER.add_argument(
        '--publish_dir',
        type=str,
        default='',
        required=True,
        help='Deployment directory to deduplicate.',
    )
    Flags.PARSER.add_argument(
        '--force',
        default=False,
        action='store_true',
        help='Setting this arg to true enables file' 'deletion',
    )
    Flags.InitArgs()

    publish_dir = Flags.ARGS.publish_dir
    if publish_dir not in VALID_PUBLISH_DIRS:
        print('No deployment name specified or invalid name.')
        return 0
    print('Starting datasource deduplication...\n\n')

    main_path = os.path.join(MAIN_DIR, Flags.ARGS.publish_dir)
    subpaths = os.listdir(main_path)
    log_file_name = '/tmp/%s_%s.log' % (
        publish_dir,
        datetime.datetime.today().strftime('%Y%m%d'),
    )
    with open(log_file_name, 'w') as log_file:
        for subpath in subpaths:
            subdir_path = os.path.join(main_path, subpath)
            if os.path.isdir(subdir_path):
                duplicates = get_duplicate_folders(subdir_path, log_file)
                if Flags.ARGS.force and duplicates:
                    print('Files set to be deleted')
                    print(duplicates)
                    print('\n\nConfirm deletion (y/n)?')
                    prompt_response = eval(input())
                    prompt_response = prompt_response.lower()
                    if prompt_response != 'y':
                        print('Processing ending without deletion')
                        continue
                    for directory in duplicates:
                        shutil.rmtree(directory)


def get_duplicate_folders(subdir_path, log_file):
    '''
    Returns a list of directories that have same content of files and same hash.
    This is done by using a head_hash and head_dir_content. When a head_hash or
    directory content differs from the current head, that folder becomes the
    head to check future folders.
    We use a head hash because we want to only detect hashes that are generated
    repetitively over a period of time.

    Example:
        20180101/
        20180102/
        20180105/
        20180106/

        20180101, 20180102, and 20180106 are duplicates. We only want to delete
        20180102 to reduce confusion when rebuilding a datasource.
    '''
    print(f'Processing {subdir_path}')
    subpath_dirs = sorted(os.listdir(subdir_path))
    head_dir = os.path.join(subdir_path, subpath_dirs[0])
    head_dir_hash = compute_dir_hash(head_dir)
    duplicate_dirs = []
    log_file.write(f'Starting duplication detection process for {subdir_path} \n')
    log_file.write(f'{head_dir}\n')

    for subpath in subpath_dirs[1:]:
        if subpath in WHITELIST_DIRS:
            continue
        curr_dir = os.path.join(subdir_path, subpath)
        dir_equality = equal_dir_content(head_dir, curr_dir)

        if not dir_equality:
            head_dir = curr_dir
            head_dir_hash = compute_dir_hash(head_dir)
            log_file.write(f'{head_dir}\n')
            continue

        curr_dir_hash = compute_dir_hash(curr_dir)
        if curr_dir_hash != head_dir_hash:
            head_dir = curr_dir
            head_dir_hash = curr_dir_hash
            log_file.write(f'{head_dir}\n')
        else:
            log_file.write(f'\tDuplicate folder detected: {curr_dir}\n')
            duplicate_dirs.append(curr_dir)
    print(f'Finished with {len(duplicate_dirs)} duplicate folders found\n')
    return duplicate_dirs


if __name__ == '__main__':
    sys.exit(main())
