#!/usr/bin/env python
import os
import sys
from pylib.base.flags import Flags


from log import LOG
from db.postgres.utils import export_tables_to_zip, url_encode
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
    FieldDimensionMapping.__tablename__,
    FieldPipelineDatasourceMapping.__tablename__,
    FieldCategoryMapping.__tablename__,
    PipelineDatasource.__tablename__,
    DimensionCategoryMapping.__tablename__,
    'alembic_version',
]


def main():
    '''Export various database tables using Postgres COPY function.

    To run locally:
        ./scripts/data_catalog/export_db_tables.py -t 'dimension,category'
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
        '-t',
        '--tables',
        default=DATA_CATALOG_TABLE_NAMES,
        type=str,
        nargs='*',
        required=False,
        help='A list all tables to export',
    )
    Flags.PARSER.add_argument(
        '-f', '--output_file', type=str, required=True, help='Output file'
    )

    Flags.InitArgs()
    sql_connection_string = Flags.ARGS.sql_connection_string
    tables = sorted(set([*Flags.ARGS.tables, 'alembic_version']))

    output_file = Flags.ARGS.output_file

    if not sql_connection_string:
        deployment_code = os.getenv('ZEN_ENV')
        sql_connection_string = (
            f'postgresql://postgres:@localhost/{deployment_code}-local'
        )
    else:
        # Urlencode connection string to take care of special character
        # Azure postgresql connection strings have special characters
        sql_connection_string = url_encode(sql_connection_string)

    LOG.info('Exporting database tables %s to csv files', tables)
    export_tables_to_zip(tables, output_file, sql_connection_string, ';')
    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
