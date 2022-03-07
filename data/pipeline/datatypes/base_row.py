import numbers

from json import JSONDecoder, JSONEncoder
from typing import List


# PyPy speedup to use the optimized decoder if it is available.
# pylint: disable=import-error
try:
    import _pypyjson
except ImportError:
    _pypyjson = None

# Reuse the same encoder/decoder instead of using loads and dumps since those
# versions construct a new encoder/decoder each time they are called.
_JSON_ENCODER = JSONEncoder(ensure_ascii=False, check_circular=False, allow_nan=False)
# NOTE(stephen): If we are fine with unicode escaping, this encoder will be
# more performant.
_JSON_ENCODER_ASCII = JSONEncoder(check_circular=False, allow_nan=False)

# If we are using pypy, we should use the optimized decoder instead of the standard
# json decoder.
_DECODE_JSON = _pypyjson.loads if _pypyjson else JSONDecoder().decode

# Processed pipeline sources will store their data as a child class
# of BaseRow
class BaseRow:
    DATE_FIELD = 'Real_Date'
    SOURCE_FIELD = 'source'

    # These are the fields that will be used in the matching process
    # They are ordered
    MAPPING_KEYS: List[str] = []

    __slots__ = ('_internal',)

    def __init__(
        self,
        key_dict: dict = None,
        data_dict: dict = None,
        date: str = '',
        source: str = '',
    ):
        self._internal = {
            'key': {},
            'data': {},
            self.DATE_FIELD: '',
            self.SOURCE_FIELD: '',
        }
        self.key = key_dict or {}
        self.data = data_dict or {}
        self.date = date
        self.source = source

    @property
    def mapping_id(self):
        values = [self.key.get(k, '') for k in self.MAPPING_KEYS]
        return self._generate_id(values)

    @property
    def row_id(self):
        values = [self.mapping_id, self.date]
        return self._generate_id(values)

    @property
    def data(self):
        return self._internal['data']

    @data.setter
    def data(self, value: dict):
        # TODO(stephen): It'd be nice if there was a better way to enforce types
        assert isinstance(
            value, dict
        ), 'Data must be a dictionary type. New value being set: %s' % type(value)
        self._internal['data'] = value

    @property
    def key(self):
        return self._internal['key']

    @key.setter
    def key(self, value):
        if not value:
            value = {}
        self._internal['key'] = value

    @property
    def date(self):
        return self._internal[self.DATE_FIELD]

    @date.setter
    def date(self, value):
        self._internal[self.DATE_FIELD] = value

    @property
    def source(self):
        return self._internal[self.SOURCE_FIELD]

    @source.setter
    def source(self, value):
        self._internal[self.SOURCE_FIELD] = value

    def to_dict(self):
        return self._internal

    @classmethod
    def from_dict(cls, stored_instance):
        return cls(
            stored_instance['key'],
            stored_instance['data'],
            stored_instance[cls.DATE_FIELD],
            stored_instance[cls.SOURCE_FIELD],
        )

    def to_json(self, newline=False):
        json_str = _JSON_ENCODER_ASCII.encode(self.to_dict())
        if newline:
            return json_str + '\n'
        return json_str

    @classmethod
    def from_json(cls, line):
        return cls.from_dict(_DECODE_JSON(line))

    def _generate_id(self, values, delimiter='__'):
        return delimiter.join(values)

    def to_druid_json_iterator(self, newline=False):
        ret = {}
        ret.update(self.key)
        ret[self.DATE_FIELD] = self.date
        ret[self.SOURCE_FIELD] = self.source
        base_json = _JSON_ENCODER.encode(ret)[:-1]
        line_ending = '\n' if newline else ''

        zero_fields = []
        for key, val in self.data.items():
            assert isinstance(val, numbers.Number), 'val is not a Number: %s' % val
            # Process fields with a zero value separately below.
            if not val:
                zero_fields.append(key)
                continue
            yield '%s, "field": "%s", "val": %s}%s' % (base_json, key, val, line_ending)

        # Consolidate zero value fields into a single multi-value dimension.
        # This improves performance both in processing and during indexing since
        # we can write a single row for all zero values collected for this
        # dimension + date combination.
        if zero_fields:
            if len(zero_fields) == 1:
                zero_fields = zero_fields[0]
            field_json = _JSON_ENCODER_ASCII.encode(zero_fields)
            yield '%s, "field": %s, "val": 0}%s' % (base_json, field_json, line_ending)

    def to_druid_json(self):
        return '\n'.join(self.to_druid_json_iterator())

    # NOTE(stephen): Experimental Druid row format that uses our newly built
    # nestedJson parser type.
    def to_nested_druid_json(self, newline=False):
        row = {
            self.DATE_FIELD: self.date,
            self.SOURCE_FIELD: self.source,
            'data': self.data,
        }
        row.update(self.key)
        line_ending = '\n' if newline else ''
        return '%s%s' % (_JSON_ENCODER_ASCII.encode(row), line_ending)
