from builtins import zip
from builtins import range
import time
import datetime
from past.utils import old_div

import numpy as np
from scipy import stats
from log import LOG

WEIGHTS = {'AGE': 0.5, 'TIMING': 1.0, 'COUNT': 1.5, 'RECENCY': 2.0, 'TREND': 0.5}


def clamp(value, smallest, largest):
    return max(smallest, min(value, largest))


def estimate_freq(days_between_reports):
    if days_between_reports < 2:
        return 'DAILY'
    if 5 <= days_between_reports <= 10:
        return 'WEEKLY'
    if 25 <= days_between_reports <= 36:
        return 'MONTHLY'
    if 75 <= days_between_reports <= 100:
        return 'QUARTERLY'
    if 300 <= days_between_reports <= 400:
        return 'YEARLY'
    return 'UNKNOWN'


# NOTE(david): first_report_timestamp differs from the earliest timestamp in
# timestamps in that is the absolute first report and should nt be subject to
# any time filter.
def score(timestamps, counts, first_report_timestamp):
    if not timestamps:
        return {'score': 0, 'success': False}

    # Indicators get linear bonus for age, up to 3 years
    age_days = (timestamps[-1] - first_report_timestamp).days
    age_score = min(3, old_div(age_days, 365))
    LOG.debug('age in days %d', age_days)
    LOG.debug('age score %f', age_score)

    LOG.debug('-' * 40)

    # Compute score for timing of reporting
    # Cadence of reporting should be constant
    diffs = [delta.days for delta in np.diff(timestamps)]
    if diffs:
        median_diff = np.mean(diffs)
        std_diff = np.std(diffs)
        timing_score = min(2, old_div(median_diff, std_diff))
    else:
        median_diff = 0
        std_diff = 0
        timing_score = 2

    LOG.debug('median diff %f', median_diff)
    LOG.debug('std diff %f', std_diff)
    LOG.debug('timing score %f', timing_score)

    LOG.debug('-' * 40)

    # Compute score for fullness of reporting
    # Roughly same numbers should report each time.
    avg_count = np.mean(counts)
    std_count = np.std(counts)
    # Coefficient of variation
    count_score = old_div(std_count, avg_count)

    LOG.debug('median count %f', avg_count)
    LOG.debug('std count %f', std_count)
    LOG.debug('count score %f', count_score)

    LOG.debug('-' * 40)

    # Num places reporting in the last months vs last 6 months
    # slope, intercept, rval, pval, stderr
    if len(counts) > 1:
        slope, _, _, _, _ = stats.linregress(list(range(len(counts))), counts)
        trend_score = clamp(old_div(slope, avg_count * 100), -5, 5)
    else:
        slope = 0
        trend_score = 0
    LOG.debug('linregress slope %f', slope)
    LOG.debug('trend score %f', trend_score)

    LOG.debug('-' * 40)

    # Recency of reporting
    days_ago = (datetime.datetime.now() - timestamps[-1].replace(tzinfo=None)).days
    LOG.debug('days ago %d', days_ago)
    # Start decaying after ~1mo. Anything older than a year is useless
    recency_score = 1.0
    if median_diff > 0 and old_div(days_ago, median_diff) > 1.0:
        # It looks late ^
        recency_score *= old_div((365 - min(365, days_ago)), 365)
    LOG.debug('recency score %f', recency_score)

    # We're done!
    LOG.debug('-' * 40)
    final_score = (
        WEIGHTS['AGE'] * age_score
        + WEIGHTS['TIMING'] * timing_score
        + WEIGHTS['COUNT'] * count_score
        + WEIGHTS['RECENCY'] * recency_score
        + WEIGHTS['TREND'] * trend_score
    )

    return {
        'success': True,
        'score': final_score,
        'componentValues': {
            'recency': {'daysAgo': days_ago},
            'trend': {'slope': slope, 'trendIsUp': bool(slope > 0)},
            'timing': {
                'medianDiff': median_diff,
                'estimatedFreq': estimate_freq(median_diff),
            },
        },
        # TODO(ian): Don't always include data.
        'data': [
            {'timestamp': int(time.mktime(date.timetuple())), 'count': count}
            for date, count in zip(timestamps, counts)
        ],
        'metadata': {
            'firstReportTimestamp': int(
                time.mktime(first_report_timestamp.timetuple())
            ),
            'maxCount': max(counts),
        },
    }
