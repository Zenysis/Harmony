# mypy: disallow_untyped_defs=True
from datetime import datetime, timezone

from config.system import STANDARD_DATA_DATE_FORMAT

# value for 2038-01-01, roughly the max date that datetime.fromtimestamp can handle
MAX_TIMESTAMP_MS = 2145934800000

# HACK(yitian): Uncustomized fieldId required to power dql links.
def get_raw_field_id(field_id: str) -> str:
    ''' Returns the uncustomized fieldId.
    '''
    return field_id.split('__')[0]


def convert_epoch_ms_to_date(epoch_timestamp: float) -> str:
    '''Converts the output format for the druid __time field (epoch milliseconds) to a date string
    '''
    # When there are no rows for an indicator, druid will return the default value (positive or
    # negative infinity) for the timestamp. To account for this, we clip the range to the valid
    # datetime.fromtimestamp range
    safe_epoch_timestamp = min(max(epoch_timestamp, 0), MAX_TIMESTAMP_MS)
    date = datetime.fromtimestamp(safe_epoch_timestamp / 1000, tz=timezone.utc)
    return date.strftime(STANDARD_DATA_DATE_FORMAT)
