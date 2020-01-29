# Pigz provides parallel compression of gzip files and is a drop-in replacement
# for gzip. The output file produced is a normal gzip file and doesn't need
# a special decompressor.
from util.file.compression.common import (
    CommandLineCompressor,
    CommandLineDecompressor,
    assert_file_exists,
)

# Use the system provided pigz binary for decompression of gzip files.
# NOTE(stephen): This doesn't provide much of a speedup over the system gzip
# binary, but it is a lot faster than Python's gzip library.
# pylint: disable=invalid-name
def PigzReader(filename, mode='r'):
    assert_file_exists(filename)
    decompression_command = 'pigz -d -c "%s"' % filename
    return CommandLineDecompressor(decompression_command, mode)


# Use the system provided pigz binary for parallel compression of gzip files.
# pylint: disable=invalid-name
def PigzWriter(filename, level=5, processes=-1, mode='w'):
    compression_command = 'pigz -%d' % level
    if processes > 0:
        compression_command = '%s -p %s' % (compression_command, processes)
    return CommandLineCompressor(filename, compression_command, mode)
