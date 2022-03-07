# Exposing certain unix utilities to python
from builtins import object
import os
import tempfile

from subprocess import CalledProcessError, check_call, PIPE, Popen

# Create a named pipe in a temporary directory that can be used like a file
class NamedPipe(object):
    def __init__(self, pipe_name='pipe'):
        self.path = None
        self._tmp_dir = None
        self._safe_create(pipe_name)

    # Return the path name directly since the full object is not very useful
    # when a context manager is used
    def __enter__(self):
        return self.path

    def __exit__(self, *args):
        self.close()

    # Cleanup the temporary files that have been created
    def close(self):
        if os.path.exists(self._tmp_dir):
            check_call(['rm', '-r', self._tmp_dir])

    # Wrap pipe creation in an exception handler so that file cleanup
    # always happens
    def _safe_create(self, pipe_name):
        try:
            self._tmp_dir = tempfile.mkdtemp()
            self.path = os.path.join(self._tmp_dir, pipe_name)
            os.mkfifo(self.path)
        except Exception:
            self.close()
            raise


# Create a managed background process that will be cleaned up and terminated
# if the context is exited
class BackgroundProcess(object):
    def __init__(self, command, check_exit_code=True):
        self.command = command
        self.process = Popen(self.command, shell=True, stderr=PIPE)
        self._check_exit_code = check_exit_code

    def __enter__(self):
        return self

    def __exit__(self, exception_type, exception_value, exception_traceback):
        # Don't swallow exceptions that were raised upstream
        if exception_type:
            # Disable exit code checking since an exception was raised
            self._check_exit_code = False
        self.finalize(bool(exception_type))

    # Clean up the created process. If the exit code is nonzero and the caller
    # cares, raise an exception. If the process was not terminated before the
    # context was exited, send SIGTERM and SIGKILL to the process to terminate
    # it and raise an exception
    def finalize(self, triggered_by_exception=False):
        if not self.process:
            return

        exit_code = self.process.poll()
        has_exited = exit_code is not None

        # If the process has exited, and it was either successful or the
        # caller doesn't care about nonzero exit codes, return
        if exit_code == 0 or (has_exited and not self._check_exit_code):
            return

        # If the exit code is nonzero, report the errors to the caller
        if has_exited:
            raise self._build_error()

        # If the process has not exited on its own, it should be terminated.
        try:
            self.process.terminate()

            # It is normal for us to need to terminate the process if an
            # exception was raised in the user's context managed block.
            if triggered_by_exception:
                return

            # If the process terminated succesfully and we are not intentionally
            # terminating the process because an exception was raised inside the
            # user's context managed block, raise an error to show the user the
            # BackgroundProcess spawned did not close itself and was forced to
            # close.
            self._build_error()
        except OSError as e:
            # Errno 3 indicates the process was already killed
            if e.errno == 3:
                raise
        except Exception:  # pylint: disable=broad-except
            # Ignore other exceptions so that we continue trying to
            # kill the process
            pass

        # As a last resort, kill the process
        self.process.kill()

        # Still throw an error if killing was successful
        raise self._build_error()

    # Wait on process and handle any errors.
    def wait(self):
        try:
            self.process.wait()
        except subprocess.CalledProcessError as e:
            print('CalledProcessError output:', e.output.decode())
            raise self._build_error()

    # Compose an exception to be raised based on information about the process
    def _build_error(self):
        exit_code = self.process.poll()
        # Since process.communicate() is blocking, only read from stderr
        # if the process has terminated
        stderrdata = None
        if exit_code is not None:
            (_, stderrdata) = self.process.communicate()
        print('CalledProcessError:', self.command, stderrdata)
        return CalledProcessError(exit_code, self.command, stderrdata)
