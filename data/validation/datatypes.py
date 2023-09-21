from enum import Enum

from log import LOG


class OverallValidationStatus(Enum):
    '''Final result of validation'''

    FAILURE = 'FAILURE'
    SUCCESS = 'SUCCESS'


class ValidatorSummary:
    '''Store high level validation result counts and debug information.'''

    def __init__(self):
        self.processed_count = self.success_count = self.failure_count = 0
        self.overall_status = OverallValidationStatus.SUCCESS

    # NOTE: Assuming the result passed in is a boolean. If a validator
    # needs more information than just a boolean to store the result, then
    # `store_result` should be overriden in a derived class.
    # pylint: disable=unused-argument
    def store_result(self, result, row):
        self.processed_count += 1
        if result:
            self.success_count += 1
        else:
            self.failure_count += 1
            self.overall_status = OverallValidationStatus.FAILURE

    def print_summary(self):
        LOG.info('Rows processed: %s', self.processed_count)
        LOG.info('Rows passed validation: %s', self.success_count)
        LOG.info('Rows failed validation: %s', self.failure_count)
        LOG.info('Overall status: %s', self.overall_status.value)

    def to_dict(self):
        return {
            'status': self.overall_status.value,
            'processed_count': self.processed_count,
            'success_count': self.success_count,
            'failure_count': self.failure_count,
        }
