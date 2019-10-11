# -*- coding: utf-8 -*-
# Utility libraries for handling unicode values in the DictReader and DictWriter
# classes on Python 2.7. The Python CSV library does not handle unicode at all.
from builtins import next
from builtins import str
from builtins import object
import csv


class _UnicodeReaderWrapper(object):
    '''Internal class. Wraps a native csv.reader object and decodes each element
    read as UTF-8 before returning it to the parent instance.
    '''

    def __init__(self, reader):
        self._reader = reader

    def __next__(self):
        row = next(self._reader)
        return [c for c in row]

    def __iter__(self):
        return self

    @property
    def dialect(self):
        return self._reader.dialect

    @property
    def line_num(self):
        return self._reader.line_num


class UnicodeCsvReader(_UnicodeReaderWrapper):
    '''Direct csv.reader replacenemt that decodes each item as UTF-8.'''

    def __init__(self, *args, **kwargs):
        reader = csv.reader(*args, **kwargs)
        super(UnicodeCsvReader, self).__init__(reader)


class UnicodeDictReader(csv.DictReader):
    '''DictReader replacement class that decodes each item read as UTF-8.'''

    def __init__(self, *args, **kwargs):
        csv.DictReader.__init__(self, *args, **kwargs)
        self.reader = _UnicodeReaderWrapper(self.reader)


class _UnicodeWriterWrapper(object):
    '''Internal class. Wraps a native csv.writer object used by DictWriter to
    encode each element as UTF-8 before writing to a file.
    '''

    def __init__(self, writer):
        self._writer = writer

    def writerow(self, row):
        encoded_row = [c for c in row]
        self._writer.writerow(encoded_row)

    def writerows(self, rows):
        for row in rows:
            self.writerow(row)

    @property
    def dialect(self):
        return self._writer.dialect


class UnicodeCsvWriter(_UnicodeWriterWrapper):
    '''Direct csv.writer replacenemt that encodes each item to be written as
    UTF-8.'''

    def __init__(self, *args, **kwargs):
        writer = csv.writer(*args, **kwargs)
        super(UnicodeCsvWriter, self).__init__(writer)


class UnicodeDictWriter(csv.DictWriter):
    '''DictWriter replacement class that encodes each item to be written as
    UTF-8.
    '''

    def __init__(self, *args, **kwargs):
        csv.DictWriter.__init__(self, *args, **kwargs)
        self.writer = _UnicodeWriterWrapper(self.writer)
