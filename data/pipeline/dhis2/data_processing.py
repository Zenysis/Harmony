#!/usr/bin/env python
import gc
import re

from datetime import datetime, date
from typing import Optional, Dict, Callable, Any, Sequence, Union, List, Set

from dataclasses import dataclass
from isoweek import Week  # type: ignore

from config.datatypes import DimensionFactoryType
from config.system import STANDARD_DATA_DATE_FORMAT

from data.pipeline.datatypes.dimension_collector_io import (
    write_hierarchical_dimensions,
    write_non_hierarchical_dimensions,
)

from log import LOG
from util.file.compression.lz4 import LZ4Writer
from util.file.delimited_reader import DelimitedReader

QUARTER_TO_MONTH_LOOKUP = {'Q1': 1, 'Q2': 4, 'Q3': 7, 'Q4': 10}
SIX_MONTH_TO_MONTH_LOOKUP = {'S1': 1, 'S2': 7}
FULL_DATE_FORMAT = '%Y-%m-%d %H:%M:%S.0'


@dataclass(frozen=True)
class DHIS2Columns:
    data_element: str = 'Data'
    category_option_combo: str = 'Category option combo'
    org_unit: str = 'Organisation unit'
    period: str = 'Period'
    value: str = 'Value'


def row_is_header(row):
    return all(row[k] == k for k in row.keys())


class DHIS2DataAggregator:
    def __init__(
        self,
        locations_reader: Any,
        hierarchy: List[str],
        base_row_cls: Any,
        date_format: str,
        default_disaggregation: Union[str, Sequence[str]],
        data_source: str = 'DHIS2',
        parse_location_function: Callable = lambda x: x,
        custom_id_map: Optional[Dict] = None,
        column_names: DHIS2Columns = DHIS2Columns(),
        field_datasource_lookup: Optional[Dict] = None,
        prefix: str = '',
        suffix: str = '',
    ):
        self.dimension_cleaner = DimensionFactoryType.DimensionCleaner()
        self._data: Dict = {}
        self._data_source = data_source
        self._field_cache: Dict = {}
        self._hierarchy = hierarchy
        self._locations_lookup = self._get_locations(
            locations_reader, parse_location_function
        )
        self._custom_id_map = custom_id_map or {}
        self.errors: List[str] = []
        self.error_count = 0
        self.default_disaggregation = default_disaggregation
        self.out_count = 0
        self.base_row_cls = base_row_cls
        self.date_format = date_format
        self.column_names = column_names
        self.field_datasource_lookup = field_datasource_lookup or {}

        # Cache date conversions since datetime parsing is costly.
        self.date_cache: Dict = {}

        self.missing_locations: Set[str] = set()
        self.missing_fields: Set[str] = set()

        self._file_count = 0
        self._prefix = prefix
        self._suffix = suffix

    def get_date(self, input_date_str, date_offset=None):
        if input_date_str not in self.date_cache:
            self.date_cache[(input_date_str, date_offset)] = self.build_date(
                input_date_str, date_offset
            )
        return self.date_cache[(input_date_str, date_offset)]

    def build_date(self, input_date_str, date_offset=None):
        if date_offset is not None:
            return (
                datetime.strptime(input_date_str, self.date_format) + date_offset
            ).strftime(STANDARD_DATA_DATE_FORMAT)
        return datetime.strptime(input_date_str, self.date_format).strftime(
            STANDARD_DATA_DATE_FORMAT
        )

    def _get_locations(self, locations_reader, parse_location_function):
        locations_dict = {}
        for location in locations_reader:
            if parse_location_function:
                location_dim = {
                    level: parse_location_function(location.get(level, ''))
                    for level in self._hierarchy
                }
                locations_dict[location['id']] = location_dim
        return locations_dict

    def _build_field_id(self, raw_field, category_combo):
        if (raw_field, category_combo) in self._field_cache:
            return self._field_cache[(raw_field, category_combo)]
        output_field_id = self.add_prefix_and_suffix(
            self.build_field_id(raw_field, category_combo)
        )
        self._field_cache[(raw_field, category_combo)] = output_field_id
        return output_field_id

    def add_prefix_and_suffix(self, val):
        prefix = f'{self._prefix}_' if self._prefix else ''
        suffix = f'_{self._suffix}' if self._suffix else ''
        return f'{prefix}{val}{suffix}'

    def build_field_id(self, raw_field, category_combo):
        if not category_combo:
            field_id = raw_field.replace('.', '_')
            self._field_cache[(raw_field, category_combo)] = field_id
            return field_id
        field_id = raw_field
        if (
            category_combo == self.default_disaggregation
            or category_combo in self.default_disaggregation
        ):
            custom_field_id = self._custom_id_map.get(field_id, field_id)
            self._field_cache[(raw_field, category_combo)] = custom_field_id
            return custom_field_id
        field_id = f'{raw_field}.{category_combo}'
        return self._custom_id_map.get(field_id, field_id.replace('.', '_'))

    @staticmethod
    def _numerate_value(raw_value):
        bool_map = {'false': 0, 'true': 1}
        if raw_value.lower() in bool_map:
            return bool_map[raw_value.lower()]
        raw_value = raw_value.strip() or 0
        return raw_value

    def add_val_to_data(
        self, data, raw_field, category_combo, raw_value, assume_int=True
    ):
        # NOTE(stephen): Profiling has shown that float values have a sizable
        # cost to serialize to json for large datasets. Since DHIS2 is often
        # a large dataset, we apply this optimization to all DHIS2 data
        # processors.
        # NOTE(moriah): processing is taking too long, one of the things brought to light
        # by profiling is this check also is a bit of a time sync. I think it is safe to assume
        # some dhis2 instances that the values are all integers.
        if assume_int:
            value = int(float(raw_value))
        else:
            value = float(raw_value)
            if raw_value.endswith('.0'):
                value = int(value)

        field = self._build_field_id(raw_field, category_combo)
        if field in data:
            value += data[field]
        data[field] = value

    def build_base_row(self, organization_unit, date_str, datasource_category=''):
        base_row = self.base_row_cls(
            date=date_str, source=self._data_source + datasource_category
        )

        location_dim = self._locations_lookup[organization_unit]
        dimensions = self.dimension_cleaner.process_row(location_dim)
        base_row.key.update(dimensions)
        return base_row

    def _get_row_key(self, organization_unit, date_str, field):
        if self.field_datasource_lookup.get(field):
            # If field_datasource_lookup is provided, we shall treat each dhis2 group as a separate
            # datasource. This is required by our permissions system to restrict access to data by
            # group.
            return f'{organization_unit}__{date_str}__{self.field_datasource_lookup.get(field)}'
        return f'{organization_unit}__{date_str}'

    def process_row(self, row):
        organization_unit = row[self.column_names.org_unit]
        date_str = self.get_date(row[self.column_names.period])
        field = row[self.column_names.data_element]
        key = self._get_row_key(organization_unit, date_str, field)

        # Don't add missing location data to the output. Just log the data_processing
        # missing location IDs.
        if organization_unit not in self._locations_lookup:
            self.missing_locations.add(organization_unit)
            return

        if key not in self._data:
            self._data[key] = self.build_base_row(
                organization_unit, date_str, self.field_datasource_lookup.get(field, '')
            )
        try:
            self.add_val_to_data(
                self._data[key].data,
                field,
                row.get(self.column_names.category_option_combo),
                self._numerate_value(row[self.column_names.value]),
            )
        except Exception as err:
            LOG.error("Failed to process row: %s", dict(row))
            raise err

    def process_and_write(
        self,
        opts,
        buffer_size=-1,
        output_non_hierarchical_filename=None,
    ):
        output_file_pattern = opts['output_file_pattern']
        output_fields_path = opts['output_fields_path']
        output_locations_path = opts['output_locations_path']
        input_file = opts['input_file']
        data_reader = DelimitedReader(input_file)

        while (
            self.process_rows(
                data_reader,
                break_at=buffer_size,
                check_header=True,
            )
            >= buffer_size
        ):
            self.write_batch(output_file_pattern)

        # Make one more call to `write_batch` to write the final processed rows from the
        # end of the data reader. This final batch will be less than the buffer size,
        # causing the while loop to break out before it is written.
        self.write_batch(output_file_pattern)
        self.write_dimensions(
            output_locations_path,
            output_fields_path,
            output_non_hierarchical_filename=output_non_hierarchical_filename,
        )

    def process_rows(
        self,
        data_reader,
        count=0,
        break_at=-1,
        check_header=False,
    ):
        LOG.info('Starting row processing...')
        for row in data_reader:
            count += 1
            if not self._valid_and_processed(check_header, row):
                continue
            self._log_lines_read(count)
            if 0 < break_at <= count:
                LOG.info('Paused processing rows. Lines read: %d', count)
                return count
        LOG.info('Finished processing rows. Lines read: %d', count)
        return count

    def _valid_and_processed(self, check_header, row):
        # HACK(stephen): Trying to debug data corruption bugs we are seeing in one
        # deployment (Rwanda). Ideally we would not be testing this here and the
        # generate step would produce valid rows. However, we currently are only
        # seeing a small number of rows that get corrupted at a time, and it is
        # preventing the pipeline from completing.
        if check_header and row_is_header(row):
            return False
        if row.is_valid():
            self.process_row(row)
        else:
            self.error_count += 1
            self.errors.append(f'Corrupted row: {row.raw_row}')
        return True

    @staticmethod
    def _log_lines_read(count):
        if (count % 2000000) == 0:
            LOG.info('Lines read:\t%d', count)

    def write_dimensions(
        self,
        output_locations_path,
        output_fields_path,
        output_non_hierarchical_filename=None,
    ):
        dimension_collector = self.dimension_cleaner.dimension_collector
        write_hierarchical_dimensions(
            dimension_collector,
            output_locations_path,
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
        with open(output_fields_path, 'w') as output_fields:
            # Write a list of fields containing data
            for field in sorted(list(self._field_cache.values())):
                output_fields.write(f'{field}\n')

    def write_batch(self, output_file_pattern):
        output_file_path = output_file_pattern.replace('#', str(self._file_count))
        self.write_rows(output_file_path)
        self._file_count += 1

        # Delete reference to parent dictionary
        self._data.clear()

        # Clear GC to reclaim memory that should be released by the `data` dict
        # being emptied.
        LOG.info('Starting GC collection')
        gc.collect()
        LOG.info('Finished GC collection')

    def write_rows(self, output_file_path):
        # LOG.info(f'Writing to {output_file_path}...')
        with LZ4Writer(output_file_path) as output_file:
            for out_row in self._data.values():
                output_file.write(out_row.to_json(True))
                self.out_count += 1
                if (self.out_count % 50000) == 0:
                    LOG.info('Rows written: %d', self.out_count)

            LOG.info('Total rows written: %d', self.out_count)

    def write_output(
        self,
        output_file_path,
        output_fields_path,
        output_locations_path,
        output_non_hierarchical_filename=None,
    ):
        self.write_rows(output_file_path)
        self.write_dimensions(
            output_locations_path,
            output_fields_path,
            output_non_hierarchical_filename=output_non_hierarchical_filename,
        )

    def print_stats(self):
        dimension_collector = self.dimension_cleaner.dimension_collector
        stats = [
            '',
            '*' * 80,
            f'Errors ({self.error_count}):',
            '\n'.join(self.errors),
            '*' * 80,
            f'Output rows written: {self.out_count}',
            f'Locations written: {dimension_collector.hierarchical_dimension_count}',
            f'Missing Locations ({len(self.missing_locations)}): {self.missing_locations}',
            f'Missing Fields ({len(self.missing_fields)}): {self.missing_fields}',
        ]
        if DimensionFactoryType.non_hierarchical_dimensions:
            non_hierarchical_count = sum(
                len(v) for v in dimension_collector.non_hierarchical_items.values()
            )
            stats.append(
                f'Non hierarchical values written: {non_hierarchical_count}',
            )
        LOG.info('\n'.join(stats))

    def assert_success(self):
        assert not self.error_count, 'Not all rows could be successfully processed.'


def _start_date_lookup(period_lookup, input_date_str, year):
    month = period_lookup[input_date_str[4:]]
    date_tuple = (year, month, 1)
    return date(*date_tuple).strftime(STANDARD_DATA_DATE_FORMAT)


class ReportingPeriodDHIS2DataAggregator(DHIS2DataAggregator):
    '''Data fetched from dataValueSets API endpoint and analytics(not rawData) API endpoint does not
    have a period start date column so we have to calculate the period start date from the period
    '''

    @staticmethod
    def get_week_start_date(input_date_str: str) -> str:
        year = int(input_date_str[:4])
        pattern = r'\d+([a-zA-Z]+)\d+'
        match = re.search(pattern, input_date_str)
        if match:
            delimiter = match.group(1)
        else:
            raise ValueError(f'Invalid week format: {input_date_str}')
        week = Week(
            int(input_date_str[: len(str(year))]),
            int(input_date_str[4 + len(delimiter) :]),
        )
        week_start = {
            "W": week.friday,
            "WedW": week.wednesday,
            "SunW": week.sunday,
        }
        return week_start[delimiter]().strftime(STANDARD_DATA_DATE_FORMAT)

    def build_date(self, input_date_str: str, date_offset: Optional[int] = None):
        known_dhis2_date_formats = {'%Y%m%d', '%Y%B'}
        year = int(input_date_str[:4])
        if len(input_date_str) == 4:
            return date(year, 1, 1).strftime(STANDARD_DATA_DATE_FORMAT)
        if 'Q' in input_date_str:
            return _start_date_lookup(QUARTER_TO_MONTH_LOOKUP, input_date_str, year)
        # Week condition has to come before SixMonth because of 'SunW'
        if 'W' in input_date_str:
            return self.get_week_start_date(input_date_str)
        if 'S' in input_date_str:
            return _start_date_lookup(SIX_MONTH_TO_MONTH_LOOKUP, input_date_str, year)
        if len(input_date_str) == 6:
            return date(year, int(input_date_str[4:]), 1).strftime(
                STANDARD_DATA_DATE_FORMAT
            )
        for date_format in known_dhis2_date_formats:
            try:
                return datetime.strptime(input_date_str, date_format).strftime(
                    STANDARD_DATA_DATE_FORMAT
                )
            except ValueError:
                continue
        raise ValueError(f'Unknown date format: {input_date_str}')
