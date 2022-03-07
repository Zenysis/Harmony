# mypy: disallow_untyped_defs=True
from builtins import range
import math
from typing import TYPE_CHECKING, TypedDict, List

import numpy as np
from scipy import stats

if TYPE_CHECKING:
    import pandas as pd
    import datetime


class IndicatorCharacteristics(TypedDict):
    ageScore: float
    completenessTrendIsUp: bool
    endIntervalTimestamp: float
    firstEverReportTimestamp: float
    freshnessScore: float
    lastReportTimestamp: float
    maxAgeScore: float
    maxFreshnessScore: float
    maxScore: float
    reportingPeriod: float
    score: float
    success: bool


class ReportingCompleteness(TypedDict):
    averageReportCount: int
    firstReportTimestamp: float
    maxReportCount: int
    maxScore: int
    minReportCount: int
    modeReportCount: int
    reportCountStd: float
    score: float
    success: bool
    totalReports: int


class QualityScore(TypedDict):
    indicatorCharacteristics: IndicatorCharacteristics
    reportingCompleteness: ReportingCompleteness


FAILED_QUALITY_SCORE: QualityScore = {
    'indicatorCharacteristics': {
        'ageScore': 0,
        'completenessTrendIsUp': False,
        'endIntervalTimestamp': 0,
        'firstEverReportTimestamp': 0,
        'freshnessScore': 0,
        'lastReportTimestamp': 0,
        'maxAgeScore': 0,
        'maxFreshnessScore': 0,
        'maxScore': 0,
        'reportingPeriod': 0,
        'score': 0,
        'success': False,
    },
    'reportingCompleteness': {
        'averageReportCount': 0,
        'firstReportTimestamp': 0,
        'maxReportCount': 0,
        'maxScore': 0,
        'minReportCount': 0,
        'modeReportCount': 0,
        'reportCountStd': 0,
        'score': 0,
        'success': False,
        'totalReports': 0,
    },
}


# NOTE(david): For the rationale behind the calculations in this file see:
# https://zenysis.slab.com/posts/score-calculations-5wrqoaln
# Please update this document if any calculations change!

# NOTE(david): These add up to 11 as Completness trend is a score between 0 and -1.
# The maximum score is therefore still 10.
SCORE_WEIGHTS = {
    'COMPLETENESS': 4,
    'AGE': 1,
    'FRESHNESS': 1,
    'COMPLETENESS_TREND': 1,
    'OUTLIERS': 4,
}
FRESHNESS_SCORE_DECAY_RATE = 0.5
AGE_SCORE_DECAY_RATE = 0.05


def clamp(value: float, smallest: float, largest: float) -> float:
    return max(smallest, min(value, largest))


def calc_completeness_slope(report_counts: List[int]) -> float:
    x = list(range(len(report_counts)))
    slope, _, _, _, _ = stats.linregress(x, report_counts)
    return slope


def calc_raw_completeness_score(report_counts: List[int]) -> float:
    return clamp(1 - stats.variation(report_counts), 0, 1)


def calc_raw_age_score(age_in_days: int, reporting_period: int) -> float:
    age_in_reporting_periods = age_in_days / reporting_period
    return 1 - math.exp(-AGE_SCORE_DECAY_RATE * age_in_reporting_periods)


def calc_raw_freshness_score(
    last_report_age_in_days: int, reporting_period: int
) -> float:
    return math.exp(
        -FRESHNESS_SCORE_DECAY_RATE * (last_report_age_in_days / reporting_period)
    )


def calc_raw_completeness_trend_score(slope: float, report_counts: List[int]) -> float:
    avg_count = float(np.mean(report_counts))

    # NOTE(david): This score is only included if the slope is negative. This is
    # because a perfectly reported indicator would have a slope of zero. This
    # score is used to try to alert users that the reporting completeness of
    # an indicator is decreasing.
    return clamp(slope / avg_count, -1, 0)


def get_reporting_period(dates: List['pd.Timestamp']) -> int:
    days_between_reports = [delta.days for delta in np.diff(dates)]

    # Estimate the reporting period as the median time between reports
    return np.median(days_between_reports)


def get_last_report_date(
    report_counts: List[int],
    dates: List['pd.Timestamp'],
    end_interval_date: 'datetime.datetime',
) -> 'pd.Timestamp':
    # Find the latest recent date in dates that both has a report and is no
    # later than end_interval_date. Sometimes dates contains future dates which
    # need to be filtered out as we only care about past reports and not any
    # forecasts or erroneous future data.
    index = len(report_counts) - 1
    while index >= 0:
        if report_counts[index] > 0 and end_interval_date >= dates[index]:
            return dates[index]
        index -= 1
    # Default to first date. This should not happen though as report_counts
    # should always have at least 1 nonzero value.
    return dates[0]


# NOTE(david): first_report_date differs from the earliest date in
# dates in that is the absolute first report and should not be subject to
# any time filter.
def score(
    dates: List['pd.Timestamp'],
    report_counts: List[int],
    first_report_date: 'pd.Timestamp',
    end_interval_date: 'datetime.datetime',
) -> QualityScore:
    # Only calculate a score if we have 5 reporting periods. Otherwise our
    # calculations are highly unreliable.
    if len(dates) < 5:
        return FAILED_QUALITY_SCORE

    last_report_date = get_last_report_date(report_counts, dates, end_interval_date)

    reporting_period = get_reporting_period(dates)

    age_in_days = (last_report_date - first_report_date).days

    last_report_age_in_days = (end_interval_date - last_report_date).days

    completeness_slope = calc_completeness_slope(report_counts)

    age_score = calc_raw_age_score(age_in_days, reporting_period) * SCORE_WEIGHTS['AGE']

    total_reports = np.sum(report_counts)
    average_report_count = np.mean(report_counts)
    report_count_std = np.std(report_counts)
    min_report_count = np.min(report_counts)
    max_report_count = np.max(report_counts)
    mode_report_count = stats.mode(report_counts)[0]

    completeness_trend_score = (
        calc_raw_completeness_trend_score(completeness_slope, report_counts)
        * SCORE_WEIGHTS['COMPLETENESS_TREND']
    )

    freshness_score = (
        calc_raw_freshness_score(last_report_age_in_days, reporting_period)
        * SCORE_WEIGHTS['FRESHNESS']
    )

    indicator_characteristics_score = round(
        freshness_score + age_score + completeness_trend_score
    )

    reporting_completeness_score = round(
        calc_raw_completeness_score(report_counts) * SCORE_WEIGHTS['COMPLETENESS']
    )

    return {
        'indicatorCharacteristics': {
            'ageScore': age_score,
            'completenessTrendIsUp': bool(completeness_slope >= 0),
            'endIntervalTimestamp': end_interval_date.timestamp(),
            'firstEverReportTimestamp': first_report_date.timestamp(),
            'freshnessScore': freshness_score,
            'lastReportTimestamp': last_report_date.timestamp(),
            'maxAgeScore': SCORE_WEIGHTS['AGE'],
            'maxFreshnessScore': SCORE_WEIGHTS['FRESHNESS'],
            # completeness_trend excluded from maxScore as it's max value is 0
            'maxScore': SCORE_WEIGHTS['FRESHNESS'] + SCORE_WEIGHTS['AGE'],
            'reportingPeriod': reporting_period,
            'success': True,
            'score': indicator_characteristics_score,
        },
        'reportingCompleteness': {
            'averageReportCount': int(average_report_count),
            'firstReportTimestamp': dates[0].timestamp(),
            'maxReportCount': int(max_report_count),
            'maxScore': SCORE_WEIGHTS['COMPLETENESS'],
            'minReportCount': int(min_report_count),
            'modeReportCount': int(mode_report_count),
            'reportCountStd': round(float(report_count_std), 1),
            'score': int(reporting_completeness_score),
            'success': True,
            'totalReports': int(total_reports),
        },
    }
