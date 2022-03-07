#!/usr/bin/env python
from os import getenv
import sys

from pylib.base.flags import Flags
from db.postgres.common import get_db_uri, get_session
from log import LOG
from models.alchemy.query import (
    Field,
    FieldPipelineDatasourceMapping,
    FieldCategoryMapping,
)
from scripts.data_catalog.backup_query_models import backup_query_models
from web.server.data.data_access import Transaction
from web.server.util.data_catalog import populate_fields

# TODO(solo,yitian): Add support for cohort and formula calculation
# This script currently doesn't support cohort and formula.
# because it's pretty difficult to mass import these two types.


QUERY_MODEL_NAME_MATCH = {
    'field': Field,
    'field_category_mapping': FieldCategoryMapping,
    'field_pipeline_datasource_mapping': FieldPipelineDatasourceMapping,
}
CSV_FIELD_NAMES = {
    'field': ['id', 'name', 'short_name', 'calculation'],
    'field_category_mapping': ['id', 'field_id', 'category_id'],
    'field_pipeline_datasource_mapping': ['id', 'field_id', 'pipeline_datasource_id'],
}


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
        '--input_file', type=str, required=True, help='Input fields csv file'
    )
    Flags.PARSER.add_argument(
        '--backup_file',
        type=str,
        required=False,
        help='Optional backup file ' 'for relevant field models',
    )

    Flags.InitArgs()

    LOG.info('Starting CSV processing. This may take a few minutes...')

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
        populate_fields(Flags.ARGS.input_file, transaction)


if __name__ == '__main__':
    sys.exit(main())
