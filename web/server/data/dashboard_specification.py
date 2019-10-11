from builtins import object
from enum import IntEnum

FIELD_DIMENSION = 'field'
DATE_TIME_NOW = '@now'

MINIMUM_COLUMN_COUNT = 1
INVALID_INTEGER_VALUE = -1


class ValidationResult(object):
    def __init__(self, message, validation_fault):
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


def _validate_no_duplicates(items, duplicate_fault_code, item_type, id_field='id'):
    item_ids = set()
    errors = []
    for item in items:
        item_id = item.dictionary_representation[id_field]
        if item_id in item_ids:
            errors.append(
                ValidationResult(
                    'Multiple items of type %s have the same id: \'%s\'. '
                    % (item_type, item_id),
                    duplicate_fault_code,
                )
            )
        item_ids.add(item_id)

    return errors


def _validate_no_undefined(
    referenced_item_ids, defined_item_ids, undefined_fault_code, item_type
):
    errors = []
    for item_id in referenced_item_ids:
        if item_id not in defined_item_ids:
            errors.append(
                ValidationResult(
                    'Item of type %s with id: \'%s\' is referenced but not defined. '
                    % (item_type, item_id),
                    undefined_fault_code,
                )
            )

    return errors


def _get_id_to_object_mapping(items, id_field='id'):
    output = {}

    for item in items:
        output[item.dictionary_representation[id_field]] = item

    return output
