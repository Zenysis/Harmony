"""
Calendar that uses SELV "Statistical month" that starts on 21st day of a regular month
"""
from datetime import date
from typing import List, Tuple

from dateutil.relativedelta import relativedelta

from db.druid.util import build_time_interval

STAT_MONTH_FIRST_DAY = 21


def get_stat_month_granularity_intervals(start_date: date, end_date: date) -> List[str]:
    if start_date >= end_date:
        return []

    intervals: List[Tuple[date, date]] = [
        (
            start_date,
            min(
                start_date.replace(day=STAT_MONTH_FIRST_DAY)
                if start_date.day < STAT_MONTH_FIRST_DAY
                else start_date.replace(day=STAT_MONTH_FIRST_DAY)
                + relativedelta(months=1),
                end_date,
            ),
        )
    ]

    # NOTE: relacing walrus with python 3.7 equivalent for now
    # while (interval_start := intervals[-1][1]) < end_date:
    while True:
        interval_start = intervals[-1][1]
        if interval_start >= end_date:
            break

        intervals.append(
            (interval_start, min(interval_start + relativedelta(months=1), end_date))
        )
    return [build_time_interval(*interval) for interval in intervals]
