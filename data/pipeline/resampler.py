#!/usr/bin/env python
import json

from datetime import datetime, timedelta

# Reuse the same encoder/decoder instead of using loads and dumps since those
# versions construct a new encoder/decoder each time they are called.
_JSON_ENCODER = json.JSONEncoder(
    ensure_ascii=True, check_circular=False, allow_nan=False
)
FIELD_COLUMN = 'field'
DATA_COLUMN = 'data'
VALUE_COLUMN = 'val'


class Resampler:
    def __init__(self, fields, date_field, date_format, dimensions, last_date):
        '''Used to up sample rows post processing to a daily rate
        (duplicate rows for every day in a time period).
        fields: field values that you want upsampled
        date_field: string key for the date field
        date_format: string for the way date is represented in the data
        dimensions: list of hierarchical dimensions.'''
        self.dimensions = dimensions
        self.fields = set(fields)
        self.date_format = date_format
        self.date_field = date_field
        self.last_date = datetime.strptime(last_date, self.date_format)
        self._rows_to_resample = {}
        self._non_resampled_rows = {}
        self._date_format_cache = {}
        self._date_conversion_cache = {}

    def _get_date_str(self, date):
        # cache the datetime object to string mapping so that excess
        # calls to strftime aren't necessary.
        # NOTE(stephen): Building our own date hash so that we can avoid storing
        # the full datetime object in the dict. This saves a considerable amount
        # of time and memory.
        # NOTE(stephen): String hashes seemed to perform better than tuples as
        # a dict key during profiling.
        date_hash = '%s-%s-%s' % (date.year, date.month, date.day)
        if date_hash not in self._date_format_cache:
            self._date_format_cache[date_hash] = date.strftime(self.date_format)
        return self._date_format_cache[date_hash]

    def _convert_date_str(self, date_str):
        if date_str not in self._date_conversion_cache:
            self._date_conversion_cache[date_str] = datetime.strptime(
                date_str, self.date_format
            )
        return self._date_conversion_cache[date_str]

    def _build_row_key_prefix(self, line):
        return '__'.join(line.get(d, '') for d in self.dimensions)

    def _compare_date(self, raw_date):
        return self._convert_date_str(raw_date) < self.last_date

    def read_lines(self, lines):
        # Read in all the lines if a line has a field we are
        # resampling then add the line to the _data grouped with
        # other lines that have the same key.
        for line in lines:
            json_line = json.loads(line)

            # Handle different ways that data is stored for druid.
            # If there is a field key in the json line, it is *not nested*.
            data = {}
            if json_line.get(FIELD_COLUMN):
                field = json_line[FIELD_COLUMN]
                value = json_line[VALUE_COLUMN]

                # If the field is storing a list of values then it is operating as a
                # multi-value dimension where all the fields should receive the same
                # value. This generally only happens when multiple fields have a value
                # of 0 for the same date and dimensions.
                if isinstance(field, list):
                    for f in field:
                        data[f] = value
                else:
                    # Common case: field is a string and value is a number.
                    data[field] = value
            else:
                # Otherwise, we should have a `data` dictionary containing the
                # nested values.
                data.update(json_line[DATA_COLUMN])
                del json_line[DATA_COLUMN]

            row_key_prefix = self._build_row_key_prefix(json_line)
            raw_date = json_line[self.date_field]
            for field, value in data.items():
                row_key = '%s__%s' % (row_key_prefix, field)

                # If this field is not part of the set of fields we should resample,
                # then it will be collected differently.
                collection = (
                    self._rows_to_resample
                    if field in self.fields and self._compare_date(raw_date)
                    else self._non_resampled_rows
                )
                if row_key not in collection:
                    collection[row_key] = {}

                rows = collection[row_key]

                # If this unique `dimension + field` combination has already been seen,
                # accumulate the value since we are collapsing rows.
                if raw_date in rows:
                    rows[raw_date][VALUE_COLUMN] += value
                else:
                    # Store the row as non-nested format.
                    rows[raw_date] = {
                        **json_line,
                        FIELD_COLUMN: field,
                        VALUE_COLUMN: value,
                    }

    def _build_raw_output_row(self, row):
        # JSON serialize the row but exclude the date and closing brace of the
        # row. The date will be added later manually.
        base_row = dict(row)
        base_row.pop(self.date_field)
        return _JSON_ENCODER.encode(base_row)[:-1]

    def _emit_non_resampled_rows(self):
        # If there were fields in the original dataset that are not part of the set of
        # fields to resample, then they need to be output unmodified in their original
        # form.
        for date_to_row_dict in self._non_resampled_rows.values():
            for row in date_to_row_dict.values():
                yield _JSON_ENCODER.encode(row)

    def build_output_rows(
        self, newline=True, alternate_end_date_function=lambda y, x: x
    ):
        line_ending = '\n' if newline else ''
        # First, output any rows that should not be resampled.
        for row in self._emit_non_resampled_rows():
            yield row + line_ending

        # upsample the rows to a daily rate for each key, until the last_date specified.
        one_day = timedelta(days=1)
        for date_to_row_dict in self._rows_to_resample.values():
            # Sort rows from smallest to largest date. We want to copy rows between
            # dates that are missing.
            rows = [date_to_row_dict[date] for date in sorted(date_to_row_dict.keys())]
            row_count = len(rows) - 1

            # `rows` contains a list of rows for the given dimension key, sorted by date.
            for i, item in enumerate(rows):
                # JSON serialization is very costly. Reuse the serialized row
                # since we the only thing changing each time is the date.
                raw_output_row = self._build_raw_output_row(item)

                # Build new rows that will cover all the dates up to the next row.
                cur_date = self._convert_date_str(item[self.date_field])
                end_date = alternate_end_date_function(
                    item,
                    self._convert_date_str(rows[i + 1][self.date_field])
                    if i < row_count
                    else (self.last_date + one_day),
                )

                while cur_date < end_date:
                    # Format the date for json serialization.
                    yield '%s, "%s": "%s"}%s' % (
                        raw_output_row,
                        self.date_field,
                        self._get_date_str(cur_date),
                        line_ending,
                    )
                    cur_date += one_day
