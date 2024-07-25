# This file contains utilities for working with Gregorian fiscal calendar dates.
import datetime
from functools import partial

from db.druid.util import build_time_interval

BUCKET_SIZE = {'fiscal_quarter': 3, 'fiscal_half': 6, 'fiscal_year': 12}


def find_bucket_index(month, buckets):
    '''For a given month and list of months, return the index that will contain
    this month. Example:
        Month: 3
        Buckets: [7, 10, 1, 4]
        Return -> Index 2 because Month 3 falls after Month 1 but before Month 4

    Args:
        month: The month number that we want to find the bucket for.
        buckets: List of months for a given granularity.
            Example: Fiscal quarter: [7, 10, 1, 4]
    '''
    if len(buckets) == 1:
        return 0

    for i, start in enumerate(buckets):
        end = buckets[(i + 1) % len(buckets)]  # Buckets list is circular
        if (  # Start and end are in the same calendar year (we are increasing)
            (start < end and start <= month < end)
            or
            # Start is in different calendar year from end
            (
                start > end
                and
                # Month is in same calendar year as start
                (
                    month >= start
                    or
                    # Month is in same calendar year as end but is not in end's bucket
                    month < end
                )
            )
        ):
            return i
    return -1


def _build_month_buckets(fiscal_start_month, granularity):
    '''Generate a list of calendar months ordered by the start of the fiscal
    year. `fiscal_start_month` is 1 indexed.

    Example: Fiscal start month is July (7), the result would be:
        [7, 10, 1, 4]
    '''

    output = [fiscal_start_month]
    bucket_size = BUCKET_SIZE[granularity]
    cur_month = fiscal_start_month
    for _ in range((12 // bucket_size) - 1):
        cur_month += bucket_size
        if cur_month > 12:
            cur_month -= 12
        output.append(cur_month)
    return output


def get_fiscal_granularity_intervals(
    fiscal_start_month, start_date, end_date, granularity
):
    '''Generate a list of druid date intervals that encompass the specified dates for
    the given granularity.'''
    intervals = []
    if start_date >= end_date:
        return intervals

    buckets = _build_month_buckets(fiscal_start_month, granularity)
    idx = find_bucket_index(start_date.month, buckets)

    start_month = buckets[idx]
    start_year = start_date.year
    # Handle when the start bucket pulls us into the previous calendar year
    if start_month > start_date.month:
        start_year -= 1
    interval_start = datetime.date(start_year, start_month, 1)

    end_year = start_year
    while interval_start < end_date:
        # Treat buckets like a circular list
        idx = (idx + 1) % len(buckets)
        end_month = buckets[idx]

        # Handle when the next bucket is in the next calendar year
        if end_month <= start_month:
            end_year += 1
        interval_end = datetime.date(end_year, end_month, 1)

        interval = build_time_interval(interval_start, interval_end)
        intervals.append(interval)
        interval_start = interval_end
        start_month = end_month

    return intervals


def build_fiscal_bucketing_fn(fiscal_start_month):
    '''Create a version of the `get_fiscal_granularity_intervals` method with the
    `fiscal_start_month` bound to it. This allows users of the returned function to not
    need to specify the `fiscal_start_month`.
    '''
    return partial(get_fiscal_granularity_intervals, fiscal_start_month)
