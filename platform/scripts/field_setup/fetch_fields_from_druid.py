#!/usr/bin/env python
import csv
import os
import sys


from typing import List

from pylib.base.flags import Flags
from pydruid.utils.aggregators import (
    build_aggregators,
    longsum,
)

from config.druid_base import FIELD_NAME
from db.druid.metadata import DruidMetadata
from db.druid.query_client import DruidQueryClient
from log import LOG
from web.server.data.time_boundary import DataTimeBoundary


SOURCE_NAME = 'source'


def get_fields_from_druid(datasource_name: str, intervals) -> List[str]:
    aggregators = {
        'count': longsum('count'),
    }
    query = {
        'aggregations': build_aggregators(aggregators),
        'dataSource': datasource_name,
        'dimensions': [FIELD_NAME, SOURCE_NAME],
        'granularity': 'all',
        'queryType': 'groupBy',
        'intervals': intervals,
        'filter': {
            'type': 'not',
            FIELD_NAME: {'type': 'selector', 'dimension': FIELD_NAME, 'value': ''},
        },
    }

    LOG.info('Fetching all field ids from druid')
    query_result = DruidQueryClient.run_raw_query(query)
    return [
        {
            'field': event_item['event'][FIELD_NAME],
            'pipeline_source_name': event_item['event'][SOURCE_NAME],
        }
        for event_item in query_result
    ]


def main():
    '''Fetch all fields from druid.

    To run:
        ./scripts/field_setup/fetch_fields_from_druid --output_file=test.csv --deployment_name=za
    '''
    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help=('Name of the deployment'),
    )
    Flags.PARSER.add_argument(
        '-f', '--output_file', type=str, required=True, help='Output csv file'
    )

    Flags.InitArgs()
    output_file = Flags.ARGS.output_file
    LOG.info('Starting to fetch fields from druid')

    deployment_name = Flags.ARGS.deployment_name or os.getenv('ZEN_ENV')
    datasource = DruidMetadata.get_most_recent_datasource(deployment_name)

    time_boundary = DataTimeBoundary(DruidQueryClient, datasource)
    fields = get_fields_from_druid(
        datasource.name, time_boundary.get_full_time_interval()
    )
    with open(output_file, 'w') as out:
        writer = csv.DictWriter(
            out, fieldnames=['field', 'pipeline_source_name'], extrasaction='ignore'
        )
        writer.writeheader()
        writer.writerows(fields)
    LOG.info('Found %d fields in druid', len(fields))
    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
