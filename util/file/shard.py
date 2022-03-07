from builtins import next
import glob
import os

from contextlib2 import ExitStack

from log import LOG


def fread(filename):
    return open(filename, 'r')


def fwrite(filename):
    return open(filename, 'w')


class ShardReader:
    '''A utility for iterating over lines from a set of sharded files.

    Files will be read in order of modification and each line will be returned
    to the iterating user.

    This class should be used with a context manager.

    Args:
        file_pattern: A FilePattern object that determines the input file
            pattern to use when finding matching shards.
        file_opener: A function that yields a context-manageable file handle
            that can be iterated over. The function signature is:
            (filename) => context-manageable file handle.
    '''

    def __init__(self, file_pattern, file_opener=fread):
        glob_pattern = file_pattern.build('*')
        assert glob_pattern.count('*') == 1, (
            'Sharded file pattern must only expand to a single wildcard for '
            'searching. Input pattern: %s\tGlob pattern: %s'
            % (file_pattern.file_pattern, glob_pattern)
        )
        files = [f for f in glob.glob(glob_pattern) if os.path.isfile(f)]
        assert files, 'No matching files found: %s' % glob_pattern
        # Sort the files from oldest to newest (by modification time) so we can
        # attempt to iterate over the lines in the same order they were
        # originally built. Store in reverse order since we will be popping off
        # the oldest file as we iterate.
        files.sort(key=os.path.getmtime, reverse=True)

        self._files = files
        self._file_opener = file_opener
        self._exit_stack = None
        self._cur_file = None

    def __enter__(self):
        self._exit_stack = ExitStack()
        return self

    def __exit__(self, *args, **kwargs):
        self._cur_file = None
        exit_stack = self._exit_stack
        # Delete the stored exit stack to signify that context has closed. This
        # needs to happen before the stack is exited since the subsequent
        # __exit__ call can raise an exception.
        self._exit_stack = None
        exit_stack.__exit__(*args, **kwargs)

    def __iter__(self):
        return self

    def __next__(self):
        if not self._exit_stack:
            raise ValueError('Iteration attempted on a closed ShardReader.')

        if not self._cur_file:
            self._open_next_file()

        try:
            # Attempt to return the next line from the current shard file.
            return next(self._cur_file)
        except StopIteration:
            # If we have finished reading the current file, open the next file
            # and return its first line. If we run out of files,
            # _open_next_file will throw another StopIteration that we can let
            # bubble up.
            self._open_next_file()
            return self.__next__()

    def _open_next_file(self):
        # If we are out of files to read, stop iteration.
        if not self._files:
            raise StopIteration

        # Close the previously opened files (if any).
        self._exit_stack.close()
        filename = self._files.pop()
        LOG.info('Opening next file: %s', filename)
        # Open the next file from the list.
        self._cur_file = self._exit_stack.enter_context(self._file_opener(filename))


class ShardWriter:
    '''A file writing utility for distributing written lines to different files.

    Once a file reaches the shard_size, a new file will be created and
    subsequent writes will be directed to that file.

    This class should be used with a context manager.

    Args:
        file_pattern: A FilePattern object that determines the output file
            pattern to use when a file is sharded.
        shard_size: The maximum number of lines to write per file.
        file_opener: A function that yields a context-manageable file handle
            that can be written to. The function signature is:
            (filename) => context-manageable file handle.
        on_new_file_opened: A function that will be called with the new output file as
            the only argument. It will be called right after the new file is opened
            before any files have been written.
    '''

    def __init__(
        self, file_pattern, shard_size, file_opener=fwrite, on_new_file_opened=None
    ):
        self.file_pattern = file_pattern
        self.shard_size = shard_size
        self._file_opener = file_opener
        self._on_new_file_opened = on_new_file_opened

        # File number will immediately be incremented at the first call to
        # `write`. Choosing not to open the file during the context enter to
        # avoid opening a file that is never written to.
        self._file_num = -1
        self._line_count = 0
        self._exit_stack = None
        self._cur_file = None

    def __enter__(self):
        self._exit_stack = ExitStack()
        return self

    def __exit__(self, *args, **kwargs):
        self._cur_file = None
        exit_stack = self._exit_stack
        # Delete the stored exit stack to signify that context has closed. This
        # needs to happen before the stack is exited since the subsequent
        # __exit__ call can raise an exception.
        self._exit_stack = None
        exit_stack.__exit__(*args, **kwargs)

    def write(self, line):
        if not self._exit_stack:
            raise ValueError('Write called on closed ShardWriter.')

        if (self._line_count % self.shard_size) == 0:
            # Close the previously opened files (if any).
            self._exit_stack.close()
            self._file_num += 1
            filename = self.file_pattern.build(str(self._file_num))
            self._cur_file = self._exit_stack.enter_context(self._file_opener(filename))

            if self._on_new_file_opened:
                self._on_new_file_opened(self._cur_file)
            if self._file_num:
                LOG.info(
                    'Line limit reached, switching to new file. ' 'Shard count: %s',
                    self._file_num + 1,
                )
        self._line_count += 1
        self._cur_file.write(line)
