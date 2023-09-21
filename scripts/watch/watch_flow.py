#!/usr/bin/env python
# Convenience script for automatically executing the flow binary each time a
# change is detected. This script watches the flow log file to piggyback on
# flow's file watchers which saves us from needing to understand which files
# flow is monitoring. Each time a change is detected, the screen is cleared and
# 'flow status' is executed.
import glob
import os
import sys
import time
from typing import Iterator
from pylib.base.flags import Flags

from datetime import datetime
from subprocess import CalledProcessError

from pylib.base.term_color import TermColor
from pylib.file.file_utils import FileUtils

from scripts.watch.watch_util import (
    exec_ignore_exception,
    run_command,
    script_already_running,
    TermWriter,
)

FLOW_BIN = FileUtils.GetAbsPathForFile('node_modules/.bin/flow')
FLOW_TMP_DIR = '/tmp/flow'
PROJECT_NAME = 'Harmony'

FILTER_MESSAGE = 'Please wait. Server is handling a request'
PROGRESS_ANIMATION = [b'|', b'/', b'-', b'\\']
PROGRESS_MESSAGES = (
    'Please wait. Server is initializing',
    'Please wait. Server is rechecking',
    'Please wait. Server is restarting',
)


def _capture_and_print(line_iterator: Iterator[str], continuous_scroll: bool = False):
    '''Print and return all the lines accessible through the iterator.'''
    output = []
    prev_line_progress_message = False
    for line in line_iterator:
        # Filter out some Flow messages that can be caused when calling `flow status`
        # while another operation (potentially from `flow lsp`) is running.
        if line.startswith(FILTER_MESSAGE):
            continue

        # Need to convert the line from bytes to a string.
        output.append(line)

        # NOTE: Simulate the normal progress drawing that `flow start` will
        # write if the session is a TTY. Since we're piping stdout, flow will sometimes
        # write individual lines instead of pretty messages. Prevent these progress
        # messages from printing on multiple lines and instead overwrite the previous
        # progress message each time as the server starts.
        is_progress_message = line.startswith(PROGRESS_MESSAGES)

        # If we change from a progress state to a non-progress state (or vice versa)
        # we should clear the terminal (only if `continuous_scroll` is False).
        if not continuous_scroll and prev_line_progress_message ^ is_progress_message:
            TermWriter.clear_screen()

        if is_progress_message:
            progress_char = PROGRESS_ANIMATION.pop(0)
            PROGRESS_ANIMATION.append(progress_char)
            # Strip off newline at end of string and add progress animation.
            line = f'{line[:-1]}: {progress_char}'
            TermWriter.move_to_line_start()

        TermWriter.write(line)
        prev_line_progress_message = is_progress_message

    return output


def run_flow_command(arguments, check_call=True, continuous_scroll: bool = False):
    '''Run the flow command with the provided arguments.

    Args:
        arguments: Command arguments to use when executing flow.
        check_call: Throw an exception if the return code is nonzero.
    '''
    command = f'"{FLOW_BIN}" {arguments}'
    return run_command(
        command,
        check_call,
        lambda line_processor: _capture_and_print(line_processor, continuous_scroll),
    )[0]


def stop_server():
    return run_flow_command('stop')


def refresh_status(continuous_scroll: bool = False):
    # Clear the screen so that only the latest results are shown (only if
    # `continuous_scroll` is set to False)
    if not continuous_scroll:
        TermWriter.move_to_terminal_start()
        TermWriter.clear_scrollback()
    run_flow_command(
        'status --show-all-branches --color always', False, continuous_scroll
    )
    status_line = '%s - %s\n' % (
        TermColor.ColorStr('Flow Updated', 'DARK_CYAN'),
        TermColor.ColorStr(datetime.now().strftime('%m/%d %H:%M:%S'), 'YELLOW'),
    )
    TermWriter.write(status_line)

    # If we are not supporting continuous scroll, then clear everything after
    # the current cursor position as well
    if not continuous_scroll:
        TermWriter.clear_after_cursor()


class FlowServer:
    def __init__(self, continuous_scroll: bool = False):
        '''
        Args:
            continuous_scroll (bool): the server will clear the terminal on every type-check
                by default. When this flag is set to True the terminal will continuously
                scroll instead of clearing.
        '''
        self.continuous_scroll = continuous_scroll
        self.log_file = None
        self.last_modified = None

    def update_if_changed(self):
        modified_time = os.stat(self.log_file).st_mtime
        if modified_time != self.last_modified:
            refresh_status(self.continuous_scroll)
            # Cache the modified time after the flow command has been executed
            # since it will modify the log file.
            self.last_modified = os.stat(self.log_file).st_mtime

    def start_flow_if_not_running(self):
        '''Try to start a new flow server. Detect the message shown when a flow server
        has already been started.
        '''
        try:
            run_flow_command('start')
        except CalledProcessError as e:
            if 'Error: There is already a server running' not in e.output:
                raise
        self.log_file = self.get_log_file()

    def run(self):
        '''Start a Flow server and continuously report the project status.'''
        self.start_flow_if_not_running()
        TermWriter.clear_screen()
        # Start a loop to watch the log file for changes. Break out if a
        # KeyboardInterrupt is receieved.
        # NOTE: Not using watchdog here since it had a lot of trouble
        # detecting changes to the log file on my machine.
        try:
            while True:
                self.update_if_changed()
                time.sleep(1)
        except KeyboardInterrupt:
            TermColor.PrintStr('Stopping Flow', 'YELLOW', False)
        finally:
            TermWriter.stop()
        exec_ignore_exception(stop_server, KeyboardInterrupt)

    @staticmethod
    def get_log_file():
        '''Find the current flow server's log file location.'''
        # Flow stores a single file with the .log suffix that holds the current
        # server's logs.
        log_glob = f'{FLOW_TMP_DIR}/*{PROJECT_NAME}*.monitor_log'
        log_files = glob.glob(log_glob)

        # There should be only one file with the .log suffix.
        assert (
            len(log_files) == 1
        ), f'Unable to find flow log file. Path tested: {log_glob}\nFiles found: {log_files}'

        return os.path.realpath(log_files[0])


def main():
    Flags.PARSER.add_argument(
        '--continuous_scroll',
        action='store_true',
        default=False,
        help='Use this flag to prevent the terminal from clearing on every type check',
    )
    Flags.InitArgs()

    if script_already_running(os.path.basename(__file__)):
        TermColor.Failure('Flow is already being watched in another window.')
        return 1

    # Start the flow server and watch for changes.
    TermWriter.start()
    server = FlowServer(continuous_scroll=Flags.ARGS.continuous_scroll)
    server.run()
    return 0


if __name__ == '__main__':
    sys.exit(main())
