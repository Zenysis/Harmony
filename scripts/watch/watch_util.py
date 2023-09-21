from subprocess import call, CalledProcessError, check_output, PIPE, Popen, STDOUT
from typing import Iterable
import platform
import os

from pylib.file.file_utils import FileUtils


CWD = FileUtils.GetSrcRoot()


def default_line_processor(line_iterator: Iterable[str]) -> Iterable[str]:
    '''Print and return all the lines accessible through the iterator.'''
    return line_iterator


def script_already_running(script_name: str) -> bool:
    '''Detect if this script has already been started.'''
    pid_str = check_output(f'pgrep -af "{script_name}"', shell=True, text=True)
    if platform.system() == 'Darwin':
        pids = pid_str.strip().split('\n')
        # Capture all process IDs that match this script name.
        # There should only be one pid for this script and it should be OURS.
        return not (len(pids) == 1 and int(pids[0]) == os.getpid())
    if platform.system() == 'Linux':
        pid_line = pid_str.strip().split('\n')
        pids = []
        for line in pid_line:
            pid, name = line.split(' ', 1)
            if name.find('python') > -1:
                pids.append(pid)
        # There should only be one pid for this script and it should be OURS.
        return not (len(pids) == 1 and int(pids[0]) == os.getpid())
    return False


# TODO: You've created yet another bespoke general process running
# function that should live somewhere else.
def run_command(
    command, check_call=True, line_processor: Iterable[str] = default_line_processor
):
    '''Run the specified command and return the return code.

    If a non-zero return code is returned and check_call is True, raise a
    CalledProcessError that contains the return code and the combined stdout and
    stderr data.

    Args:
        command: Shell command to execute.
        check_call: Throw an exception if the return code is nonzero.
    '''
    # If we are checking the return code, then we need to capture and save
    # stdout and stderr so that it can be included in the raised error if
    # the return code is non-zero.
    with Popen(
        command, shell=True, cwd=CWD, stdout=PIPE, stderr=STDOUT, bufsize=1, text=True
    ) as process:

        # Create an iterator over the stdout data so that we can print each line
        # that comes in.
        output_iter = iter(process.stdout.readline, '')
        # Capture the stdout and stderr data in case an exception is raised.
        lines = []
        # Need to wrap this in a try/except so that we still kill the process
        # before raising the exception.
        try:
            # Continuously print stdout and stderr while also capturing the results
            # for additional processing.
            while process.poll() is None:
                lines.extend(line_processor(output_iter))

            # Capture any last printed lines
            lines.extend(line_processor(output_iter))
        except:
            process.kill()
            raise

        process.stdout.close()
        exit_code = process.poll()
    if check_call and exit_code:
        output = ''.join(lines)
        raise CalledProcessError(exit_code, command, output)

    return (exit_code, lines)


def exec_ignore_exception(func, exception_type, count=0, max_catch=5):
    '''Execute the specified function and ignore any matching exceptions raised.

    If the same exception is raised 'max_catch' times, allow it to go through
    and quit.
    NOTE: There may be a way to do this with signal handlers.
    '''
    try:
        func()
    except exception_type:
        count += 1
        if count > max_catch:
            raise
        exec_ignore_exception(func, exception_type, count, max_catch)


class TermWriter:
    '''An experimental class for writing lines directly to the terminal. Includes
    support for terminal manipulation through the use of ASCII control codes but is
    simpler to use than `curses`.
    '''

    @staticmethod
    def write(line: str):
        '''Write the provided line to the terminal at the current cursor position.'''
        # Write the line directly to stdout (file descriptor = 1). Avoid writing the
        # final newline since we need to clear the previously written characters.
        has_newline = line.endswith('\n')
        if has_newline:
            line = line[:-1]

        # Clear everything at the end of this line from the terminal.
        os.write(1, line.encode('utf-8'))
        os.write(1, b'\033[K')
        if has_newline:
            os.write(1, b'\n')

    @staticmethod
    def move_to_terminal_start():
        '''Move the cursor to the start of the terminal (coordinate 0,0).'''
        os.write(1, b'\033[0;0H')

    @staticmethod
    def move_to_line_start():
        '''Move the cursor to the start of the current line.'''
        os.write(1, b'\033[0G')

    @staticmethod
    def clear_after_cursor():
        '''Clear from the current cursor position through to the end of the screen.
        This is useful for clearing previously drawn text at those positions.
        '''
        os.write(1, b'\033[0J')

    @staticmethod
    def clear_scrollback():
        '''Remove any lines that can be scrolled to.'''
        os.write(1, b'\033[3J')

    @staticmethod
    def clear_screen():
        '''Clear all text from the screen and reset the cursor position to 0,0.'''
        # pylint: disable=anomalous-backslash-in-string
        call('clear && printf "\e[3J"', shell=True)
        TermWriter.move_to_terminal_start()

    @staticmethod
    def start():
        '''Clear the screen and make the user's cursors invisible.'''
        TermWriter.clear_screen()
        call('tput civis', shell=True)

    @staticmethod
    def stop():
        '''Reverse any terminal changes made by TermWriter. Re-enable the user's cursor.'''
        call('tput cnorm', shell=True)
