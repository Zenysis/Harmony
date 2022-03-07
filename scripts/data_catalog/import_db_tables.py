#!/usr/bin/env python
import sys
import os

from pylib.base.flags import Flags

from log import LOG
from db.postgres.utils import import_data_into_table, url_encode
from models.alchemy.query import (
    Category,
    Dimension,
    DimensionCategory,
    Field,
    FieldDimensionMapping,
    FieldPipelineDatasourceMapping,
    FieldCategoryMapping,
    PipelineDatasource,
    DimensionCategoryMapping,
)

DATA_CATALOG_TABLE_NAMES = [
    Category.__tablename__,
    Dimension.__tablename__,
    DimensionCategory.__tablename__,
    Field.__tablename__,
    PipelineDatasource.__tablename__,
    FieldDimensionMapping.__tablename__,
    FieldPipelineDatasourceMapping.__tablename__,
    FieldCategoryMapping.__tablename__,
    DimensionCategoryMapping.__tablename__,
]


def main():
    '''Import database tables.

    To run locally:
        ./scripts/data_catalog/import_db_tables.py -t category'
    '''
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
        '-c',
        '--disable_migration_check',
        action='store_true',
        default=False,
        help='Disable checking of migration versions in target db',
    )
    Flags.PARSER.add_argument(
        '-f', '--input_file', type=str, required=True, help='Input file'
    )

    Flags.InitArgs()
    sql_connection_string = Flags.ARGS.sql_connection_string
    input_file = Flags.ARGS.input_file
    disable_migration_check = Flags.ARGS.disable_migration_check

    if not sql_connection_string:
        deployment_code = os.getenv('ZEN_ENV')
        sql_connection_string = (
            f'postgresql://postgres:@localhost/{deployment_code}-local'
        )
    else:
        # Urlencode connection string to take care of special character
        # Azure postgresql connection strings have special characters
        sql_connection_string = url_encode(sql_connection_string)

    LOG.info('Importing data from zip file into tables')

    import_data_into_table(
        sql_connection_string,
        input_file,
        DATA_CATALOG_TABLE_NAMES,
        disable_migration_check=disable_migration_check,
    )

    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
