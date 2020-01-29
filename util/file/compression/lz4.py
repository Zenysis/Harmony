# This LZ4 utility uses the system provided LZ4 library for compression
# and decompression. Each command returns a context managed object that
# exposes a normal python file for reading/writing.
# Example usage:
#
# rows = ['hello', 'world']
# with LZ4Writer('/tmp/test_file.lz4') as output_file:
#     for row in rows:
#         output_file.write(row)
#         output_file.write('\n')
#
# with LZ4Reader('/tmp/test_file.lz4') as input_file:
#     for line in input_file:
#         print line

from util.file.compression.common import (
    CommandLineCompressor,
    CommandLineDecompressor,
    assert_file_exists,
)

# Use the system provided LZ4 binary for reading compressed LZ4 files.
# NOTE(stephen): Since a named pipe is used, seeking is not supported.
def LZ4Reader(filename, mode='r'):  # pylint: disable=invalid-name
    assert_file_exists(filename)
    decompression_command = 'lz4cat "%s"' % filename
    return CommandLineDecompressor(decompression_command, mode)


# Use the system provided LZ4 binary for writing compressed LZ4 files.
# NOTE(stephen): Level 3 compression seemed like a good default to have for
# our system. There was a very small performance hit in testing vs a
# significant improvement in compression over level 1 compression (the
# default recommended by LZ4).
def LZ4Writer(filename, level=3, mode='w'):  # pylint: disable=invalid-name
    compression_command = 'lz4 -%d' % level
    return CommandLineCompressor(filename, compression_command, mode)
