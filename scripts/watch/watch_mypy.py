#!/usr/bin/env python
# Convenience script for automatically executing a mypy check each time a
# change is detected. This script makes use of the mypy daemon to do this. The
# mypy daemon caches the results from previous runs making further runs very
# fast. We simply poll the mypy daemon every second and if no changes have been
# made then it will just return the previous cached results.
from typing import List
import os
import time
import sys

from datetime import datetime
from subprocess import CalledProcessError
from pylib.base.flags import Flags

from pylib.base.term_color import TermColor

from scripts.watch.watch_util import (
    exec_ignore_exception,
    run_command,
    script_already_running,
    TermWriter,
)

last_mypy_output = None


def lists_are_equal(list_a: List[str], list_b: List[str]) -> bool:
    if len(list_a) != len(list_b):
        return False

    return all([list_a[i] == list_b[i] for i in range(len(list_a))])


def refresh_status(continuous_scroll: bool = False):
    output_lines = list(run_dmypy_command('run -- --config-file mypy.ini', False)[1])
    # pylint: disable=global-statement
    global last_mypy_output
    if last_mypy_output is None or not lists_are_equal(last_mypy_output, output_lines):
        write_output_to_terminal(output_lines, continuous_scroll)
        last_mypy_output = output_lines


def write_output_to_terminal(lines: List[str], continuous_scroll: bool = False):
    # Clear the screen so that only the latest results are shown (only if
    # `continuous_scroll` is set to False)
    if not continuous_scroll:
        TermWriter.move_to_terminal_start()
        TermWriter.clear_scrollback()
    for line in lines:
        TermWriter.write(line)
    status_line = '%s - %s\n' % (
        TermColor.ColorStr('Mypy Updated', 'DARK_CYAN'),
        TermColor.ColorStr(datetime.now().strftime('%m/%d %H:%M:%S'), 'YELLOW'),
    )
    TermWriter.write(status_line)

    # If we are not supporting continuous scroll, then clear everything after
    # the current cursor position as well
    if not continuous_scroll:
        TermWriter.clear_after_cursor()


def run_dmypy_command(arguments, check_call=True):
    '''Run the mypy daemon command with the provided arguments.

    Args:
        arguments: Command arguments to use when executing mypy.
        check_call: Throw an exception if the return code is nonzero.
    '''
    command = f'dmypy {arguments}'
    return run_command(command, check_call)


def stop_server():
    return run_dmypy_command('stop')[0]


def start_mypy_if_not_running():
    '''Try to start a new mypy server. Detect the message shown when a mypy server
    has already been started.
    '''
    try:
        run_dmypy_command('start')
    except CalledProcessError as e:
        if 'Error: There is already a server running' not in e.output:
            raise


def run_dmypy(continuous_scroll: bool = False):
    '''Start a Mypy server and continuously report the project status.
    Args:
        continuous_scroll (bool): the server will clear the terminal on every type-check
            by default. When this flag is set to True the terminal will continuously
            scroll instead of clearing.
    '''

    # NOTE: By default mypy disables colored outputs when it detects that
    # it is not outputting to an interactive terminal which happens here because
    # we capture and process the mypy output. This environment variable
    # overrides that.
    os.environ["MYPY_FORCE_COLOR"] = "1"

    start_mypy_if_not_running()

    if not continuous_scroll:
        TermWriter.clear_screen()

    # Start a loop to recheck mypy every second. Break out if a
    # KeyboardInterrupt is receieved.
    try:
        while True:
            refresh_status(continuous_scroll)
            time.sleep(1)
    except KeyboardInterrupt:
        TermColor.PrintStr('Stopping Mypy', 'YELLOW', False)
    finally:
        TermWriter.stop()
    exec_ignore_exception(stop_server, KeyboardInterrupt)


def main():
    Flags.PARSER.add_argument(
        '--continuous_scroll',
        action='store_true',
        default=False,
        help='Use this flag to prevent the terminal from clearing on every type check',
    )
    Flags.InitArgs()

    if script_already_running(os.path.basename(__file__)):
        TermColor.Failure('Mypy is already being watched in another window.')
        return 1

    TermWriter.start()
    run_dmypy(continuous_scroll=Flags.ARGS.continuous_scroll)
    return 0


if __name__ == '__main__':
    sys.exit(main())
