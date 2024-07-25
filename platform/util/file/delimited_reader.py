# Lightweight delimited field reader providing DictReader style functionality
# but without all the complex csv parsing rules it has to support. Use this
# library when you have a simple csv structure that doesn't use escape
# characters or quoting.

from builtins import next


class DelimitedReader:
    '''Lightweight delimited file reader.

    For files that use only the simplest CSV format, where splitting on just the
    delimiter is all that is needed, this reader will be much more performant
    than the traditional DictReader.

    Args:
        file_handle - A file-like object.
        delimiter - The delimiter to split on.
        reuse_rows - If True, the same Row will be returned on each
            iteration instead of constructing a new one each time. This is a
            useful performance improvement when you know a row will be fully
            consumed before the next iteration.
    '''

    def __init__(self, file_handle, delimiter=',', reuse_rows=True):
        self._file = file_handle
        self._delimiter = delimiter

        self._fieldnames = self.build_fieldnames()
        self._field_map = Row.build_field_map(self._fieldnames)
        self._inplace = reuse_rows
        self._row = Row(self._field_map) if self._inplace else None

    def __iter__(self):
        return self

    def __next__(self):
        '''Return a Row for the next line in the file.'''
        raw_row = self.parse_line(next(self._file))
        if self._inplace:
            self._row.raw_row = raw_row
            return self._row
        return Row(self._field_map, raw_row)

    @property
    def fieldnames(self):
        return self._fieldnames

    def parse_line(self, line):
        '''Split the string line on the given delimiter.'''
        return line.strip().split(self._delimiter)

    def build_fieldnames(self):
        '''Read the first line of the file and extract the fieldnames. If the file
        is empty, return an empty list.
        '''
        try:
            line = next(self._file)
        except StopIteration:
            return []
        return self.parse_line(line)


class Row:
    '''A simple object offering dictionary-like key indexing over a list.'''

    def __init__(self, field_map, row=None):
        self._field_map = field_map
        self._field_count = len(field_map)
        self.raw_row = row

    def __getitem__(self, field):
        return self.raw_row[self._field_map[field]]

    def __contains__(self, key):
        return key in self._field_map

    def get(self, field, default=None):
        if field not in self._field_map:
            return default
        return self[field]

    def iterkeys(self):
        return iter(self._field_map.keys())

    def iteritems(self):
        for key in self.keys():
            yield key, self[key]

    def itervalues(self):
        for _, value in self.items():
            yield value

    def keys(self):
        return list(self.iterkeys())

    def values(self):
        return list(self.itervalues())

    def items(self):
        return list(self.iteritems())

    def is_valid(self):
        '''Test that the current row has the correct number of fields.'''
        return len(self.raw_row) == self._field_count

    @classmethod
    def build_field_map(cls, fieldnames):
        '''Build a dictionary mapping field name to index.'''
        return dict((key, i) for (i, key) in enumerate(fieldnames))
