#!/usr/bin/env python

import csv
import os
import sys
from typing import List

from pydruid.utils.aggregators import (
    build_aggregators,
    longsum,
)
from pylib.base.flags import Flags

from config.druid_base import FIELD_NAME
from db.druid.metadata import DruidMetadata
from db.druid.query_client import DruidQueryClient
from log import LOG
from web.server.data.time_boundary import DataTimeBoundary

SOURCE_NAME = 'source'
FIELD_NAMES = ['source', 'field', 'count', 'start_date', 'end_date']


def get_metadata_from_druid(datasource: str, intervals) -> List[str]:
    aggregators = {
        'count': longsum('count'),
        'start_date': {
            "type": "stringFirst",
            "fieldName": "Real_Date",
            "maxStringBytes": 100,
        },
        'end_date': {
            "type": "stringLast",
            "name": "end_date",
            "fieldName": "Real_Date",
            "maxStringBytes": 100,
        },
    }
    query = {
        'queryType': 'groupBy',
        'dataSource': datasource,
        'intervals': intervals,
        'granularity': 'all',
        'dimensions': [FIELD_NAME, SOURCE_NAME],
        'aggregations': build_aggregators(aggregators),
    }

    LOG.info('Fetching all metadata from druid')
    query_result = DruidQueryClient.run_raw_query(query)
    return [
        {
            'source': event_item['event'][SOURCE_NAME],
            'field': event_item['event'][FIELD_NAME],
            'count': event_item['event']['count'],
            'start_date': event_item['event']['start_date'],
            'end_date': event_item['event']['end_date'],
        }
        for event_item in query_result
    ]


def main():
    '''Fetch DataDigest Metadata from druid. This is the date range and count for all fields.

    To run:
        ./scripts/data_digest/fetch_metadata_from_druid --output_file=test.csv --deployment_name=za
    '''
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='Output csv file'
    )

    Flags.PARSER.add_argument(
        '--deployment_name', type=str, required=False, help='Name of the deployment'
    )
    Flags.InitArgs()
    output_filename = Flags.ARGS.output_file
    deployment_name = Flags.ARGS.deployment_name or os.getenv('ZEN_ENV')

    LOG.info('Starting to fetch digest metadata from druid.')
    datasource = DruidMetadata.get_most_recent_datasource(deployment_name)
    time_boundary = DataTimeBoundary(DruidQueryClient, datasource)
    metadata = get_metadata_from_druid(
        datasource.name, time_boundary.get_full_time_interval()
    )
    # pylint: disable=unspecified-encoding
    with open(output_filename, 'w') as output_file:
        writer = csv.DictWriter(
            output_file,
            fieldnames=FIELD_NAMES,
            extrasaction='ignore',
        )
        writer.writeheader()
        writer.writerows(metadata)
    LOG.info('Found %d unique fields in druid', len(metadata))
    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
