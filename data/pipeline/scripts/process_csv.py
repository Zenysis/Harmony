#!/usr/bin/env python
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

        aggregator.register_row_handler(my_row_handler)
    ```

    Col handler example: we want to drop the word 'Facility' from every value in
    the Facility column:
    ```
        def facility_name_handler(val):
            return val.replace(' Facility', '')

        aggregator.register_col_handler('FacilityName', facility_name_handler)
    ```

# NOTE(stephen): Lots of room for optimization in this file.
'''
import csv
import json
import gc
import re
import sys

from builtins import next
from collections import defaultdict
from datetime import datetime
from functools import partial

from dateutil.parser import parse as dateparse

from pylib.base.flags import Flags
from slugify import slugify

from config.aggregation import DIMENSIONS
from config.datatypes import BaseRowType, DimensionFactoryType
from config.system import STANDARD_DATA_DATE_FORMAT
from data.pipeline.datatypes.dimension_collector_io import (
    write_hierarchical_dimensions,
    write_non_hierarchical_dimensions,
)

from log import LOG
from util.file.ambiguous_file import AmbiguousFile
from util.file.compression.lz4 import LZ4Writer

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
        clean_input_field = (
            input_field.replace(FIELD_WILDCARD, '')
            if enable_field_wildcards
            else input_field
        )
        prefix = '%s_' % prefix_str if prefix_str else ''
        slug = slugify(f'{prefix}{clean_input_field}', separator=SLUG_SEPARATOR)
        _FIELD_CACHE[input_field] = slug

    return _FIELD_CACHE[input_field]


def _parse_numeric_value(value_str: str, raise_error: bool):
    # Quick check to see if an empty string was passed. This is allowed, and the result
    # to return is None.
    if not value_str:
        return None

    try:
        value = float(value_str)

        # NOTE(stephen): Moderate perf improvement during json serialization
        # of large files to avoid storing as float and instead use int.
        if value.is_integer():
            return int(value)
        return value
    except ValueError:
        # Only strip the string to find out if it is empty after we have parsed it as
        # a float first. This is an uncommon case, so we don't want to spend time
        # modifying the string if we don't need to.
        if not value_str.strip():
            return None

        # If we are not raising an error, we can just return `None` directly.
        if not raise_error:
            return None

        raise ValueError(
            f'Bad value: {value_str}. Maybe you should specify --val_clean_regex'
        )


class WildcardReader:
    '''Read CSV file that uses the FIELD_WILDCARD prefix format for columns to
    provide unpivoted rows where the field + value is a field in the output row.
    '''

    def __init__(self, file_handle, delimiter=','):
        self._reader = csv.reader(file_handle, delimiter=delimiter)
        self._header = next(self._reader)

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
                    # NOTE(stephen): Storing value as a string so that the
                    # dictionary provided matches the signature DictReader
                    # provides.
                    value = '1'
                    field_name = '%s - %s' % (field_name, raw_value)
            output[field_name] = value
        return output


class Aggregator:
    UNPARSEABLE_DATE_ERROR_LABEL = 'Unparseable date'
    EMPTY_DATE_ERROR_LABEL = 'Empty date'
    EMPTY_DATA_ROW_ERROR_LABEL = 'Empty data row'
    EXTRA_VALS_ERROR_LABEL = 'Rows with extra values'

    ROWS_STORED_COUNT_LABEL = 'rows stored'
    ROWS_ROW_COUNT_LABEL = 'rows row'
    OBJECTS_WRITTEN_COUNT_LABEL = 'objects written'
    FIELDS_COUNT_LABEL = 'fields'
    LOCATIONS_COUNT_LABEL = 'locations'

    def __init__(
        self,
        datecol,
        source,
        output_field_prefix,
        valcol=UNPIVOTED_VALUE_COLUMN,
        dimensions=None,
        fields=None,
        enable_rollup=True,
        flatten_string_categories=False,
        disaggregations=None,
        enable_field_wildcards=False,
        tracer_field=None,
        exclude_zeros=False,
        val_clean_regex_str=None,
        delimiter=',',
        multi_value_dimensions=None,
    ):
        self.dimensions = dimensions or []
        self.multi_value_dimensions = (
            {
                dim.split(':')[0]: dim.split(':')[1].split(',')
                for dim in multi_value_dimensions
            }
            if multi_value_dimensions
            else {}
        )
        self.unmapped_dimensions = [
            dimension
            for dimension in self.dimensions
            if dimension in BaseRowType.UNMAPPED_KEYS
        ]
        self.fields = fields

        self.datecol = datecol
        self.valcol = valcol
        self.source = source
        self.tracer_field = tracer_field
        self.output_field_prefix = output_field_prefix
        self.enable_rollup = enable_rollup
        self.flatten_string_categories = flatten_string_categories
        self.disaggregations = disaggregations
        self.enable_field_wildcards = enable_field_wildcards
        self.dimension_cleaner = DimensionFactoryType.DimensionCleaner()
        self.exclude_zeros = exclude_zeros
        self.val_clean_regex = (
            re.compile(val_clean_regex_str, re.IGNORECASE)
            if val_clean_regex_str
            else None
        )
        self.delimiter = delimiter

        self.counts = defaultdict(int)
        self.errors = defaultdict(int)

        self.col_rename = {}
        self.col_handlers = {}
        self.row_handlers = []
        self._rows = {}

    def register_col_handler(self, colname, fn):
        self.col_handlers[colname] = fn

    def register_row_handler(self, fn):
        self.row_handlers.append(fn)

    def set_col_rename(self, renames):
        for rename in renames:
            old, new = rename.split(':')
            self.col_rename[old] = new

    @staticmethod
    def _row_handler_set_col_join(old_cols, new_col, join_str, raw_row):
        """
        Join old columns into a new column using the `join_str`
        """
        raw_row[new_col] = join_str.join(
            raw_row[old_col].strip() for old_col in old_cols if raw_row.get(old_col)
        )
        return raw_row

    def set_col_join(self, joins, join_str):
        join_str = str(join_str)
        for join in joins:
            parts, new_col = join.split(':')
            old_cols = parts.split('+')
            row_handler = partial(
                self._row_handler_set_col_join, old_cols, new_col, join_str
            )
            self.row_handlers.append(row_handler)

    @staticmethod
    def _row_handler_set_col_val(col, val, raw_row):
        """
        For a given row, set the column to a specific value
        """
        raw_row[col] = val
        return raw_row

    def set_col_val(self, colvals):
        """
        For a pair of `col:val`, we have the `row_handler` assign the `val` to each `col`
        """
        for colval in colvals:
            col, val = colval.split(':')
            row_handler = partial(self._row_handler_set_col_val, col, val)
            self.row_handlers.append(row_handler)

    def _set_fields(self, reader, f_out, unique_fields):
        """
        Set the fields to use if the user has specified
        """
        count = 0
        for line in reader:
            count += 1
            if (count % 1000000) == 0:
                LOG.info('Lines read:\t%d', count)

            for fn in self.row_handlers:
                line = fn(line)

            # Process the input row. If an output row is returned then we should
            # write it immediately to the output file.
            output_row = self.process_row(line)
            if output_row:
                self._write_row(output_row, count, f_out, unique_fields)
        LOG.info('Finished reading file. Lines read: %d', count)
        self.counts[self.ROWS_ROW_COUNT_LABEL] = count

    def _write_remaining_rows(self, f_out, unique_fields):
        """
        Write all remaining rows to the output file. There should be rows here if rollup
         is enabled.
        """
        written_count = 0
        keys = list(self._rows.keys())
        for key in keys:
            # Remove the row from the rows collection since it is no longer used
            # after being written to an output file. This will free up memory.
            row = self._rows.pop(key)
            written_count += 1
            self._write_row(row, written_count, f_out, unique_fields, True)
        LOG.info('Finished writing output rows. Rows written: %d', written_count)
        self.counts[self.OBJECTS_WRITTEN_COUNT_LABEL] = written_count

    def _update_fields_with_wildcard_fields(self, reader):
        if self.enable_field_wildcards:
            self.fields = [
                field for field in reader.fieldnames if field.startswith(FIELD_WILDCARD)
            ]
            if not self.fields:
                raise RuntimeError(
                    'You enabled field wildcards but there are no columns '
                    'beginning with %s' % FIELD_WILDCARD
                )

    @staticmethod
    def _write_row(
        output_row, written_count, f_out, unique_fields, manage_memory=False
    ):
        if (written_count % 1000000) == 0:
            LOG.info('Rows written:\t%d', written_count)

            # Issue a garbage collection so that we can keep memory pressure
            # down while writing to the output file.
            if manage_memory:
                gc.collect()

        # Write to processed rows.
        f_out.write(output_row.to_json(True))
        unique_fields.update(set(output_row.data.keys()))

    def process(
        self,
        input_path,
        output_rows,
        output_locations,
        output_fields,
        output_indicators,
        output_non_hierarchical_filename=None,
    ):
        unique_fields = set()
        with AmbiguousFile(input_path) as f_in, LZ4Writer(output_rows) as f_out:

            # If the CSV uses the wildcard field format AND the field value needs to be
            # included as part of the output field ID, then we need to use the
            # WildcardReader.
            if self.enable_field_wildcards and self.flatten_string_categories:
                reader = WildcardReader(f_in, delimiter=self.delimiter)
            else:
                # Otherwise, we can use a normal DictReader.
                reader = csv.DictReader(f_in, delimiter=self.delimiter)

                # If the user is using the field wildcard format but the column does not
                # contain category values, then this means the wildcard format indicates
                # which columns should be included in the output. Use this knowledge to
                # build the exact field list to use by inspecting the CSV header.
                self._update_fields_with_wildcard_fields(reader)

            # Set the fields to use if the user has specified ""
            self._set_fields(reader, f_out, unique_fields)

            # Write all remaining rows to the output file. There should be rows here if
            # rollup is enabled.
            self._write_remaining_rows(f_out, unique_fields)

        dimension_collector = self.dimension_cleaner.dimension_collector

        # Save meta info.
        self.counts[self.FIELDS_COUNT_LABEL] = len(unique_fields)
        self.counts[
            self.LOCATIONS_COUNT_LABEL
        ] = dimension_collector.hierarchical_dimension_count

        # Write meta files.
        LOG.info('Writing dimensions')
        write_hierarchical_dimensions(
            dimension_collector,
            output_locations,
            DimensionFactoryType.raw_prefix,
            DimensionFactoryType.clean_prefix,
        )

        if output_non_hierarchical_filename:
            write_non_hierarchical_dimensions(
                dimension_collector,
                output_non_hierarchical_filename,
                DimensionFactoryType.raw_prefix,
                DimensionFactoryType.clean_prefix,
            )

        self.write_fields(unique_fields, output_fields)
        if output_indicators:
            self.write_indicators(unique_fields, output_indicators)

    def process_row(self, orig_row):
        row = self._parse_row(orig_row)

        # Check whether the row has more values than the header
        if row.get(None):
            self.errors[self.EXTRA_VALS_ERROR_LABEL] += 1

        if self.datecol:
            # Parse the date
            input_date_str = row.get(self.datecol)
            if not input_date_str:
                self.errors[self.EMPTY_DATE_ERROR_LABEL] += 1
                return None

            date_str = _get_date(input_date_str)
            if not date_str:
                self.errors[self.UNPARSEABLE_DATE_ERROR_LABEL] += 1
                return None
        else:
            # Set date to today
            date_str = datetime.now().strftime(STANDARD_DATA_DATE_FORMAT)

        # Extract data.
        data = self._build_values(row)
        if not data:
            # Don't return a row if there's no valid data in it.
            self.errors[self.EMPTY_DATA_ROW_ERROR_LABEL] += 1
            return None

        self.counts[self.ROWS_STORED_COUNT_LABEL] += 1

        # If rollup is disabled, we should return the output BaseRow immediately so it
        # can be written.
        if not self.enable_rollup:
            return self._create_base_row(row, date_str, data)

        # With rollup enabled, we want to update (or create) the baserow that matches
        # this row's dimensions + date.
        self._store_values(row, date_str, data)

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

    def _extract_field_value(self, raw_field: str, raw_value: str) -> tuple:
        value_str = (
            raw_value
            if not self.val_clean_regex
            else self.val_clean_regex.sub('', raw_value)
        )

        value = _parse_numeric_value(value_str, not self.flatten_string_categories)
        if self.flatten_string_categories and value is None:
            raw_field = '%s - %s' % (raw_field, value_str.strip())
            value = 1

        field = _get_field_name(
            self.output_field_prefix, raw_field, self.enable_field_wildcards
        )

        # Detect when the raw field name is not slugify-able.
        # NOTE(stephen): We can't just check `not raw_field` since trailing
        # punctuation is dropped by slugify. Therefore, we check if the new
        # field name matches the prefix.
        if field == self.output_field_prefix:
            self.errors['bad fields'] += 1
            return (field, None)

        return (field, value)

    def _generate_disaggregations(self, row):
        ret = []
        for disagg in self.disaggregations:
            field_id_disagg = disagg['field_id']
            dims = disagg['dimensions']
            if self.fields:
                # Extract field as column
                # Get the value for this disaggregation. Note that we don't use the
                # field_id return by extract_field_value - we are building our own
                # disaggregated field id here.
                _, disagg_val = self._extract_field_value(
                    field_id_disagg, row[field_id_disagg]
                )
            else:
                field_name = row[UNPIVOTED_FIELD_COLUMN]
                if field_name != field_id_disagg and field_id_disagg != '*':
                    # The disaggregation rule doesn't apply to this field.
                    continue
                # Extract from key/val format
                _, disagg_val = self._extract_field_value(field_name, row[self.valcol])
            dim_vals = [row[dim] for dim in dims]
            disagg_slug = _get_field_name(
                self.output_field_prefix,
                '%s_%s' % (field_id_disagg, '_'.join(dim_vals)),
            )
            if self._should_exclude_value(disagg_val):
                continue
            ret.append((disagg_slug, disagg_val))
        return ret

    def _should_exclude_value(self, value):
        # Skip rows where the value is missing.
        return value is None or (self.exclude_zeros and value == 0)

    def _build_values(self, row):
        fields = self.fields

        # If field wildcards are enabled and the column contains category values, we
        # need to derive the fields in use for each row since it can change.
        if self.enable_field_wildcards and self.flatten_string_categories:
            fields = [column for column in row if column.startswith(FIELD_WILDCARD)]
            if not fields:
                raise RuntimeError(
                    'You enabled field wildcards but there are no columns '
                    'beginning with %s' % FIELD_WILDCARD
                )

        # Handle implicit field
        if not fields:
            (output_field, value) = self._extract_field_value(
                row[UNPIVOTED_FIELD_COLUMN], row[self.valcol]
            )
            # Skip rows where the value is missing.
            if value is None:
                return {}

            output = {output_field: value}
            if self.disaggregations:
                for disagg_field, disagg_val in self._generate_disaggregations(row):
                    output[disagg_field] = disagg_val
            return output

        # Handle fields list
        output = {}
        for field in fields:
            (output_field, value) = self._extract_field_value(field, row[field])
            # Skip rows where the value is missing.
            if self._should_exclude_value(value):
                continue
            output[output_field] = value

            if self.disaggregations:
                for disagg_field, disagg_val in self._generate_disaggregations(row):
                    output[disagg_field] = disagg_val

        return output

    def _build_row_key(self, row, date_str):
        '''Build a key for this row that will allow value rollup for common rows.

        If rollup is disabled, return a unique key to prevent rollup.
        '''
        assert (
            self.enable_rollup
        ), 'Row key generation should never happen if rollup is disabled'

        # Build an ID for this row based on its dimensions + date combination.
        dimension_key = u'__'.join(row.get(key, '') for key in self.dimensions)
        return u'%s__%s' % (dimension_key, date_str)

    def _extract_dimensions(self, row):
        dimensions = self.dimension_cleaner.process_row(row)
        if self.unmapped_dimensions:
            # Clone the cleaned dimensions and attach the unmapped dimensions.
            # NOTE(stephen): Need to clone the cleaned dimensions since the
            # dimension cleaner/collector will cache and reuse the output.
            dimensions = dict(dimensions)
            for dimension in self.unmapped_dimensions:
                if dimension in self.multi_value_dimensions:
                    dimension_keys = self.multi_value_dimensions[dimension]
                    dimensions[dimension] = [
                        row[key] for key in dimension_keys if row.get(key)
                    ]
                else:
                    dimval = row.get(dimension)
                    if dimval is not None:
                        dimensions[dimension] = dimval
        return dimensions

    def _create_base_row(self, row, date_str, values):
        output = BaseRowType(date=date_str, source=self.source)
        output.key = self._extract_dimensions(row)
        output.data = values
        return output

    def _store_values(self, row, date_str, values):
        row_key = self._build_row_key(row, date_str)
        if row_key not in self._rows:
            baserow = self._create_base_row(row, date_str, values)
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
        '''Given a set of fields, write a list of fields containing data.'''
        with open(path, 'w') as fields_out:
            for field in sorted(list(unique_fields)):
                fields_out.write('%s\n' % field)

    def write_indicators(self, unique_fields, path):
        '''Given a set of fields, write an indicator group object containing
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
        return text.capitalize()

    def print_report(self):
        LOG.info('Counts: %s', json.dumps(self.counts, indent=2))
        LOG.info('Errors: %s', json.dumps(self.errors, indent=2))


def setup_flags():
    Flags.PARSER.add_argument(
        '--dimensions',
        type=str,
        nargs='*',
        required=False,
        default=DIMENSIONS,
        help='List of dimensions columns separated by spaces. Defaults to all dimensions',
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
        '--set_cols',
        type=str,
        nargs='*',
        required=False,
        help='Set column values, formatted as "ColumnName:value".  '
        'For example: ProvinceName:Sindh. Applied after renaming.',
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

    Flags.PARSER.add_argument(
        '--date',
        type=str,
        required=False,
        help='The date column. If not set, date defaults to today',
    )

    Flags.PARSER.add_argument(
        '--value',
        type=str,
        required=False,
        default='val',
        help='The value column. If not set, defaults to "val"',
    )

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
        '--disaggregate',
        type=str,
        nargs='*',
        required=False,
        help='List of disaggregations to add for a given field.  fieldId:Dimension1,Dimension2 yields indicators for each combination of fieldId - Dimension1 - Dimension2',
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
        '--val_clean_regex',
        type=str,
        required=False,
        default=None,
        help='Regex that will remove characters from value column',
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
    Flags.PARSER.add_argument(
        '--output_non_hierarchical',
        type=str,
        required=bool(DimensionFactoryType.non_hierarchical_dimensions),
        help='Path to output non-hierarchical dimension values. This is only required '
        'if the deployment uses non-hierarchical dimensions.',
    )
    Flags.PARSER.add_argument(
        '--exclude_zeros',
        action='store_true',
        default=False,
        help='Ignore 0 valued rows.',
    )
    Flags.PARSER.add_argument(
        '--delimiter',
        type=str,
        required=False,
        default=',',
        help='Delimiter to use when parsing the input file.',
    )
    Flags.PARSER.add_argument(
        '--multi_value_dimensions',
        nargs='*',
        type=str,
        required=False,
        help='Optional multi value dimensions, formatted as '
        '"dimGroupName:dim1,dim2,dim3". For example: sick:cold,fever,cough',
    )

    Flags.InitArgs()


def main():
    setup_flags()

    rename_cols = Flags.ARGS.rename_cols
    set_cols = Flags.ARGS.set_cols
    join_cols = Flags.ARGS.join_cols
    join_str = Flags.ARGS.join_str
    dimensions = Flags.ARGS.dimensions
    fields = Flags.ARGS.fields
    datecol = Flags.ARGS.date
    valcol = Flags.ARGS.value
    source = Flags.ARGS.sourcename
    prefix = Flags.ARGS.prefix
    enable_rollup = not Flags.ARGS.disable_rollup
    flatten_string_categories = Flags.ARGS.flatten_string_categories
    tracer_field = Flags.ARGS.tracer_field
    enable_field_wildcards = Flags.ARGS.enable_field_wildcards
    exclude_zeros = Flags.ARGS.exclude_zeros
    multi_value_dimensions = Flags.ARGS.multi_value_dimensions

    disaggregate = Flags.ARGS.disaggregate
    disaggregations = []
    if disaggregate:
        # Parse string list of the form 'fieldID:dimension,dimension,...'
        for disagg_str in disaggregate:
            splits = disagg_str.split(':')
            disaggregations.append(
                {'field_id': splits[0], 'dimensions': splits[1].split(',')}
            )

    delimiter = Flags.ARGS.delimiter
    if delimiter.startswith('\\'):
        # Remove the backslash escape character and parse as the intended char. This
        # allows users to specify `--delimiter='\t'` on the command line without needing
        # to care about encoding. Otherwise, they would have to say `--delimiter=$'\t'`
        # which is less memorable.
        delimiter = delimiter.encode().decode('unicode_escape')

    agg = Aggregator(
        dimensions=dimensions,
        fields=fields,
        datecol=datecol,
        valcol=valcol,
        source=source,
        output_field_prefix=prefix,
        enable_rollup=enable_rollup,
        flatten_string_categories=flatten_string_categories,
        disaggregations=disaggregations,
        enable_field_wildcards=enable_field_wildcards,
        tracer_field=tracer_field,
        exclude_zeros=exclude_zeros,
        val_clean_regex_str=Flags.ARGS.val_clean_regex,
        delimiter=delimiter,
        multi_value_dimensions=multi_value_dimensions,
    )
    if rename_cols:
        agg.set_col_rename(rename_cols)
    if join_cols:
        agg.set_col_join(join_cols, join_str)
    if set_cols:
        agg.set_col_val(set_cols)
    LOG.info('Starting CSV processing.')
    agg.process(
        Flags.ARGS.input,
        Flags.ARGS.output_rows,
        Flags.ARGS.output_locations,
        Flags.ARGS.output_fields,
        Flags.ARGS.output_indicators,
        Flags.ARGS.output_non_hierarchical,
    )
    agg.print_report()


if __name__ == '__main__':
    sys.exit(main())
