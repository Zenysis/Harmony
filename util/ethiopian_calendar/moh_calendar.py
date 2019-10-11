import datetime
from datetime import timedelta

from db.druid.util import build_time_interval
from util.ethiopian_calendar.converter import EthiopianDateConverter
from util.fiscal_calendar import find_bucket_index

# These are the MoH's fiscal year reporting periods.
# Month 13 is combined with month 1
# For a reporting period i, its bucket will stretch from
# day 1 bucket i month (inclusive) to
# day 1 bucket i + 1 month (exclusive)
GRANULARITY_BUCKETS = {
    'year': [11],
    'quarter': [11, 2, 5, 8],
    'month': [11, 12, 13, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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


# Convenience methods for converting between Ethiopian calendar and fiscal dates
# Convert an Ethiopian calendar date to its Ethiopian fiscal date
def ethiopian_to_fiscal(et_year, et_month):
    buckets = GRANULARITY_BUCKETS['month']
    fiscal_month = find_bucket_index(et_month, buckets) + 1
    fiscal_year = et_year

    # Handle when the month pulls us into a different fiscal year
    if et_month >= buckets[0] and buckets[0] > buckets[-1]:
        fiscal_year += 1

    return (fiscal_year, fiscal_month, 1)


# Convert an Ethiopian fiscal date to its Ethiopian calendar date
def fiscal_to_ethiopian(fiscal_year, fiscal_month):
    buckets = GRANULARITY_BUCKETS['month']
    et_month = buckets[fiscal_month - 1]
    et_year = fiscal_year

    # Handle when the month pulls us into a different calendar year.
    # If the ET calendar month is greater than the last month of the ET fiscal
    # year, then we are in the previous ET calendar year,
    if et_month > buckets[-1] and buckets[0] > buckets[-1]:
        et_year -= 1

    return (et_year, et_month, 1)


# Convenience methods for converting between Gregorian calendar and Ethiopian
# fiscal dates

# Convert an Ethiopian fiscal date into a python date object
def fiscal_to_gregorian(fiscal_year, fiscal_month):
    (et_year, et_month, et_date) = fiscal_to_ethiopian(fiscal_year, fiscal_month)
    return _to_gregorian_datetime(et_year, et_month, et_date)


# Convert a python date object into an Ethiopian fiscal date
def gregorian_to_fiscal(input_date):
    (et_year, et_month, _) = EthiopianDateConverter.date_to_ethiopian(input_date)
    return ethiopian_to_fiscal(et_year, et_month)
