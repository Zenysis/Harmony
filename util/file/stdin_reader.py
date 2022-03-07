# pylint: disable=too-few-public-methods
from builtins import object
import sys

from log import LOG

# DictReader like behavior with much better performance by processing stdin
# and not creating a dictionary each time for each line
class StdinReader(object):
    # Mimic dictionary behavior for a list. The RowObject can be accessed with
    # string keys by using the headers map to find the appropriate index in the
    # row
    class RowObject(object):
        def __init__(self, headers):
            self._headers = headers
            self.row = []

        def __getitem__(self, field):
            return self.row[self._headers[field]]

    @classmethod
    def process_all(cls, row_process_fn, delimiter='\t'):
        headers = cls._get_headers(delimiter)
        num_lines = 1

        row_obj = cls.RowObject(headers)
        for line in sys.stdin:
            num_lines += 1
            if (num_lines % 2000000) == 0:
                LOG.info('Lines read:\t%d', num_lines)
            row_obj.row = line.strip().split(delimiter)
            row_process_fn(row_obj)
        LOG.info('Finished reading from stdin. Lines read: %d', num_lines)

    @classmethod
    def _get_headers(cls, delimiter):
        header_line = sys.stdin.readline().strip().split(delimiter)
        return dict((key, i) for (i, key) in enumerate(header_line))
