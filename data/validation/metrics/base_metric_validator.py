from builtins import object
from data.validation.datatypes import ValidatorSummary


class BaseMetricValidator(object):
    '''Base class for validating a set of ValidationRows and storing the results
    '''

    # NOTE(stephen): Datasource is taken as a parameter to the metric validator
    # instead of as a paramter to ValidationRows so that we can validate the
    # same row multiple times across different datasources without duplicating
    # or modifying the original ValidationRow.
    def __init__(self, datasource_name):
        self.datasource_name = datasource_name
        self.processed_count = self.success_count = self.failure_count = 0
        self._rows = []
        self._summary = ValidatorSummary()

    # Validate each row and store its results.
    def run(self):
        for row in self.rows:
            success = row.validate(self.datasource_name)
            self.summary.store_result(success, row)

    @property
    def passed_validation(self):
        return self.success_count > 0 and self.failure_count == 0

    @property
    def rows(self):
        return self._rows

    @rows.setter
    def rows(self, rows):
        self._rows = rows

    @property
    def summary(self):
        return self._summary

    @summary.setter
    def summary(self, summary):
        assert isinstance(summary, ValidatorSummary), (
            'Summary instance must derive from ValidatorSummary. '
            'New summary type: %s' % type(summary)
        )

        self._summary = summary
