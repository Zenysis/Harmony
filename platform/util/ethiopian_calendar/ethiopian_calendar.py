import datetime

from db.druid.util import build_time_interval
from util.ethiopian_calendar.converter import EthiopianDateConverter
from util.fiscal_calendar import find_bucket_index

# These are the Ethiopian Calendar buckets.
GRANULARITY_BUCKETS = {
    'year': [1],
    'quarter': [1, 4, 7, 10],
    'month': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
}


def _to_gregorian_datetime(year, month, date):
    date_tuple = EthiopianDateConverter.to_gregorian(year=year, month=month, date=date)
    return datetime.date(*date_tuple)


# Generate a list of druid date intervals that encompass the
# specified dates for the given granularity.
def get_buckets(start_date, end_date, granularity):
    intervals = []
    if start_date >= end_date:
        return intervals

    (et_start_year, et_start_month, _) = EthiopianDateConverter.date_to_ethiopian(
        start_date
    )

    buckets = GRANULARITY_BUCKETS[granularity]
    idx = find_bucket_index(et_start_month, buckets)

    start_month = buckets[idx]
    start_year = et_start_year
    # Handle when the start bucket pulls us into the previous calendar year
    if start_month > et_start_month:
        start_year -= 1
    interval_start = _to_gregorian_datetime(start_year, start_month, 1)

    end_year = start_year
    while interval_start < end_date:
        # Treat buckets like a circular list
        idx = (idx + 1) % len(buckets)
        end_month = buckets[idx]

        # Handle when the next bucket is in the next calendar year
        if end_month <= start_month:
            end_year += 1
        interval_end = _to_gregorian_datetime(end_year, end_month, 1)

        interval = build_time_interval(interval_start, interval_end)
        intervals.append(interval)
        interval_start = interval_end
        start_month = end_month

    return intervals
