from builtins import object
from abc import ABCMeta, abstractmethod
from datetime import datetime
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import build_time_interval
from future.utils import with_metaclass

# Transform a date string into a date object by using the specified date format.


def _parse_date(date_str, date_format):
    return datetime.strptime(date_str, date_format).date()


class ValidationRow(with_metaclass(ABCMeta, object)):
    '''Base validation row type that provides a simple way to build a druid
    query and return its results. The `validate_result` method must be
    implemented by the subclass.
    '''

    def __init__(
        self,
        intervals,
        calculation,
        dimensions,
        dimension_filter,
        granularity,
        query_client=None,
        compute_field_calculation=None,
    ):
        self.intervals = intervals
        self.calculation = calculation
        self.dimensions = dimensions
        self.dimension_filter = dimension_filter
        self.granularity = granularity

        if query_client:
            self.query_client = query_client
        else:
            from db.druid.query_client import DruidQueryClient

            self.query_client = DruidQueryClient

        if compute_field_calculation:
            self.compute_field_calculation = compute_field_calculation
        else:
            from config.aggregation_rules import get_calculation_for_fields

            self.compute_field_calculation = get_calculation_for_fields

    def build_query(self, datasource_name):
        return GroupByQueryBuilder(
            datasource=datasource_name,
            granularity=self.granularity,
            grouping_fields=self.dimensions,
            intervals=self.intervals,
            calculation=self.calculation,
            dimension_filter=self.dimension_filter,
            optimize=True,
        )

    # Issue the druid query and validate the response. Return the result of
    # validation (True or False).
    def validate(self, datasource_name):
        query = self.build_query(datasource_name)
        result = self.query_client.run_query(query)
        return self.validate_result(result)

    # Validate the result returned by querying druid
    @abstractmethod
    def validate_result(self, pydruid_result):
        pass

    @classmethod
    def float_equivalent(cls, lhs, rhs):
        if lhs is None or rhs is None:
            return False
        return abs(lhs - rhs) < 1e-06


class FieldValidationRow(ValidationRow):
    '''Perform validation over a specified set of fields. Creates the intervals,
    calculations, and filters needed for validation.
    '''

    def __init__(
        self,
        fields,
        start_date,
        end_date,
        dimensions,
        dimension_values,
        granularity='all',
        query_client=None,
        compute_field_calculation=None,
    ):
        self.fields = fields
        self.start_date = start_date
        self.end_date = end_date
        self.dimension_values = dimension_values

        if not compute_field_calculation:
            from config.aggregation_rules import get_calculation_for_fields

            compute_field_calculation = get_calculation_for_fields

        # Build the params needed for ValidationRow
        intervals = [build_time_interval(self.start_date, self.end_date)]
        calculation = compute_field_calculation(fields)
        dimension_filter = GroupByQueryBuilder.build_dimension_filter(
            [dimension_values]
        )
        super(FieldValidationRow, self).__init__(
            intervals,
            calculation,
            dimensions,
            dimension_filter,
            granularity,
            query_client,
            compute_field_calculation,
        )

    @abstractmethod
    def validate_result(self, pydruid_result):
        pass


class SingleFieldValidationRow(FieldValidationRow):
    '''Transform a flat dictionary storing a single field value into a row that
     can be validated in druid.

     Input row format:
        {
            'dim_1': 'dim_1_value',
            'dim_2': 'dim_2_value',
            ...
            'start_date': '2017-11-01',
            'end_date': '2018-11-01',
            'field': 'hmis_indicator_0',
            'value': 200.0,
        }
    '''

    START_DATE_KEY = 'start_date'
    END_DATE_KEY = 'end_date'
    FIELD_KEY = 'field'
    VALUE_KEY = 'value'
    VALIDATED_VALUE_KEY = 'actual_value'
    PASSED_VALIDATION_KEY = 'passed_validation'

    DATE_FORMAT = '%Y-%m-%d'

    # TODO(stephen): Are dimension columns needed or can they be derived?
    def __init__(
        self, row, dimension_columns, query_client=None, compute_field_calculation=None
    ):
        self._original_row = dict(row)
        self.field = row[self.FIELD_KEY]
        self.expected_value = float(row[self.VALUE_KEY])
        self.actual_value = None
        self._passed_validation = False

        start_date = _parse_date(row[self.START_DATE_KEY], self.DATE_FORMAT)
        end_date = _parse_date(row[self.END_DATE_KEY], self.DATE_FORMAT)

        # NOTE(stephen): Currently only support single value validation
        granularity = 'all'

        # No dimensions to group by since we are calculating a single value
        # per row. This means we can use the optimized "timeseries" query type
        # (happens internally inside GroupByQueryBuilder)
        dimensions = []

        super(SingleFieldValidationRow, self).__init__(
            [self.field],
            start_date,
            end_date,
            dimensions,
            self._extract_dimension_values(row, dimension_columns),
            granularity,
            query_client,
            compute_field_calculation,
        )

    # Validate the values returned within the pydruid result
    def validate_result(self, pydruid_result):
        # Extract the raw result from the pydruid result.
        result = pydruid_result.result

        # This class only validates a single field value at a time for a single
        # date range. There should be at most one row returned.
        assert len(result) < 2, (
            'Invalid pydruid result returned. '
            'Field: %s\tDimension Filter: %s\tResult: %s'
            % (self.field, self.dimension_filter, result)
        )
        result_event = result[0]['result'] if result else {}
        return self._validate_value(result_event.get(self.field))

    # Compare the result value with the expected value and store the
    # validation result.
    def _validate_value(self, result_value):
        self.actual_value = result_value
        self._passed_validation = self.float_equivalent(
            result_value, self.expected_value
        )
        return self._passed_validation

    # Return a dictionary containing the original row merged with the
    # validation results.
    @property
    def validated_row(self):
        output = {
            self.VALIDATED_VALUE_KEY: self.actual_value,
            self.PASSED_VALIDATION_KEY: self._passed_validation,
        }
        output.update(self._original_row)
        return output

    # Create a dict that just contains the dimension keys and values
    @staticmethod
    def _extract_dimension_values(row, dimension_columns):
        return {dimension: row[dimension] for dimension in dimension_columns}


class DruidEventValidationRow(FieldValidationRow):
    RESULT_FIELD_PREFIX = 'actual_'
    START_DATE_KEY = 'start_date'
    END_DATE_KEY = 'end_date'
    DATE_FORMAT = '%Y-%m-%d'

    def __init__(self, event_row, query_client=None, compute_field_calculation=None):
        self._original_event = event_row
        (dimension_values, self.metrics, start_date, end_date) = self.parse_event(
            event_row
        )
        self.success_fields = set()
        self.failed_fields = set()
        self._result_metrics = {}
        self._passed_validation = True

        # NOTE(stephen): Currently only support single date period validation
        granularity = 'all'

        # No dimensions to group by since we are calculating a single value
        # per row. This means we can use the optimized "timeseries" query type
        # (happens internally inside GroupByQueryBuilder)
        dimensions = []
        super(DruidEventValidationRow, self).__init__(
            list(self.metrics.keys()),
            start_date,
            end_date,
            dimensions,
            dimension_values,
            granularity,
            query_client,
            compute_field_calculation,
        )

    # Validate the values returned within the pydruid result
    def validate_result(self, pydruid_result):
        # Extract the raw result from the pydruid result.
        result = pydruid_result.result

        # This class only validates a single event result for a single date
        # range and dimension filter. There should only be at most one row
        # returned.
        assert len(result) < 2, (
            'Invalid pydruid result returned. '
            'Dimensions: %s\tMetrics: %s\tResult: %s'
            % (self.dimensions, self.metrics, result)
        )
        result_event = result[0]['result'] if result else {}
        return self._validate_result_event(result_event)

    # Compare the result values with the expected values and store the
    # validation result.
    def _validate_result_event(self, result_event):
        for field, expected_value in self.metrics.items():
            actual_value = result_event.get(field)
            result_field = self.get_result_field(field)
            self._result_metrics[result_field] = actual_value

            if not self.float_equivalent(actual_value, expected_value):
                self.failed_fields.add(field)
                self._passed_validation = False
            else:
                self.success_fields.add(field)

        return self._passed_validation

    @classmethod
    def get_result_field(cls, field_id):
        return '%s%s' % (cls.RESULT_FIELD_PREFIX, field_id)

    # Return a dictionary containing the original row merged with the
    # validation results.
    @property
    def validated_row(self):
        output = {
            self.START_DATE_KEY: self.start_date.strftime(self.DATE_FORMAT),
            self.END_DATE_KEY: self.end_date.strftime(self.DATE_FORMAT),
        }
        output.update(self.dimension_values)
        output.update(self.metrics)
        output.update(self._result_metrics)
        return output

    @classmethod
    def parse_event(cls, raw_event):
        event = dict(raw_event)
        dimensions = {}
        metrics = {}
        # Remove the start and end dates from the event and leave only the
        # dimensions and metrics behind.
        start_date_str = event.pop(cls.START_DATE_KEY)
        end_date_str = event.pop(cls.END_DATE_KEY)

        for key, value in event.items():
            if isinstance(value, str):
                dimensions[key] = value
            elif isinstance(value, float):
                metrics[key] = value
            else:
                assert False, 'Invalid value type. Must be string or float: %s' % value

        return (
            dimensions,
            metrics,
            _parse_date(start_date_str, cls.DATE_FORMAT),
            _parse_date(end_date_str, cls.DATE_FORMAT),
        )
