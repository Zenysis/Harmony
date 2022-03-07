from enum import IntEnum

FIELD_DIMENSION = 'field'
DATE_TIME_NOW = '@now'

MINIMUM_COLUMN_COUNT = 1
INVALID_INTEGER_VALUE = -1

# TODO(vedant) Make this an IntFlag once we move to Python 3
class ValidationFault(IntEnum):
    '''
    No errors in the provided document.
    '''

    NONE = 0

    '''
    The dashboard specification is missing a version field.
    '''
    MISSING_VERSION = 1

    '''
    The dashboard specification is missing a version field.
    '''
    INVALID_VERSION = 2

    '''
    The dashboard specification contained a valid version but for an unspecified
    reason, the upgrade from the original version to the latest version failed.
    '''
    UPGRADE_FAILED = 3

    '''
    The dashboard specification contained a valid version but for an unspecified
    reason, the specififcation could not be correctly parsed.
    '''
    MALFORMED_SPECIFICATION = 4

    '''
    The dashboard specification contained a valid version but for an unspecified
    reason, the downgrade from the original version to the previous version failed.
    '''
    DOWNGRADE_FAILED = 5


class ValidationResult:
    def __init__(self, message: str, validation_fault: ValidationFault):
        self.message = message
        self.validation_fault = validation_fault

    @property
    def serialize(self):
        return {'message': self.message, 'validationFault': self.validation_fault.name}

    def __repr__(self):
        return '[ Message: \'%s\', Fault: \'%s\' ]' % (
            self.message,
            self.validation_fault,
        )
