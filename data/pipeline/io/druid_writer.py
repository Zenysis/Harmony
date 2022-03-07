import json

from collections import defaultdict
from datetime import datetime

from log import LOG

# When we are running inside PyPy, we can use the optimized StringBuilder type to
# help serialize JSON.
try:
    from __pypy__.builders import StringBuilder
    from _pypyjson import raw_encode_basestring_ascii
except ImportError:
    StringBuilder = None

    # NOTE(stephen): This is the equivalent function in CPython. Since we do not expect
    # the DruidWriter to be used very often with CPython, it is ok to have this
    # unoptimized function which slices the string after it is converted to remove the
    # enclosing quotes.
    raw_encode_basestring_ascii = lambda s: json.encoder.encode_basestring_ascii(s)[
        1:-1
    ]

INFINITY = float('inf')
NAN = float('nan')


class RowMetaData:
    def __init__(self):
        self.count = 0
        self.start_date = datetime.today().strftime('%Y-%m-%d')
        self.end_date = ''

    def update_metadata_with_row(self, row):
        self.count += 1
        if row.date < self.start_date:
            self.start_date = row.date
        if row.date > self.end_date:
            self.end_date = row.date


class ErrorHandler:
    '''Class to log and optionally raise errors that are found during conversion
    from BaseRow to Druid rows.
    '''

    def __init__(
        self,
        allow_missing_date=False,
        allow_empty_data=True,
        allow_missing_canonical_match=False,
    ):
        self.allow_missing_date = allow_missing_date
        self.allow_empty_data = allow_empty_data
        self.allow_missing_canonical_match = allow_missing_canonical_match

        # The number of rows that were missing a date value.
        self.missing_date_count = 0

        # The number of rows that had no metrics to write (data section was
        # empty).
        self.empty_data_count = 0

        # Counts of input dimensions that could not be matched to a canonical.
        self.failed_matches = defaultdict(int)

    def missing_date(self, input_row_str):
        assert self.allow_missing_date, (
            'All output rows must have a date! ' 'Input row: %s' % input_row_str
        )
        self.missing_date_count += 1

    def empty_data(self, input_row_str):
        assert self.allow_empty_data, (
            'All input rows must have a non-empty data field! '
            'Input row: %s' % input_row_str
        )
        self.empty_data_count += 1

    def missing_canonical_match(self, input_dimensions, input_row_str):
        assert (
            self.allow_missing_canonical_match
        ), 'Canonical matching failed for row. ' 'Dimensions: %s\nInput row: %s' % (
            input_dimensions,
            input_row_str,
        )
        key = frozenset(list(input_dimensions.items()))
        self.failed_matches[key] += 1

    def print_stats(self):
        if self.missing_date_count:
            LOG.info('Rows missing a date: %s', self.missing_date_count)
        if self.empty_data_count:
            LOG.info('Rows without any data: %s', self.empty_data_count)
        if self.failed_matches:
            rows_failed_count = sum(self.failed_matches.values())
            matches_failed_count = len(self.failed_matches)
            LOG.info('Rows with missing canonical match: %s', rows_failed_count)
            LOG.info(
                'Input dimensions without canonical match: %s', matches_failed_count
            )
            lines = ['Row Dimensions\tCount']
            for key, value in self.failed_matches.items():
                lines.append('%s\t%s' % (dict(key), value))
            LOG.info(
                'Canonical mapping is missing for these dimension ' 'combinations:\n%s',
                '\n'.join(lines),
            )


class DruidWriter:
    '''Utility class for translating an input file of BaseRows into a Druid
    compatible row format containing the final canonical dimensions.
    '''

    @classmethod
    def run(
        cls,
        base_row_cls,
        metadata_collector,
        input_file,
        output_file,
        use_optimizations=True,
        error_handler=None,
        output_metadata_digest_writer=None,
    ):
        '''Convert rows stored in `input_file` into Druid output rows and store
        them in `output_file`.

        Args:
            base_row_cls: The concrete BaseRow subclass input rows are stored
                as. Example: BaseEthiopiaRow
            metadata_collector: A FullRowDimensionDataCollector instance that
                can convert the dimensions stored in an input row into canonical
                dimensions to store in the Druid output row.
            input_file: A file handle that serialized input rows will be read
                from.
            output_file: A file-like handle (supports `write(str)`) that output
                Druid rows will be written to.
            use_optimizations: Optional. If enabled, produce Druid rows using
                experimental performance improvements that attempt to reduce
                JSON parsing to the smallest amount possible.
            error_handler: Optional. An ErrorHandler instance that will collect
                and optionally raise issue found when converint an input row
                into Druid row format.
        '''
        error_handler = error_handler or ErrorHandler()

        # By default, use safe parsers and output row writers that will
        # deserialize the entire input row. Write output rows by serializing
        # the parsed full input row instance into druid format
        (parse_row, write_output_rows) = Parser.safe_parser(base_row_cls)
        if use_optimizations:
            # Produce Druid rows using experimental performance improvements.
            # Attempt to reduce JSON parsing to the smallest amount possible.
            # Because we know the structure of our BaseRow datatype, we can
            # exploit this knowledge to work around JSON serialization
            # limitations. JSON serialization/deserialization is one of the most
            # costly operations that is performed in this step. Most of this
            # cost comes from the large `data` object stored in the base row. It
            # is possible to remove this object from the json string before
            # deserialization and add it back in when we are ready to serialize
            # it again.
            (parse_row, write_output_rows) = Parser.optimized_parser(base_row_cls)

        return cls._run(
            base_row_cls,
            metadata_collector,
            input_file,
            output_file,
            error_handler,
            parse_row,
            write_output_rows,
            output_metadata_digest_writer,
        )

    @classmethod
    def _run(
        cls,
        base_row_cls,
        metadata_collector,
        input_file,
        output_file,
        error_handler,
        parse_row,
        write_output_rows,
        output_metadata_digest_writer,
    ):
        LOG.info('Starting processing')

        input_row_count = output_row_count = 0
        unmapped_keys = base_row_cls.UNMAPPED_KEYS
        has_unmapped_keys = bool(unmapped_keys)
        datasource_field_metadata = defaultdict(RowMetaData)
        for input_row in input_file:
            (row, has_data, parsed_extras) = parse_row(input_row)
            input_row_count += 1
            if not row.date:
                error_handler.missing_date(input_row)
                continue

            if not has_data:
                error_handler.empty_data(input_row)
                continue
            for data in row.data:
                datasource_field_metadata[data].update_metadata_with_row(row)

            # Match the input dimensions to their canonical version.
            row_dimensions = row.key
            output_dimensions = metadata_collector.get_data_for_row(row_dimensions)

            if not output_dimensions:
                error_handler.missing_canonical_match(row_dimensions, input_row)
                continue

            # Copy unmapped key values into output dimension dict
            if has_unmapped_keys:
                # Need to clone the canonical dimensions since we don't want to
                # modify the version owned by the metadata_collector.
                output_dimensions = dict(output_dimensions)
                for key in unmapped_keys:
                    # NOTE(stephen): Only copy the value over from the original row if
                    # a value has not been set yet. This *might* happen if the user has
                    # supplied metadata for a canonical row while also allowing process
                    # steps to fill it in directly. Prefer the canonical metadata value
                    # instead.
                    # TODO(stephen): Should we warn when this happens?
                    output_dimensions[key] = output_dimensions.get(
                        key, row_dimensions.get(key, '')
                    )

            row.key = output_dimensions
            rows_written = write_output_rows(row, output_file, parsed_extras)
            output_row_count += rows_written

            if (input_row_count % 20000) == 0:
                LOG.info('Rows processed: %s', input_row_count)
        if output_metadata_digest_writer:
            output_metadata_digest_writer.writeheader()
            for field in datasource_field_metadata:
                output_metadata_digest_writer.writerow(
                    {
                        'indicator_id': field,
                        'count': datasource_field_metadata[field].count,
                        'start_date': datasource_field_metadata[field].start_date,
                        'end_date': datasource_field_metadata[field].end_date,
                    }
                )

        LOG.info('Finished processing')
        LOG.info('Input rows processed: %s', input_row_count)
        LOG.info('Output rows written: %s', output_row_count)
        error_handler.print_stats()


class Parser:
    '''Class providing the various serialization/deserialization methods that
    are supported.

    Each method returns a tuple of (parse_row, write_output_rows). The signature
    of these functions is:
        parse_row(row_str) -> (BaseRow, has_data?, extras from parsing)
        write_output_rows(base_row, output_file, extras from parsing)
            -> output count
    '''

    @staticmethod
    def safe_parser(base_row_cls):
        deserialize_fn = base_row_cls.from_json

        def parse_row(row_str):
            base_row = deserialize_fn(row_str)
            return (base_row, bool(base_row.data), None)

        def write_output_rows(row, output_file, _):
            output_row_count = 0
            for output_row in row.to_druid_json_iterator(True):
                output_file.write(output_row)
                output_row_count += 1
            return output_row_count

        return (parse_row, write_output_rows)

    @staticmethod
    def optimized_parser(base_row_cls):
        deserialize_fn = base_row_cls.from_json

        def parse_row(row_str):
            return parse_row_optimized(row_str, deserialize_fn)

        def write_output_rows(row, output_file, raw_data):
            return write_output_rows_optimized(row, raw_data, output_file)

        return (parse_row, write_output_rows)


## Methods for manually serializing/deserializing BaseRows into Druid format ##

DATA_MARKER = '"data": {'

# Build a minimal BaseRow for the given json string by extracting the raw data
# and storing it separately. Return both the full row object and the raw data
# string.
def parse_row_optimized(row_str, deserialize_fn):
    # Find the start and end index of the contents of the `data` object.
    start_idx = row_str.index(DATA_MARKER) + len(DATA_MARKER)
    end_idx = row_str.index('}', start_idx)
    raw_data = row_str[start_idx:end_idx]
    base_row = deserialize_fn('%s%s' % (row_str[:start_idx], row_str[end_idx:]))
    return (base_row, bool(raw_data), raw_data)


def serialize_dimension_mapping(mapping):
    '''Build a "key": "value" JSON serialized mapping. The returned string can be used
    inside a JSON object.

    Optimization: We know that the dimension mapping should only be a Dict[str, str], so
    we can optimize how this string is built. To be safe, we will fallback when other
    values are encountered.

    NOTE(stephen): This is a super optimized version of PyPy's
    JSONEncoder.__encode_dict. It only is beneficial when PyPy is being used.
    '''
    # Safeguard check in case this method was run inside CPython.
    if not StringBuilder:
        return json.dumps(mapping)[1:-1]

    builder = StringBuilder()
    first = True
    for key, value in mapping.items():
        # Add the separator at the end of the last key/value pair.
        if not first:
            builder.append(', ')
        first = False

        # Add the key to the string.
        builder.append('"')
        builder.append(raw_encode_basestring_ascii(key))
        builder.append('": ')

        if isinstance(value, str):
            builder.append('"')
            builder.append(raw_encode_basestring_ascii(value))
            builder.append('"')
        elif isinstance(value, int):
            builder.append(int.__str__(key))
        elif isinstance(value, float):
            # Disallow NaN, Infinity, and -Infinity since those indicate the pipeline
            # is not producing valid data and should be reviewed.
            assert value not in (NAN, INFINITY, -INFINITY), (
                'Bad float value passed: %s' % value
            )
            builder.append(float.__repr__(value))
        else:
            LOG.error(
                'Unexpected dimension value found. Key: %s, Value: %s', key, value
            )
            builder.append(json.dumps(value))
    return builder.build()


# Take a row that is ready for output and add the raw data object back in. Write
# the serialized version to the output file.
def write_output_rows_optimized(row, raw_data, output_file):
    # Build a JSON row that does not have a closing brace. It will look like:
    # { ...dimensions, "Real_Date": "2021-01-01", "source": "pipeline_source"
    # NOTE(stephen): Only need to JSON serialize the dimensions and the row's source
    # value since we know that the date and source field key are JSON safe.
    open_row_str = '{%s, "%s": "%s", "%s": "%s"' % (
        serialize_dimension_mapping(row.key),
        row.DATE_FIELD,
        row.date,
        row.SOURCE_FIELD,
        raw_encode_basestring_ascii(row.source),
    )

    count = 0
    (zero_fields, nonzero_data) = extract_zero_fields(raw_data)
    if zero_fields:
        output_file.write(
            '%s, "field": [%s], "val": 0}\n' % (open_row_str, zero_fields)
        )
        count += 1

    if nonzero_data:
        output_file.write('%s, "data": {%s}}\n' % (open_row_str, nonzero_data))
        count += 1
    return count


# Determine if there are enough zero value fields in the raw data to make it
# worth it to split them out separately.
def _has_enough_zero_values(raw_data, min_count=3):
    count_zero_int = raw_data.count(': 0,') + int(raw_data.endswith(': 0'))
    if count_zero_int > min_count:
        return True

    count_zero_float = raw_data.count(': 0.0,') + int(raw_data.endswith(': 0.0'))
    return (count_zero_int + count_zero_float) > min_count


# Remove zero fields from the raw_data so that the nested json that is sent
# to druid is only non-zero values. Zero values will be passed as a list of
# fields all in one row.
def extract_zero_fields(raw_data):
    if not _has_enough_zero_values(raw_data):
        return (None, raw_data)

    zero_fields = []
    idx = 0
    end_idx = len(raw_data)
    ends_with_zero = False
    nonzero_start_idx = 0
    nonzero_end_idx = 0
    nonzero_indices = []
    while idx < end_idx:
        # Get the start/end index of the field string key. Include the quotation
        # marks so we can avoid adding them back later.
        field_start_idx = raw_data.index('"', idx)
        field_end_idx = raw_data.index('": ', field_start_idx) + 1

        # Get the start/end index of the field's value.
        value_start_idx = field_end_idx + 2
        value_end_idx = raw_data.find(', ', value_start_idx)

        # Ensure we don't overflow the data section. This happens when parsing
        # the final value of the data object.
        if value_end_idx == -1 or value_end_idx > end_idx:
            value_end_idx = end_idx

        raw_value = raw_data[value_start_idx:value_end_idx]
        if raw_value == '0' or raw_value == '0.0':
            zero_fields.append(raw_data[field_start_idx:field_end_idx])
            ends_with_zero = value_end_idx == end_idx

            if nonzero_end_idx > nonzero_start_idx:
                nonzero_indices.append((nonzero_start_idx, nonzero_end_idx))

            # Set the start of the next potential nonzero segment to begin
            # right after this nonzero value ends.
            nonzero_start_idx = value_end_idx

            # If the first value encountered is a zero, and no non-zero values
            # have been found yet, then we want to increment the start index
            # to drop the leading ', '.
            if not nonzero_indices:
                nonzero_start_idx += 2
        else:
            nonzero_end_idx = value_end_idx

        # Move on to the next field/value to parse.
        idx = value_end_idx + 1

    if not ends_with_zero:
        nonzero_indices.append((nonzero_start_idx, end_idx))

    nonzero_data = ''.join(
        raw_data[start_idx:end_idx] for start_idx, end_idx in nonzero_indices
    )

    return (', '.join(zero_fields), nonzero_data)
