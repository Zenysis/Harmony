#!/usr/bin/env python

import csv

from builtins import str, next, object

''' Converts a CSV in the form of:

    dimension1, dimension2, ..., dimensionN, date, field1, field2, ..., fieldN

    To baserows for the deployment of your choosing.

    Usage:  ./process_csv.py --dimensions           RegionName DistrictName PatientName \
                             --fields               Measles_Cases eBoLaCases \
                             --date                 Date_Reported \
                             --rename_cols          patient_full_name:PatientName
                             --sourcename           'My source' \
                             --input                myinput.csv.gz \
                             --output_lz4           processed_rows.lz4 \
                             --output_locations     locations.csv \
                             --output_fields        fields.csv \
                             --output_indicators    indicators.csv

    If you are subclassing Aggregator or otherwise calling it from Python, you
    can register custom handlers for row and column processing.  Handlers work
    on raw CSV values.

    Row handler example: we want to conditionally use a value.
    ```
        def my_row_handler(raw_row):
            raw_row['final_value'] = 2 if raw_row['some_condition'] else 1
            return raw_row

        aggregator.set_row_handler(my_row_handler)
    ```

    Col handler example: we want to drop the word 'Facility' from every value in
    the Facility column:
    ```
        def facility_name_handler(val):
            return val.replace(' Facility', '')

        aggregator.set_col_handler('FacilityName', facility_name_handler)
    ```

# NOTE(stephen): Lots of room for optimization in this file.
'''
import json
import sys

from collections import defaultdict
from dateutil.parser import parse as dateparse

from pylib.base.flags import Flags
from slugify import slugify

from config.datatypes import BaseRowType, DimensionFactoryType
from config.system import STANDARD_DATA_DATE_FORMAT
from data.pipeline.datatypes.dimension_collector_io import write_hierarchical_dimensions
from log import LOG
from util.file.compression.lz4 import LZ4Reader, LZ4Writer
from util.file.compression.pigz import PigzReader

FIELD_WILDCARD = '*field_'
SLUG_SEPARATOR = '_'
UNPIVOTED_FIELD_COLUMN = 'field'
UNPIVOTED_VALUE_COLUMN = 'val'

_DATE_CACHE = {}


def _get_date(input_date_str):
    if input_date_str not in _DATE_CACHE:
        # TODO(ian): If the date is just a year, it sets the month and the
        # day to the current date!
        try:
            date_str = dateparse(input_date_str).strftime(STANDARD_DATA_DATE_FORMAT)
        except ValueError:
            LOG.error('Could not parse date: %s', input_date_str)
            date_str = None
        _DATE_CACHE[input_date_str] = date_str
    return _DATE_CACHE[input_date_str]


_FIELD_CACHE = {}


def _get_field_name(prefix_str, input_field, enable_field_wildcards=False):
    # NOTE(stephen): Prefix is static, so we don't need to include it in the
    # cache.
    if input_field not in _FIELD_CACHE:
        if enable_field_wildcards:
            input_field = input_field.replace(FIELD_WILDCARD, '')
        prefix = '%s_' % prefix_str if prefix_str else ''
        slug = slugify('%s%s' % (prefix, input_field), separator=SLUG_SEPARATOR)
        _FIELD_CACHE[input_field] = slug
    return _FIELD_CACHE[input_field]


def AmbiguousFileReader(filename):
    '''Determine which file reader to use based on the filename provided.
    Supports: .csv, .gz, and .lz4 file types.
    '''
    if filename.endswith('.csv'):
        return open(filename, 'r')
    if filename.endswith('.gz'):
        return PigzReader(filename)
    if filename.endswith('.lz4'):
        return LZ4Reader(filename)
    raise ValueError('Unable to detect file type from filename: %s' % filename)


class WildcardReader(object):
    '''Read CSV file that uses the FIELD_WILDCARD prefix format for columns to
    provide unpivoted rows where the field + value is a field in the output row.
    '''

    def __init__(self, file_handle, flatten_string_categories):
        self._reader = csv.reader(file_handle)
        self._header = next(self._reader)
        self._flatten_string_categories = flatten_string_categories

        # Create set of indices that have a wildcard field name.
        self._wildcard_idxs = set()
        for idx, field in enumerate(self._header):
            if field.startswith(FIELD_WILDCARD):
                self._wildcard_idxs.add(idx)

    def __iter__(self):
        return self

    def __next__(self):
        '''Return a new row for the next line in the file where the values are
        unpivoted.
        '''
        raw_row = next(self._reader)
        output = {}
        for idx, raw_value in enumerate(raw_row):
            field_name = self._header[idx]
            value = raw_value.strip()
            if idx in self._wildcard_idxs:
                # TODO(stephen): This logic is duplicated somewhat with
                # Aggregator. It's probably better if the Aggregator class
                # starts using a custom reader instead of hacking together a
                # bunch of choices inside a single class.
                try:
                    _ = float(value) if value else None
                except ValueError:
                    if not self._flatten_string_categories:
                        raise
                    # NOTE(stephen): Storing value as a string so that the
                    # dictionary provided matches the signature DictReader
                    # provides.
                    value = '1'
                    field_name = '%s - %s' % (field_name, raw_value)
            output[field_name] = value
        return output


class Aggregator(object):
    def __init__(
        self,
        datecol,
        source,
        output_field_prefix,
        dimensions=None,
        fields=None,
        enable_rollup=True,
        flatten_string_categories=False,
        enable_field_wildcards=False,
        tracer_field=None,
    ):
        self.dimensions = dimensions or []
        self.unmapped_dimensions = [
            dimension
            for dimension in self.dimensions
            if dimension in BaseRowType.UNMAPPED_KEYS
        ]
        self.fields = fields

        self.datecol = datecol
        self.source = source
        self.tracer_field = tracer_field
        self.output_field_prefix = output_field_prefix
        self.enable_rollup = enable_rollup
        self.flatten_string_categories = flatten_string_categories
        self.enable_field_wildcards = enable_field_wildcards
        self.dimension_cleaner = DimensionFactoryType.DimensionCleaner()

        self.counts = defaultdict(int)
        self.errors = defaultdict(int)

        self.col_rename = {}
        self.col_handlers = {}
        self.row_handlers = []
        self._rows = {}
        # Store an auto-incrementing ID to use when rollup is disabled.
        self._serial_id = 0

    def register_col_handler(self, colname, fn):
        self.col_handlers[colname] = fn

    def register_row_handler(self, fn):
        self.row_handlers.append(fn)

    def set_col_rename(self, renames):
        for rename in renames:
            old, new = rename.split(':')
            self.col_rename[old] = new

    def set_col_join(self, joins, join_str):
        join_str = str(join_str)
        for join in joins:
            parts, new_col = join.split(':')
            old_cols = parts.split('+')

            def row_handler(raw_row):
                raw_row[new_col] = join_str.join(
                    raw_row[old_col].strip() for old_col in old_cols if raw_row[old_col]
                )
                return raw_row

            self.row_handlers.append(row_handler)

    def process(
        self,
        input_path,
        output_rows,
        output_locations,
        output_fields,
        output_indicators,
    ):
        unique_locations = {}
        unique_fields = set()
        with AmbiguousFileReader(input_path) as f_in, LZ4Writer(output_rows) as f_out:
            reader = (
                csv.DictReader(f_in)
                if not self.enable_field_wildcards
                else WildcardReader(f_in, self.flatten_string_categories)
            )
            count = written_count = 0
            for line in reader:
                count += 1
                if (count % 1000000) == 0:
                    LOG.info('Lines read:\t%d', count)

                for fn in self.row_handlers:
                    line = fn(line)

                self.process_row(line)

            LOG.info('Finished reading file. Lines read: %d', count)
            LOG.info('Starting output row writing.')
            for row in self._rows.values():
                written_count += 1
                if (written_count % 1000000) == 0:
                    LOG.info('Rows written:\t%d', written_count)

                # Write to processed rows.
                f_out.write(row.to_json(True))
                unique_fields.update(set(row.data.keys()))

            LOG.info('Finished writing output rows. Rows written: %d', written_count)
            self.counts['rows raw'] = count
            self.counts['objects written'] = written_count

        dimension_collector = self.dimension_cleaner.dimension_collector

        # Save meta info.
        self.counts['fields'] = len(unique_fields)
        self.counts['locations'] = dimension_collector.hierarchical_dimension_count

        # Write meta files.
        LOG.info('Writing dimensions')
        write_hierarchical_dimensions(
            dimension_collector,
            output_locations,
            DimensionFactoryType.raw_prefix,
            DimensionFactoryType.clean_prefix,
        )
        self.write_fields(unique_fields, output_fields)
        if output_indicators:
            self.write_indicators(unique_fields, output_indicators)

    def process_row(self, orig_row):
        row = self._parse_row(orig_row)

        input_date_str = row[self.datecol]
        if not input_date_str:
            self.errors['Empty date'] += 1
            return

        date_str = _get_date(input_date_str)
        if not date_str:
            self.errors['Unparseable date'] += 1
            return

        # Extract data.
        data = self._build_values(row)
        if not data:
            # Don't return a row if there's no valid data in it.
            self.errors['Empty data row'] += 1
            return

        # Store the data in a BaseRow
        self._store_values(row, date_str, data)
        self.counts['rows stored'] += 1

    def _parse_row(self, orig_row):
        # Shortcut and return the original row if no column transformations are
        # defined.
        if not self.col_handlers and not self.col_rename:
            return orig_row

        output = {}
        for key, val in orig_row.items():
            # Apply column handlers - these functions modify the values for a
            # given column.
            if key in self.col_handlers:
                val = self.col_handlers[key](val)

            # Apply renames if applicable.
            if key in self.col_rename:
                key = self.col_rename[key]
            output[key] = val
        return output

    def _extract_field_value(self, raw_field, raw_value):
        value_str = raw_value.strip()
        try:
            value = float(value_str) if value_str else None
        except ValueError as e:
            if self.flatten_string_categories:
                raw_field += ' - %s' % value_str
                value = 1
            else:
                raise ValueError(e)
        field = _get_field_name(
            self.output_field_prefix, raw_field, self.enable_field_wildcards
        )
        # Detect when the raw field name is not slugify-able.
        # NOTE(stephen): We can't just check `not raw_field` since trailing
        # punctuation is dropped by slugify. Therefore, we check if the new
        # field name matches the prefix.
        if field == self.output_field_prefix:
            self.errors['bad fields'] += 1
            value = None

        # NOTE(stephen): Moderate perf improvement during json serialization
        # of large files to avoid storing as float and instead use int.
        if type(value) == float and value.is_integer():
            value = int(value)
        return (field, value)

    def _build_values(self, row):
        fields = self.fields
        if self.enable_field_wildcards:
            # Field wildcards override the --fields parameter. Intead of
            # requiring caller to individually specify columns that are fields,
            # accept all columns that begin with "*field_".
            fields = [colname for colname in row if colname.startswith(FIELD_WILDCARD)]
            if not fields:
                raise RuntimeError(
                    'You enabled field wildcards but there are no columns '
                    'beginning with %s' % FIELD_WILDCARD
                )

        if not fields:
            (output_field, value) = self._extract_field_value(
                row[UNPIVOTED_FIELD_COLUMN], row[UNPIVOTED_VALUE_COLUMN]
            )
            # Skip rows where the value is missing.
            if value is None:
                return {}
            return {output_field: value}

        output = {}
        for field in fields:
            (output_field, value) = self._extract_field_value(field, row[field])
            # Skip rows where the value is missing.
            if value is None:
                continue
            output[output_field] = value
        return output

    def _build_row_key(self, row, date_str):
        '''Build a key for this row that will allow value rollup for common rows.

        If rollup is disabled, return a unique key to prevent rollup.
        '''
        # If rollup is not allowed, use a serial value as a unique key.
        if not self.enable_rollup:
            self._serial_id += 1
            return self._serial_id

        # Build an ID for this row based on its dimensions + date combination.
        dimension_key = u'__'.join(row[key] for key in self.dimensions)
        return u'%s__%s' % (dimension_key, date_str)

    def _extract_dimensions(self, row):
        dimensions = self.dimension_cleaner.process_row(row)
        if self.unmapped_dimensions:
            # Clone the cleaned dimensions and attach the unmapped dimensions.
            # NOTE(stephen): Need to clone the cleaned dimensions since the
            # dimension cleaner/collector will cache and reuse the output.
            dimensions = dict(dimensions)
            for dimension in self.unmapped_dimensions:
                dimensions[dimension] = row.get(dimension) or ''
        return dimensions

    def _store_values(self, row, date_str, values):
        row_key = self._build_row_key(row, date_str)
        if row_key not in self._rows:
            baserow = BaseRowType(date=date_str, source=self.source)
            baserow.key = self._extract_dimensions(row)
            baserow.data = values
            self._rows[row_key] = baserow
            return

        # Rollup new values into the existing baserow.
        # NOTE(stephen): This assumes that all fields can be combined by
        # summing. If that is not the case, this will need to be refactored.
        baserow_data = self._rows[row_key].data

        for key, value in values.items():
            baserow_data[key] = value + baserow_data.get(key, 0)

        if self.tracer_field:
            baserow_data[self.tracer_field] = 1

    def write_fields(self, unique_fields, path):
        ''' Given a set of fields, write a list of fields containing data.
        '''
        with open(path, 'w') as fields_out:
            for field in sorted(list(unique_fields)):
                fields_out.write('%s\n' % field)

    def write_indicators(self, unique_fields, path):
        ''' Given a set of fields, write an indicator group object containing
            all of them.
        '''
        output = []
        for field in sorted(list(unique_fields)):
            output.append({'id': field, 'text': self.get_text_from_field(field)})

        with open(path, 'w') as fields_out:
            fields_out.write(json.dumps(output, indent=2))

    def get_text_from_field(self, field_id):
        text = field_id[len(self.output_field_prefix) + 1 :].replace(
            SLUG_SEPARATOR, ' '
        )
        return text[0].upper() + text[1:]

    def print_report(self):
        LOG.info('Counts: %s', json.dumps(self.counts, indent=2))
        LOG.info('Errors: %s', json.dumps(self.errors, indent=2))


def setup_flags():
    Flags.PARSER.add_argument(
        '--dimensions',
        type=str,
        nargs='*',
        required=False,
        help='List of dimensions columns, comma-separated',
    )
    Flags.PARSER.add_argument(
        '--rename_cols',
        type=str,
        nargs='*',
        required=False,
        help='Optional mappings for renaming CSV columns, formatted as '
        '"OriginalName:NewName". For example: region_name:RegionName',
    )
    Flags.PARSER.add_argument(
        '--join_cols',
        type=str,
        nargs='*',
        required=False,
        help='Optional mappings for joining CSV columns, formatted as '
        '"OriginalName1+OriginalName2:NewName".'
        'Customize the concatenation by specifying --join_str.'
        'For example: region_name+district_name:GeoName',
    )
    Flags.PARSER.add_argument(
        '--join_str',
        type=str,
        required=False,
        default=' - ',
        help='String that is used to concatenate join_cols',
    )

    Flags.PARSER.add_argument(
        '--fields',
        type=str,
        nargs='*',
        required=False,
        help='List of field columns to unpivot, comma-separated. If not '
        'specified, the data is assumed to be unpivoted with "field" and '
        '"val" columns.',
    )

    Flags.PARSER.add_argument('--date', type=str, required=True, help='The date column')

    Flags.PARSER.add_argument(
        '--prefix', type=str, required=True, help='Field ID prefix'
    )
    Flags.PARSER.add_argument(
        '--sourcename', type=str, required=True, help='Name of source'
    )
    Flags.PARSER.add_argument(
        '--disable_rollup',
        action='store_true',
        default=False,
        help='Should rows representing the same dimensions + date have their '
        'values combined',
    )
    Flags.PARSER.add_argument(
        '--policy',
        type=str,
        required=False,
        default='ABORT',
        help='Policy for handling data anomalies',
    )
    Flags.PARSER.add_argument(
        '--tracer_field',
        type=str,
        required=False,
        default=None,
        help='Field id for facility count indicators.',
    )
    Flags.PARSER.add_argument(
        '--flatten_string_categories',
        action='store_true',
        default=False,
        help='If true, append string values to field '
        'names and set value to 1. In other words '
        'Convert "FieldName: yes" values to '
        '"FieldName - yes: 1"',
    )
    Flags.PARSER.add_argument(
        '--enable_field_wildcards',
        action='store_true',
        default=False,
        help='If true, unpivot all columns that begin with '
        '*field_ rather than specifying field names '
        'individually. Overrides --fields param',
    )
    Flags.PARSER.add_argument(
        '--input',
        type=str,
        required=True,
        help='Path to input CSV. File type can be: '
        'uncompressed (.csv), '
        'gzip compressed (.gz), '
        'or lz4 compressed (.lz4)',
    )
    Flags.PARSER.add_argument(
        '--output_rows', type=str, required=True, help='Path to output rows json lz4'
    )
    Flags.PARSER.add_argument(
        '--output_locations', type=str, required=True, help='Path to output locations'
    )
    Flags.PARSER.add_argument(
        '--output_fields', type=str, required=True, help='Path to output fields'
    )
    Flags.PARSER.add_argument(
        '--output_indicators',
        type=str,
        required=False,
        help='Path to output JSON indicator groups',
    )

    Flags.InitArgs()


def main():
    setup_flags()

    rename_cols = Flags.ARGS.rename_cols
    join_cols = Flags.ARGS.join_cols
    join_str = Flags.ARGS.join_str
    dimensions = Flags.ARGS.dimensions
    fields = Flags.ARGS.fields
    datecol = Flags.ARGS.date
    source = Flags.ARGS.sourcename
    prefix = Flags.ARGS.prefix
    enable_rollup = not Flags.ARGS.disable_rollup
    flatten_string_categories = Flags.ARGS.flatten_string_categories
    tracer_field = Flags.ARGS.tracer_field
    enable_field_wildcards = Flags.ARGS.enable_field_wildcards
    agg = Aggregator(
        dimensions=dimensions,
        fields=fields,
        datecol=datecol,
        source=source,
        output_field_prefix=prefix,
        enable_rollup=enable_rollup,
        flatten_string_categories=flatten_string_categories,
        enable_field_wildcards=enable_field_wildcards,
        tracer_field=tracer_field,
    )
    if rename_cols:
        agg.set_col_rename(rename_cols)
    if join_cols:
        agg.set_col_join(join_cols, join_str)
    LOG.info('Starting CSV processing.')
    agg.process(
        Flags.ARGS.input,
        Flags.ARGS.output_rows,
        Flags.ARGS.output_locations,
        Flags.ARGS.output_fields,
        Flags.ARGS.output_indicators,
    )
    agg.print_report()


if __name__ == '__main__':
    sys.exit(main())
