#!/usr/bin/env python
import json
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker
from pylib.base.flags import Flags

import global_config

from db.postgres.common import get_db_uri
from log import LOG
from models.alchemy.query import Category, Dimension, PipelineDatasource
from util.googlesheet_helper import GoogleSheetHelper
from web.server.data.data_access import Transaction

DIMENSIONS_SHEET_NAME = 'dimension_names'
DATASOURCES_SHEET_NAME = 'datasource_id'
CATEGORY_SHEET_NAME = 'category_mapping'


def get_session(sql_connection_string):
    # pylint: disable=invalid-name
    Session = sessionmaker()
    engine = create_engine(sql_connection_string)
    Session.configure(bind=engine)
    session = Session()
    return session


def get_all_dimension_ids(transaction):
    # HACK(abby): The dimension table was edited in the this commit: 1b44680. Since the table
    # is now different on master vs staging and prod, the previous way of doing this will fail
    # because the table columns don't match the `Dimension` type. Use a SQL query until staging
    # and prod have the changes.
    dimensions = transaction.run_raw().execute("SELECT id, name FROM dimension")
    # TODO(abby): Revert this once 1b44680 is on master.
    # dimensions = transaction.find_all(Dimension)
    data = []
    for idx, obj in enumerate(dimensions):
        cell = idx + 2
        data.append({'range': f'A{cell}:B{cell}', 'values': [[obj[0], obj[1]]]})
        # data.append({'range': f'A{cell}:B{cell}', 'values': [[obj.id, obj.name]]})
    return data


def get_pipeline_datasources(transaction):
    sources = transaction.find_all(PipelineDatasource)
    data = []
    for idx, obj in enumerate(sources):
        cell = idx + 2
        data.append({'range': f'A{cell}:B{cell}', 'values': [[obj.id, obj.name]]})
    return data


def get_category_mappings(transaction):
    categories = transaction.find_all(Category)
    data = []
    for idx, category in enumerate(categories):
        cell = idx + 2
        parent = category.parent
        # HACK(solo): Fix this, we cannot have more than 1000 rows. sheets API
        # has a max row limit of 1000
        if cell > 1000:
            continue
        data.append(
            {
                'range': f'A{cell}:F{cell}',
                'values': [
                    [
                        category.name,
                        parent.name if parent else '',
                        category.id,
                        parent.id if parent else '',
                        f'{category.name} ({category.id})',
                        f'{parent.name} ({parent.id})' if parent else '',
                    ]
                ],
            }
        )
    return data


def get_connection_string(deployment):
    if not deployment:
        deployment_code = os.getenv('ZEN_ENV')
        return f'postgresql://postgres:@localhost/{deployment_code}-local'
    return get_db_uri(deployment)


def main():
    '''Populates the various field metadata into google spreadsheet.

    To run locally:
        ./scripts/data_catalog/populate_metadata_in_googlesheet.py -w workbook_name
    '''
    Flags.PARSER.add_argument(
        '--deployment',
        type=str,
        required=False,
        help=(
            'Name of the deployment used to get db uri'
            'based on database credential id in roledef'
        ),
    )
    Flags.PARSER.add_argument(
        '-d',
        '--sql_connection_string',
        type=str,
        required=False,
        help='The SQL Connection String to use to connect to the SQL '
        'Database. Can also be specified via the \'DATABASE_URL\' '
        'environment variable. The inline parameter takes priority'
        'over the environment variable.',
    )

    Flags.PARSER.add_argument(
        '-w',
        '--workbook',
        type=str,
        required=True,
        help='The google spreadsheet workbook. '
        'It should contian worksheets with the titles '
        'dimension_names, datasource_id, category_mapping. '
        'Google service account should have access to this workbook',
    )

    Flags.InitArgs()
    sql_connection_string = Flags.ARGS.sql_connection_string
    workbook_name = Flags.ARGS.workbook

    if not sql_connection_string:
        sql_connection_string = get_connection_string(Flags.ARGS.deployment)

    client_secret = json.loads(global_config.GOOGLE_SERVICE_SECRET_CREDENTIAL)
    LOG.info('Adding data to googlesheet...this may take a few minutes')
    gs = GoogleSheetHelper(client_secret)
    session = get_session(sql_connection_string)
    with Transaction(get_session=lambda: session) as transaction:
        category_data = get_category_mappings(transaction)
        dimension_data = get_all_dimension_ids(transaction)
        data_sources = get_pipeline_datasources(transaction)

        gs.insert_bulk_data(workbook_name, DATASOURCES_SHEET_NAME, data_sources)
        gs.insert_bulk_data(workbook_name, DIMENSIONS_SHEET_NAME, dimension_data)
        gs.insert_bulk_data(workbook_name, CATEGORY_SHEET_NAME, category_data)

    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
