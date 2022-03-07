#!/usr/bin/env python
import csv
import sys
from os import getenv

from pylib.base.flags import Flags

from db.postgres.common import get_session, get_db_uri
from log import LOG
from models.alchemy.query import Dimension
from scripts.data_catalog.backup_query_models import backup_query_models
from web.server.data.data_access import Transaction


QUERY_MODEL_NAME_MATCH = {'dimension': Dimension}
CSV_FIELD_NAMES = {'dimension': ['id', 'name', 'description']}


def validate_dimension_row(transaction, dimension_id, name):
    ''' We cannot add/update a dimension if
    (1) id value is missing OR
    (2) this is a new dimension and the name is missing OR
    If any of the above conditions are true, we skip and don't add/update
    the current row.
    '''
    skip_row = False
    has_empty_cells = False
    if not dimension_id:
        LOG.error('Id value is missing.')
        skip_row = True
        has_empty_cells = True

    if not name and not transaction.find_by_id(Dimension, dimension_id):
        LOG.error('Cannot populate a new dimension with missing name')
        skip_row = True
        has_empty_cells = True
    return has_empty_cells, skip_row


def add_or_update_dimension(transaction, dimension_id, name, description):
    existing_dimension = transaction.find_by_id(Dimension, dimension_id)
    if existing_dimension:
        new_dimension = existing_dimension
        new_dimension.name = name or existing_dimension.name
        new_dimension.description = description or existing_dimension.description
    else:
        new_dimension = Dimension(id=dimension_id, name=name, description=description)
    transaction.add_or_update(new_dimension)


def populate_dimensions(file_path, transaction):
    num_rows_read = 0
    num_rows_modified = 0
    num_rows_empty_cells = 0

    with open(file_path, 'r') as input_file:
        reader = csv.DictReader(input_file)
        for row in reader:
            num_rows_read += 1

            dimension_id = row.get('id')
            name = row.get('name')
            description = row.get('description')

            has_empty_cells, skip_row = validate_dimension_row(
                transaction, dimension_id, name
            )
            if has_empty_cells:
                num_rows_empty_cells += 1
            if skip_row:
                LOG.info('Skipping field "%s"', name)
                continue

            add_or_update_dimension(transaction, dimension_id, name, description)

            num_rows_modified += 1

    LOG.info('Number of rows read: %d', num_rows_read)
    LOG.info('Number of rows modified: %d', num_rows_modified)
    LOG.info('Number of rows with empty cells: %d', num_rows_empty_cells)


def main():
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
        '--input_file', type=str, required=True, help='Input dimension csv file'
    )
    Flags.PARSER.add_argument(
        '--backup_file',
        type=str,
        required=False,
        help='Optional backup file ' 'for relevant dimension models',
    )
    Flags.InitArgs()

    LOG.info('Starting CSV processing.')

    deployment = Flags.ARGS.deployment
    if not deployment:
        deployment_code = getenv('ZEN_ENV')
        sql_connection_string = (
            f'postgresql://postgres:@localhost/{deployment_code}-local'
        )
    else:
        sql_connection_string = get_db_uri(deployment)

    with Transaction(
        get_session=lambda: get_session(sql_connection_string)
    ) as transaction:
        backup_query_models(
            transaction, QUERY_MODEL_NAME_MATCH, CSV_FIELD_NAMES, Flags.ARGS.backup_file
        )
        populate_dimensions(Flags.ARGS.input_file, transaction)


if __name__ == '__main__':
    sys.exit(main())
