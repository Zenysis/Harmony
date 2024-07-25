import shutil

from subprocess import Popen, PIPE

from pylib.base.term_color import TermColor
from pylib.file.file_utils import FileUtils

PIPELINE_OUT_DIR = FileUtils.GetAbsPathForFile('pipeline/out')
HAS_FD_SUPPORT = shutil.which('fd')


def fd_search(file_filters=None, restrict_recency=True):
    '''Use the `fd` (https://github.com/sharkdp/fd) third-party utility for quickly
    finding files in a directory tree.
    '''
    args = ['--full-path', '--no-ignore', '--type file']
    pattern = '.'
    if restrict_recency:
        # Limit the results to only files that have been modified in the last week.
        args.append('--changed-within 1week')
    if file_filters:
        # Combine the filters into a single filter to speed up searching.
        pattern = '|'.join(file_filters)
        args.append('--ignore-case --regex')

    full_args = ' '.join(args)
    return f'fd {full_args} {pattern} "{PIPELINE_OUT_DIR}"'


def find_search(file_filters=None, restrict_recency=True):
    '''Use the system `find` utility for finding files in the directory tree.'''
    args = ['-type f']
    if restrict_recency:
        # Limit the results to only files that have been modified in the last week.
        args.append('-mtime -7')
    if file_filters:
        # Combine the filters into a single filter to speed up searching.
        for file_filter in file_filters:
            args.append(f'-iregex ".*{file_filter}.*"')

    full_args = ' '.join(args)
    return f'find -H "{PIPELINE_OUT_DIR}" {full_args}'


def run_search(command, max_files=-1):
    process = Popen(command, shell=True, stdout=PIPE, encoding='utf-8')
    files = []
    limit_files = max_files and max_files > 0

    # NOTE: Prefer iterating over `process.stdout.readline` because it will
    # allow us to read results as they are streamed in by the command. Certain pipeline
    # machines have a huge pipeline/out dir, so waiting for every single file to be
    # enumerated can take a really long time.
    for i, filename in enumerate(iter(process.stdout.readline, '')):
        if limit_files and i >= max_files:
            # pylint: disable=line-too-long
            TermColor.Warning(
                'Max file count reached. Consider refining your filters to limit results and improve performance.'
            )
            break

        files.append(filename.strip())

    # Close the process.
    # pylint: disable=broad-except
    try:
        process.terminate()
    except OSError as e:
        # Errno 3 indicates the process was already killed
        if e.errno != 3:
            process.kill()
    except Exception:
        # Something unknown prevented the process from being terminated safely.
        process.kill()

    # Pipeline file paths generally have a date included in them. Sort in reverse so
    # that we can get roughly the newest files listed first.
    return sorted(files, reverse=True)


def search_pipeline_files(file_filters=None, max_files=30000):
    '''Search the pipeline out dir for files that match the filters. Limit the maximum
    number of files returned (disable by setting to a value <= 0).
    '''

    # Build the shell command for searching for matching files. Restrict the recency
    # of the files to 1 week if there is no regex filter to speed up searching and
    # limit the total number of files to process.
    # TODO: Expose this as an argument and add as a separate command line flag
    # to pview so that the user can change it if needed.
    restrict_recency = bool(file_filters)

    # Prefer the `fd` command over the native `find` command since it is much faster.
    command_builder = fd_search if HAS_FD_SUPPORT else find_search
    return run_search(command_builder(file_filters, restrict_recency), max_files)
