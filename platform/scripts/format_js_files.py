#!/usr/bin/env python
import glob
import platform
import os
import re
import sys

from subprocess import CalledProcessError, check_output, PIPE, Popen
from threading import Lock

from concurrent import futures
from pylib.base.flags import Flags
from pylib.base.term_color import TermColor
from pylib.file.file_utils import FileUtils

STAGED_FILE_CMD = 'git diff --name-only --cached --diff-filter="ACM"'
# NOTE: Temporarily disabling formatting of css files as it is causing
# lots of bugs:
# SUPPORTED_EXTENSIONS = ('.js', '.jsx', '.scss')
SUPPORTED_EXTENSIONS = ('.js', '.jsx')

STDERR_LOCK = Lock()
STDOUT_LOCK = Lock()

HAS_NC_QUIET_SUPPORT = platform.system() != 'Darwin'
SRC_ROOT = FileUtils.GetSrcRoot()
LARGE_LINE_PATTERN = re.compile('.{81,}')
STYLELINT_CONFIG = os.path.join(SRC_ROOT, '.stylelintrc')

# NOTE: Need to remove `npm*` environment variables since they cause
# our process searching (using `pgrep -f` or `pkill -f`) to be more difficult.
# The `-f` flag means search the entire process name *and* arguments. Sometimes
# the envoriment variables will show up in the arguments for the daemons (not
# sure how...) and it causes undefined behavior.
SUBPROCESS_ENV = {
    key: value for key, value in os.environ.items() if not key.startswith('npm')
}


# TODO Temporarily ignoring files that store translated text because
# prettier/eslint formatting sometimes alters non-ASCII characters — figure
# out root problem and simplify ignore condition back to "__generated__"
def file_to_ignore(filepath):
    locale_files = glob.glob(f'{SRC_ROOT}/web/client/locales/*.js')
    abs_file = FileUtils.GetAbsPathForFile(filepath)
    return (
        '__generated__' in abs_file
        or abs_file.endswith('/i18n.js')
        or abs_file in locale_files
    )


def filter_ignored_files(file_list):
    return [f for f in file_list if not file_to_ignore(f)]


# Return the list of JS files staged for commit.
def get_staged_files():
    files_str = check_output(STAGED_FILE_CMD, shell=True, text=True)
    file_list = files_str.strip().split('\n')
    return [
        FileUtils.GetAbsPathForFile(
            f
        )  # The git command returns a repo-root relative path
        for f in file_list
        if f.endswith(SUPPORTED_EXTENSIONS)
    ]


# This method is similar to subprocess.check_output but returns stdout and
# stderr.
# TODO: This is a more general utility that can live somewhere else.
# NOTE: Intentionally specifying the src root as the CWD so that esoteric
# changes on different dev machines won't ruin things.
def run_command(command, shell=False):
    process = Popen(
        command,
        shell=shell,
        stdout=PIPE,
        stderr=PIPE,
        executable='/bin/bash',
        env=SUBPROCESS_ENV,
        cwd=SRC_ROOT,
        text=True,
    )
    (stdout, stderr) = process.communicate()
    retcode = process.poll()
    if retcode:
        error_output = f'Stdout:\n{stdout}\n\nStderr:\n{stderr}'
        raise CalledProcessError(retcode, command, output=error_output)
    return (stdout, stderr)


# Prefix each line of the input string with a tag
def tag_lines(input_str, tag):
    if not tag:
        return input_str

    lines = [f'{tag}:\t{s}' for s in input_str.strip().split('\n')]
    return '\n'.join(lines)


# Compute the absolute path for the input filename. Follow the behavior of
# FileUtils.GetAbsPathForFile, and if no file is found, use the alternate
# cwd supplied to find the absolute path.
def _resolve_path(input_filename, cwd):
    filename = FileUtils.GetAbsPathForFile(input_filename)
    if not filename:
        # Attempt absolute path resolution using the specified cwd
        new_path = os.path.normpath(os.path.join(cwd, input_filename))
        filename = FileUtils.GetAbsPathForFile(new_path)
    return filename


# Helper function for writing a message to stderr with an optional tag
def _write_stderr(input_str, tag=None):
    message = tag_lines(input_str, tag).strip()
    with STDERR_LOCK:
        sys.stderr.write(message)
        sys.stderr.write('\n')
        sys.stderr.flush()


# Create a filename separator of the form:
# -------
# filename
# -------
def _build_filename_separator(filename):
    pretty_filename = FileUtils.FromAbsoluteToRepoRootPath(filename)
    break_str = '-' * 80
    return f'{break_str}\n{pretty_filename}\n{break_str}\n'


# Print a pretty warning to help the end-user fix the filenames supplied.
def _print_missing_file_warning(input_filename):
    warning = f'File path cannot be resolved: {input_filename}'
    # Provide yarn specific warning if that is how the script was run.
    if os.getenv('npm_config_user_agent'):
        # Yarn changes the cwd to be the location of the package.json file
        # (the repo-root in our case). This can cause absolute path resolution
        # to fail.
        warning += (
            '\n"yarn format" only supports absolute paths and relative '
            'paths from the repo-root. Either rerun "yarn format" with '
            'absolute paths or use the --working_dir flag to aid '
            'relative path resolution.'
        )
    TermColor.Warning(warning)


# Ensure the input files exist
def _validate_filenames(filenames):
    for filename in filenames:
        assert os.path.exists(filename), f'File does not exist: {filename}'


def _detect_if_changed(filename, formatted_result):
    '''Test if the prettier formatting has changed the file vs the original.

    NOTE: Pulled into separate function in case of performance regression.
    '''
    original_text = FileUtils.FileContents(filename)
    return original_text != formatted_result


def build_netcat_command(port, token, filename, daemon_args=''):
    nc_args = f'127.0.0.1 {port}'
    if HAS_NC_QUIET_SUPPORT:
        nc_args = f'-q 0 {nc_args}'

    return f'cat <(echo "{token} {SRC_ROOT} {daemon_args}") "{filename}" | nc {nc_args}'


def start_daemon(name):
    daemon = FileUtils.GetAbsPathForFile(f'node_modules/.bin/{name}')
    (_, stderr) = run_command(
        f'(pkill -xf {name} || true) && {daemon} start', shell=True
    )
    if stderr.strip():
        _write_stderr(f'Unexpected response when starting {name}: {stderr}')
        return
    _write_stderr(f'{name} started')


def should_start_daemon(name):
    config_file = os.path.expanduser(f'~/.{name}')
    if not os.path.exists(config_file):
        return True

    (stdout, _) = run_command(f'pgrep -f "{name}" | grep -v "^$$" || true', shell=True)
    pid_response = stdout.strip()
    if not pid_response:
        return True
    pids = pid_response.split('\n')

    # Need to reinitialize the daemon if there is not exactly one version
    # running. If there are somehow multiple daemons running, reinitializing
    # will kill them before starting a single copy again.
    return len(pids) != 1


def read_daemon_config(name, force_start=False):
    if force_start or should_start_daemon(name):
        start_daemon(name)

    # Returns (port, secret token)
    return FileUtils.FileContents(os.path.expanduser(f'~/.{name}')).split(' ')


class PrettierEslint:
    '''Wrapper class for calling prettier + eslint from the command line.'''

    def __init__(self, write=False):
        self._initialize_daemons()
        # Write the code formatting results directly to the file
        self.write = write

        # Whether to print the filename to stdout when results are not written
        # to a file.
        self._include_filename_in_stdout = False

        # Track if the daemons had to be restarted during the formatting of files.
        self._force_restarted_daemons = False

    def _initialize_daemons(self, force_start=False):
        (self.prettier_port, self.prettier_token) = read_daemon_config(
            'prettier_d', force_start
        )
        (self.eslint_port, self.eslint_token) = read_daemon_config(
            'eslint_d', force_start
        )

    def _build_prettier_command(self, filename):
        parser = 'scss' if filename.endswith('scss') else 'babylon'
        # NOTE: Using pkg-conf instead of config arg since the version of
        # prettier_d we use merges in its own config which is super annoying.
        daemon_args = f'--pkg-conf --stdin {filename} --parser {parser}'
        return build_netcat_command(
            self.prettier_port, self.prettier_token, filename, daemon_args
        )

    def _build_eslint_command(self, filename):
        daemon_args = f'--stdin --stdin-filename {filename} --fix-to-stdout'
        return build_netcat_command(
            self.eslint_port, self.eslint_token, '-', daemon_args
        )

    # NOTE: Add stylelint support into the chain so that we can start
    # formatting scss files. Deciding to do it in this less clean way because we need to
    # have scss formatting set up sooner than later.
    def _build_stylelint_command(self, filename):
        daemon_args = f'--config "{STYLELINT_CONFIG}" --stdin --fix --file "{filename}"'
        binary = FileUtils.GetAbsPathForFile(f'node_modules/.bin/stylelint_d')
        # NOTE: Ensure the stylelint command never produces a non-zero exit
        # code. The stylelint daemon will exit 2 if there are lint errors and there is
        # no way to skip this. We only want the fixes anyways. When the daemon exits 2
        # then there is an actual error with constructing the request.
        return f'"{binary}" {daemon_args} || test $? -ne 1'

    # Format the given file in a thread-safe manner. This method assumes
    # filename validation has already been performed.
    def _format_file(self, filename, check_eslint_fix=True, is_retry=False):
        pretty_filename = FileUtils.FromAbsoluteToRepoRootPath(filename)
        _write_stderr('Formatting started', pretty_filename)

        cmd = self._build_prettier_command(filename)

        # NOTE: Just jam stylelint into the same command building section.
        is_scss = filename.endswith('scss')
        if is_scss:
            cmd = f'{cmd} | {self._build_stylelint_command(filename)}'
        elif check_eslint_fix:
            cmd = f'{cmd} | {self._build_eslint_command(filename)}'
        (stdout, stderr) = run_command(cmd, shell=True)

        # If any stderr content exists, write it since prettier_d and eslint_d
        # do not have standardized error messages.
        if stderr:
            _write_stderr(stderr, pretty_filename)

        # Cowardly refuse to write empty results since we don't want to
        # erase a file. Detect certain error cases of the eslint/prettier daemons where
        # node_modules has changed since the daemon last restarted and the daemon can
        # no longer find files it needs.
        if (
            # This error occurs if eslint_d is in a bad state.
            ('ENOENT: no such file or directory' in stdout and 'node_modules' in stdout)
            # This error occurs if stylelint cannot format the result (either because
            # prettier_d didn't produce a valid result or there is an existing syntax
            # error).
            or (is_scss and ('✖' in stdout or 'web/public/scss' in stdout))
        ):
            # Only kill the daemons and attempt to reformat once. Cowardly fail if we
            # still cannot format to avoid infinite recursion.
            if is_retry:
                _write_stderr(
                    f'Daemon still in a bad state. Skipping. Message: {stdout}',
                    pretty_filename,
                )
                return

            # Restart the eslint/prettier daemons because node_modules has changed in a
            # way that can only be resolved through restart.
            _write_stderr(
                'Error formatting file. Daemon in bad state. Restarting daemons.',
                pretty_filename,
            )

            # Ensure only one thread triggers a daemon restart.
            if not self._force_restarted_daemons:
                self._force_restarted_daemons = True
                self._initialize_daemons(True)

            # Once the daemons have been restarted, we should be able to successfully
            # format the file again.
            self._format_file(filename, check_eslint_fix, True)
        elif not stdout or '# exit 1' in stdout:
            _write_stderr('Empty result returned. Skipping.', pretty_filename)
        else:
            # We successfully formatted the file. Handle the output.
            _write_stderr('Successfully formatted', pretty_filename)
            self._handle_formatted_result(filename, stdout, check_eslint_fix)

    def _handle_formatted_result(self, filename, result, check_eslint_fix):
        assert result, f'No formatted result provided for file: {filename}'

        # NOTE: Stylelint for some reason produces two newlines at the end
        # of its output when formatting a file over stdin. I don't know why.
        if filename.endswith('scss') and result.endswith('\n\n'):
            result = result[:-1]

        # Store the formatted results in the same file if we are writing,
        # otherwise print them to stdout.
        if self.write:
            # Only write the output if the file has actually changed. This will prevent
            # webpack/flow from having to rerun over an unchanged file since they watch
            # file modified timestamps.
            if _detect_if_changed(filename, result):
                FileUtils.CreateFileWithData(filename, result)

            # ** Extra step when writing that differs from the stdout version.
            # Sometimes, a rule that eslint can fix will produce a line that
            # violates the eslint style guide. For instance, eslint can fix the
            # 'arrow-body-style' rule, but it might produce a line that is
            # greater than the max-line length. To work around this, we process
            # the file one extra time so that prettier can clean up the
            # fixes that eslint applied.
            # NOTE: Only checking for line length > 80 right now.
            if check_eslint_fix:
                large_lines = LARGE_LINE_PATTERN.findall(result)
                # Find if any lines that are *not* imports are > 80 chars.
                if any(
                    not line.startswith(('import ', '} from \''))
                    for line in large_lines
                ):
                    self._format_file(filename, False)
        else:
            # Grab a lock on stdout since we could be called in a threaded
            # context.
            with STDOUT_LOCK:
                if self._include_filename_in_stdout:
                    sys.stdout.write(_build_filename_separator(filename))
                sys.stdout.write(result)
                sys.stdout.write('\n')
                sys.stdout.flush()

    # Format a single js file
    def format_file(self, input_filename):
        self.format_files([input_filename])

    # Format multiple js files concurrently.
    def format_files(self, input_files):
        filenames = [FileUtils.GetAbsPathForFile(f) for f in input_files]
        # NOTE: Validating filenames here instead of inside
        # _format_file since we want to skip file formatting if any of the
        # filenames supplied do not exist.
        _validate_filenames(filenames)

        # If only one file is supplied, there is no need to create a thread pool
        if len(filenames) == 1:
            self._format_file(filenames[0])
            return

        # Since we are writing multiple files, include the filename in stdout
        # (only matters if we are not writing the results to a file).
        self._include_filename_in_stdout = True

        # Process each file on a different thread
        with futures.ThreadPoolExecutor(max_workers=20) as thread_pool:
            task_to_filename = {}
            for filename in filenames:
                task = thread_pool.submit(self._format_file, filename)
                task_to_filename[task] = filename

            for task in futures.as_completed(task_to_filename):
                filename = task_to_filename[task]
                try:
                    # Detect exceptions raised when running the thread
                    _ = task.result()
                except Exception as e:  # pylint: disable=broad-except
                    _write_stderr(
                        'Exception raised when processing %s\n'
                        '%s: %s' % (filename, type(e).__name__, e)
                    )

        self._include_filename_in_stdout = False


def main():
    Flags.PARSER.add_argument(
        'files',
        type=str,
        nargs='*',
        help='JS files to format. Defaults to the set of ' 'files staged for commit.',
    )
    Flags.PARSER.add_argument(
        '--write', default=False, action='store_true', help='Edit the files in-place'
    )
    Flags.PARSER.add_argument(
        '--working_dir',
        default=os.getenv('INIT_CWD'),
        help='Alternate working directory to resolve ' 'file paths from.',
    )
    Flags.InitArgs()

    input_files = set(filter_ignored_files(Flags.ARGS.files or get_staged_files()))
    if not input_files:
        TermColor.Warning(
            'Could not find any JS files to format. Either '
            'specify the files to format or stage them for '
            'commit.'
        )
        return 0

    # Resolve the absolute path for the files to be formatted.
    files = []
    for input_filename in input_files:
        filename = _resolve_path(input_filename, Flags.ARGS.working_dir)
        if not filename or not os.path.exists(filename):
            _print_missing_file_warning(input_filename)
            return 1
        files.append(filename)

    prettier_eslint = PrettierEslint(write=Flags.ARGS.write)
    prettier_eslint.format_files(files)
    return 0


if __name__ == '__main__':
    sys.exit(main())
