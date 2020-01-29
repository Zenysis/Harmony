import os
from contextlib import contextmanager

from util.unix import BackgroundProcess, NamedPipe

# The command line compressor and decompressors make it easy to expose system
# compression binaries in python. A named pipe is created and exposed as a
# normal file object, and a background process handles compression or
# decompression through this pipe. A regular python file object will be yielded
# to the caller and can be used like normal (just without seeking).
#
# Here is an example using the gzip library:
# rows = ['hello', 'world']
# with CommandLineCompressor('/tmp/test.txt.gz', 'gzip -5') as output_file:
#     for row in rows:
#         output_file.write(row)
#         output_file.write('\n')
#
# with CommandLineDecompressor('gunzip -c /tmp/test.txt.gz') as input_file:
#     for line in input_file:
#         print line

# Execute the provided compression command and store the output in the specified
# output file. The compression command should be setup to read from stdin.
# NOTE(stephen): Using a contextmanager decorator since we want to return
# a full file object to be used by the caller.
# pylint: disable=invalid-name
@contextmanager
def CommandLineCompressor(output_file, compression_command, mode='w'):
    if not mode or mode[0] != 'w' or '+' in mode:
        raise ValueError('Unsupported file write mode: %s' % mode)

    with NamedPipe() as named_pipe:
        command = 'cat %s | %s > %s' % (named_pipe, compression_command, output_file)
        with BackgroundProcess(command) as bg:
            file_obj = open(named_pipe, mode)
            yield file_obj
            file_obj.flush()
            file_obj.close()

            # Wait for compression to finish, otherwise BackgroundProcess
            # will think the process never terminated and throw an error
            bg.wait()


# Execute the provided decompression command and yield a file object containing
# the decompressed result.
# NOTE(stephen): Using a contextmanager decorator since we want to return
# a full file object to be used by the caller.
@contextmanager
def CommandLineDecompressor(decompression_command, mode='r'):
    if not mode or mode[0] != 'r' or '+' in mode:
        raise ValueError('Unsupported file read mode: %s' % mode)

    with NamedPipe() as named_pipe:
        command = '%s > %s' % (decompression_command, named_pipe)
        with BackgroundProcess(command) as bg:
            file_obj = open(named_pipe, mode)
            yield file_obj
            file_obj.close()

            # Wait for the named pipe to close, otherwise BackgroundProcess
            # will think the process never terminated and throw an error
            bg.wait()


def assert_file_exists(filename):
    if not os.path.exists(filename):
        raise IOError('File does not exist: %s' % filename)
