from util.file.compression.lz4 import LZ4Reader, LZ4Writer
from util.file.compression.pigz import PigzReader, PigzWriter

# pylint: disable=invalid-name
def AmbiguousFile(filename: str, suffix: str = '', write: bool = False):
    '''Try to determine which file opener to use based on the filename provided.
    Restrict the supported filenames to those that use the suffix. Test to see if the
    filename uses a compression format. If it does not, ensure the suffix matches and
    assume the file is a regular text file.

    Example suffix: `.csv` `.json`
    '''

    if suffix and not suffix[0] == '.':
        suffix = f'.{suffix}'

    if filename.endswith(f'{suffix}.gz'):
        return PigzWriter(filename) if write else PigzReader(filename)
    if filename.endswith(f'{suffix}.lz4'):
        return LZ4Writer(filename) if write else LZ4Reader(filename)
    if filename.endswith(suffix):
        return open(filename, 'w') if write else open(filename)
    raise ValueError('Unable to detect file type from filename: %s' % filename)
