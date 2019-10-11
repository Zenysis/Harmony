import csv

from data.validation.metrics.base_metric_validator import BaseMetricValidator
from data.validation.metrics.datatypes import (
    SingleFieldValidationRow,
    DruidEventValidationRow,
)
from log import LOG


class CSVValidator(BaseMetricValidator):
    '''Validator that performs validation on a properly formatted CSV.

    The CSV should have the form:
    dim_1,dim_2,dim_3,...,start_date,end_date,field,value
    '''

    _NON_DIMENSION_COLUMNS = [
        SingleFieldValidationRow.START_DATE_KEY,
        SingleFieldValidationRow.END_DATE_KEY,
        SingleFieldValidationRow.FIELD_KEY,
        SingleFieldValidationRow.VALUE_KEY,
        SingleFieldValidationRow.VALIDATED_VALUE_KEY,
        SingleFieldValidationRow.PASSED_VALIDATION_KEY,
    ]

    def __init__(self, datasource_name, dimensions, delimiter=','):
        super(CSVValidator, self).__init__(datasource_name)
        self.dimensions = dimensions
        self.delimiter = delimiter
        self.output_fields = None

    # The workhorse function: read the input file and build a set of validatable
    # rows from it. Validate each row against the specified datasource, and
    # write the results to the output file.
    def parse_and_run(self, input_filename, output_filename):
        LOG.info('Starting validation for file: %s', input_filename)
        (self.rows, input_fields) = self._import_rows(input_filename)
        self.output_fields = self._build_output_fields(input_fields)
        LOG.info('Successfully read %s rows', len(self.rows))
        LOG.debug('Output fields: %s', self.output_fields)

        # Run validation over the ingested rows
        # NOTE(stephen): Right now, we are issuing a single query per row to
        # druid. It has been fast enough in testing, but if we get to a state
        # where it takes too long, consider optimizing the query style.
        LOG.info('Starting validation')
        self.run()

        LOG.info('Writing validation results to file: %s', output_filename)
        self.write_validation_report(output_filename)
        self.summary.print_summary()

    # Parse the input csv file into a type that can be validated
    def _import_rows(self, input_filename):
        rows = []
        fieldnames = None
        with open(input_filename) as input_file:
            reader = csv.DictReader(
                input_file, delimiter=self.delimiter, skipinitialspace=True
            )
            fieldnames = reader.fieldnames
            for row in reader:
                validation_row = SingleFieldValidationRow(row, self.dimensions)
                rows.append(validation_row)

        return (rows, fieldnames)

    # Write the validation results to the specified CSV file.
    def write_validation_report(self, output_filename):
        with open(output_filename, 'w') as output_file:
            writer = csv.DictWriter(
                output_file, delimiter=self.delimiter, fieldnames=self.output_fields
            )
            writer.writeheader()
            for row in self.rows:
                writer.writerow(row.validated_row)

    # Build the field order that will be used when writing the output
    # validation report CSV
    @classmethod
    def _build_output_fields(cls, input_fields):
        # All dimension and metadata columns should come before the non
        # dimension columns. This makes it easy for the user to always see the
        # validation result on the far right of the output CSV.
        return [
            f for f in input_fields if f not in cls._NON_DIMENSION_COLUMNS
        ] + cls._NON_DIMENSION_COLUMNS


class PivotedCSVValidator(BaseMetricValidator):
    FAILED_COUNT_FIELD = 'failed_count'
    SUCCESS_COUNT_FIELD = 'success_count'

    _NON_DIMENSION_COLUMNS = [
        SUCCESS_COUNT_FIELD,
        FAILED_COUNT_FIELD,
        DruidEventValidationRow.START_DATE_KEY,
        DruidEventValidationRow.END_DATE_KEY,
    ]

    '''Validator that performs validation on a pivoted CSV where all
    non dimension columns are fields to validate. The structure is similar to
    the flattened rows druid returns when we issue queries.

    The CSV should have the form:
    dim_1,dim_2,dim_3,start_date,end_date,...,field_1,field_2,...,field_n
    '''

    def __init__(self, datasource_name, dimensions, delimiter=','):
        super(PivotedCSVValidator, self).__init__(datasource_name)
        self.delimiter = delimiter
        self.dimensions = dimensions
        self.non_metric_fields = dimensions + self._NON_DIMENSION_COLUMNS
        self.metric_fields = None
        self.field_order = None

    # The workhorse function: read the input file and build a set of validatable
    # rows from it. Validate each row against the specified datasource, and
    # write the results to the output file.
    def parse_and_run(self, input_filename, output_filename):
        LOG.info('Starting validation for file: %s', input_filename)
        (self.rows, self.field_order) = self._import_rows(input_filename)
        self.metric_fields = self._extract_metric_fields(self.field_order)
        LOG.info('Successfully read %s rows', len(self.rows))
        LOG.debug('Metrics to query: %s', self.metric_fields)

        # Run validation over the ingested rows
        # NOTE(stephen): Right now, we are issuing a single query per row to
        # druid. It has been fast enough in testing, but if we get to a state
        # where it takes too long, consider optimizing the query style.
        LOG.info('Starting validation')
        self.run()

        LOG.info('Writing validation results to file: %s', output_filename)
        self.write_validation_report(output_filename)
        self.summary.print_summary()

    # Parse the input csv file into a type that can be validated
    def _import_rows(self, input_filename):
        rows = []
        fieldnames = None
        with open(input_filename) as input_file:
            reader = csv.DictReader(
                input_file, delimiter=self.delimiter, skipinitialspace=True
            )
            fieldnames = reader.fieldnames
            for row in reader:
                validation_row = DruidEventValidationRow(self._parse_row(row))
                rows.append(validation_row)

        return (rows, fieldnames)

    def _parse_row(self, row):
        output = {}
        for key, value in row.items():
            if key in self.non_metric_fields:
                output[key] = value
            elif value:
                try:
                    output[key] = float(value)
                except ValueError:
                    # Ignoring the case where some rows may return invalid from
                    # a sql fetch.
                    pass
        return output

    # Write the validation results to the specified CSV file. Defaults to
    # all metrics if no fields are specified.
    def write_validation_report(self, output_filename, metric_fields=None):
        metric_fields = set(metric_fields or self.metric_fields)

        # All dimension and metadata columns should come before the
        # non-dimension columns. This makes it easy for the user to always see
        # the validation result on the far right of the output CSV. The output
        # metric field order should match the original metric field order but
        # also include the metric validation result side-by-side.
        output_fields = self.dimensions + self._NON_DIMENSION_COLUMNS
        for field in self.field_order:
            if field in metric_fields:
                result_field = DruidEventValidationRow.get_result_field(field)
                output_fields.append(field)
                output_fields.append(result_field)

        with open(output_filename, 'w') as output_file:
            writer = csv.DictWriter(
                output_file,
                delimiter=self.delimiter,
                fieldnames=output_fields,
                extrasaction='ignore',
            )
            writer.writeheader()
            for row in self.rows:
                output_row = {
                    self.SUCCESS_COUNT_FIELD: len(row.success_fields),
                    self.FAILED_COUNT_FIELD: len(row.failed_fields),
                }
                output_row.update(row.validated_row)
                writer.writerow(output_row)

    # Write the failed validation fields to the specified CSV file.
    def write_failed_validation_report(self, output_filename):
        # Collect the failed metrics across all rows
        metric_fields = set()
        for row in self.rows:
            metric_fields.update(row.failed_fields)

        self.write_validation_report(output_filename, metric_fields)

    def _extract_metric_fields(self, input_fields):
        '''Extract the metric fields from the input_fields list.'''

        metric_fields = []
        for field in input_fields:
            if field not in self.non_metric_fields:
                metric_fields.append(field)
        return metric_fields
