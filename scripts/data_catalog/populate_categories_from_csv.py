#!/usr/bin/env python
import csv
import sys
from os import getenv

from pylib.base.flags import Flags

from db.postgres.common import get_session
from log import LOG
from models.alchemy.query import Category
from scripts.data_catalog.backup_query_models import backup_query_models
from web.server.data.data_access import Transaction


QUERY_MODEL_NAME_MATCH = {'category': Category}
CSV_FIELD_NAMES = {'category': ['id', 'name', 'parent_category_id']}


def validate_row(transaction, category_id, name, parent_category_id):
    ''' We cannot add/update a category if
    (1) id value is missing OR
    (2) this is a new category and the name is missing OR
    (3) parent_category_id exists but is invalid
    If any of the above conditions are true, we skip and don't add/update
    the current row.
    '''
    skip_row = False
    has_empty_cells = False
    has_invalid_parent_category_id = False
    # Intentionally not returning if this statement is true so that we can
    # collect additional statistics about the validity of the input row.
    if not category_id:
        LOG.error('Id value is missing.')
        skip_row = True
        has_empty_cells = True

    if not transaction.find_by_id(Category, category_id) and not name:
        LOG.error('Cannot populate a new Category with missing name')
        skip_row = True
        has_empty_cells = True
    else:
        if parent_category_id and not transaction.find_by_id(
            Category, parent_category_id
        ):
            LOG.error('Parent category id "%s" does not exist', parent_category_id)
            skip_row = True
            has_invalid_parent_category_id = True

    return has_empty_cells, skip_row, has_invalid_parent_category_id


def add_or_update_category(transaction, category_id, name, parent_category_id):
    existing_category = transaction.find_by_id(Category, category_id)
    if existing_category:
        new_category = existing_category
        new_category.name = name or existing_category.name
        new_category.parent_id = (
            parent_category_id or existing_category.parent_category_id
        )
    else:
        # Every category should have a non-null parent ID (except for the root which is
        # special).
        new_category = Category(
            id=category_id, name=name, parent_id=(parent_category_id or 'root')
        )
    transaction.add_or_update(new_category)


def populate_fields(file_path, transaction):
    num_rows_read = 0
    num_rows_modified = 0
    num_rows_empty_cells = 0
    num_invalid_parent_category_id = 0

    with open(file_path, 'r') as input_file:
        reader = csv.DictReader(input_file)
        for row in reader:
            num_rows_read += 1

            category_id = row.get('id')
            name = row.get('name')
            parent_category_id = row.get('parent_category_id')

            (has_empty_cells, skip_row, has_invalid_parent_category_id) = validate_row(
                transaction, category_id, name, parent_category_id
            )

            if has_empty_cells:
                num_rows_empty_cells += 1
            if has_invalid_parent_category_id:
                num_invalid_parent_category_id += 1
            if skip_row:
                LOG.info('Skipping field "%s"', name)
                continue

            add_or_update_category(transaction, category_id, name, parent_category_id)

            num_rows_modified += 1

    LOG.info('Number of rows read: %d', num_rows_read)
    LOG.info('Number of rows modified: %d', num_rows_modified)
    LOG.info('Number of rows with empty cells: %d', num_rows_empty_cells)
    LOG.info(
        'Number of rows with invalid parent category id: %d',
        num_invalid_parent_category_id,
    )


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
