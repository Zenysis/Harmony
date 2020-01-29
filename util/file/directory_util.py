import os
import subprocess

from pylib.file.file_utils import FileUtils

FILE_HASH_COMMAND = 'shasum "%s" | cut -f1 -d" "'

# Compute a reasonably accurate file hash for gzip files by combining
# the CRC-32 hash and the uncompressed file size
GZIP_HASH_COMMAND = 'gzip -lv "%s" | awk \'BEGIN {OFS="|"} (NR==2) { print $2,$7 }\''


def _validate_dir_path(path):
    '''
    Validates if a given file path is a directory path and that the directory
    is not the root path.
    '''
    assert os.path.isdir(path) and os.path.realpath(path) != '/', (
        'Invalid directory provided: %s' % path
    )


def compute_file_hash(filename):
    '''
    Compute a reliable hash for the given file.
    '''
    assert os.path.isfile(filename), 'Invalid file: %s' % filename
    base_cmd = FILE_HASH_COMMAND
    # Special case for gzip files since two gzip files with the same content
    # will have different sha hashes. Use the internal CRC hash computed during
    # gzipping
    if filename[-3:] == '.gz':
        base_cmd = GZIP_HASH_COMMAND
    return subprocess.check_output(base_cmd % filename, shell=True, text=True).strip()


def compute_dir_hash(selected_dir):
    '''
    Returns a string representing the hash of the contents of the directory.
    Note: The resulting hash is solely based on the hash of the contents
    of the directory and not on any file metadata (creation date, modified
    date, etc..).
    '''
    _validate_dir_path(selected_dir)
    res = []
    for dir_file in FileUtils.GetFilesInDir(selected_dir):
        rel_path = os.path.relpath(dir_file, selected_dir)
        # Include relative file path as part of hash string since multiple
        # files in a directory could compute to the same hash.
        res.append('%s\t%s' % (rel_path, compute_file_hash(dir_file)))
    # Sort the computed hashes so that the directory hash is
    # stable and doesn't rely on the order the system returns files.
    return ''.join(sorted(res))


def equal_dir_content(dir_a, dir_b):
    '''
    Shallow file check. Solely compares if all filenames in both directories
    are equivalent.
    NOTE(vinh): The name equal_dir_content could be interpreted as 'exact'
    files, do we also check not just for name but for file hash as well? Or
    is that doing too much?
    '''
    _validate_dir_path(dir_a)
    _validate_dir_path(dir_b)
    dir_a_files = set(os.path.relpath(f, dir_a) for f in FileUtils.GetFilesInDir(dir_a))
    dir_b_files = set(os.path.relpath(f, dir_b) for f in FileUtils.GetFilesInDir(dir_b))
    return dir_a_files == dir_b_files
