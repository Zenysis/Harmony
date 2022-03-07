#!/usr/bin/env python
import csv
import sys
from os import getenv

from pylib.base.flags import Flags

from db.postgres.common import get_session
from log import LOG
from models.alchemy.query import PipelineDatasource
from scripts.data_catalog.backup_query_models import backup_query_models
from web.server.data.data_access import Transaction


QUERY_MODEL_NAME_MATCH = {'pipeline_datasource': PipelineDatasource}
CSV_FIELD_NAMES = {'pipeline_datasource': ['id', 'name']}


def validate_row(transaction, datasource_id, name):
    ''' We cannot add/update a pipeline datasource if
    (1) id value is missing OR
    (2) this is a new datasource and the name is missing
    If any of the above conditions are true, we skip and don't add/update
    the current row.
    '''
    skip_row = False
    has_empty_cells = False
    if not datasource_id:
        LOG.error('Id value is missing.')
        skip_row = True
        has_empty_cells = True
        return has_empty_cells, skip_row

    if not transaction.find_by_id(PipelineDatasource, datasource_id) and not name:
        LOG.error('Cannot populate a new Pipeline Datasource with missing name')
        skip_row = True
        has_empty_cells = True

    return has_empty_cells, skip_row


def add_or_update_datasource(transaction, datasource_id, name):
    existing_datasource = transaction.find_by_id(PipelineDatasource, datasource_id)
    if existing_datasource:
        new_datasource = existing_datasource
        new_datasource.name = name or existing_datasource.name
    else:
        new_datasource = PipelineDatasource(id=datasource_id, name=name)
    transaction.add_or_update(new_datasource)


def populate_fields(file_path, transaction):
    num_rows_read = 0
    num_rows_modified = 0
    num_rows_empty_cells = 0

    with open(file_path, 'r') as input_file:
        reader = csv.DictReader(input_file)
        for row in reader:
            num_rows_read += 1

            datasource_id = row.get('id')
            name = row.get('name')

            (has_empty_cells, skip_row) = validate_row(transaction, datasource_id, name)

            if has_empty_cells:
                num_rows_empty_cells += 1
            if skip_row:
                LOG.info('Skipping field "%s"', name)
                continue

            add_or_update_datasource(transaction, datasource_id, name)

            num_rows_modified += 1

    LOG.info('Number of rows read: %d', num_rows_read)
    LOG.info('Number of rows modified: %d', num_rows_modified)
    LOG.info('Number of rows with empty cells: %d', num_rows_empty_cells)


def main():
    Flags.PARSER.add_argument(
        '--input_file', type=str, required=True, help='Input category csv file'
    )
    Flags.PARSER.add_argument(
        '--backup_file',
        type=str,
        required=False,
        help='Optional backup file ' 'for relevant category models',
    )
    Flags.InitArgs()

    LOG.info('Starting CSV processing.')

    db_uri = getenv('DATABASE_URL', '')
    with Transaction(get_session=lambda: get_session(db_uri)) as transaction:
        backup_query_models(
            transaction, QUERY_MODEL_NAME_MATCH, CSV_FIELD_NAMES, Flags.ARGS.backup_file
        )
        populate_fields(Flags.ARGS.input_file, transaction)


if __name__ == '__main__':
    sys.exit(main())
