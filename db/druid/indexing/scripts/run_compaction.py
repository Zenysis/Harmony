#!/usr/bin/env python
# Compact a datasource so that there is only one segment per month for the datasource.
# This is useful when the indexing task generates multiple segments for a single month
# like when `dynamic` partitioning is used. When running in parallel, a separate
# compaction task will be run for each month in the datasource. The Coordinator will
# manage the running of these tasks to ensure server resources are not overloaded.
import sys

from datetime import date
from typing import List

import pandas as pd
import requests

from pylib.base.flags import Flags

from db.druid.config import DruidConfig
from db.druid.metadata import DruidMetadata
from db.druid.util import build_time_interval
from log import LOG

INDEX_URL = '%s/druid/indexer/v1/task' % (DruidConfig.router_endpoint())


def build_compaction_intervals(
    start_date: date, end_date: date, parallel: bool
) -> List[str]:
    '''Create a list of date intervals for compaction tasks to run on. Each interval
    will be processed by a separate compaction task.
    '''
    if not parallel:
        return [build_time_interval(start_date, end_date)]

    # Build a list containing the monthly intervals for each segment to compact.
    intervals = []

    # NOTE(stephen): It's convenient to just let pandas compute dates for us rather than
    # implement it ourselves.
    dates = pd.period_range(start_date, end_date, freq='m')
    for idx, period in enumerate(dates[:-1]):
        interval_start = period.start_time
        interval_end = dates[idx + 1].start_time
        intervals.append(build_time_interval(interval_start, interval_end))

    # If the end date does not fall cleanly on the start of the month, we need to add
    # one more interval to cover the partial month.
    if end_date.day != 1:
        intervals.append(build_time_interval(dates[-1].start_time, end_date))

    return intervals


def build_compaction_task(datasource: str, interval: str) -> dict:
    return {
        'type': 'compact',
        'dataSource': datasource,
        'ioConfig': {
            'type': 'compact',
            'inputSpec': {
                'type': 'interval',
                'interval': interval,
            },
        },
        'tuningConfig': {
            'type': 'index_parallel',
            'forceGuaranteedRollup': True,
            'partitionsSpec': {
                'type': 'hashed',
                'numShards': 1,
            },
        },
    }


def main():
    Flags.PARSER.add_argument(
        '--datasource',
        type=str,
        required=True,
        help='The datasource to run compaction for',
    )
    Flags.PARSER.add_argument(
        '--parallel',
        action='store_true',
        default=False,
        help='Whether compaction of segments should happen in parallel',
    )
    Flags.InitArgs()

    datasource = Flags.ARGS.datasource
    parallel = Flags.ARGS.parallel

    LOG.info('Running compaction for datasource: %s', datasource)
    (start_date, end_date) = DruidMetadata.get_datasource_timeboundary(datasource)
    assert start_date and end_date, f'Unable to find datasource: {datasource}'

    compaction_intervals = build_compaction_intervals(start_date, end_date, parallel)
    for interval in compaction_intervals:
        LOG.info('Launching compaction task for interval: %s', interval)
        r = requests.post(INDEX_URL, json=build_compaction_task(datasource, interval))
        assert r.ok, f'Failed to start task. Reason: {r.reason}'
        LOG.info('Task ID for interval %s: %s', interval, r.json()['task'])

    return 0


if __name__ == '__main__':
    sys.exit(main())
