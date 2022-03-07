#!/usr/bin/env python
import csv
import os
import sys

import related

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker
from pylib.base.flags import Flags

from db.postgres.common import get_db_uri, get_local_db_uri
from data.query.models.calculation import SumCalculation
from data.query.mock import FieldFilter
from log import LOG
from models.alchemy.query import (
    UnpublishedField,
    PipelineDatasource,
    UnpublishedFieldPipelineDatasourceMapping,
)
from web.server.data.data_access import Transaction


def get_session(sql_connection_string: str) -> sessionmaker:
    # pylint: disable=invalid-name
    Session = sessionmaker()
    engine = create_engine(sql_connection_string)
    Session.configure(bind=engine)
    session = Session()
    return session


def main():
    '''Populate unused fields found in druid into the database.

    To run:
    ./scripts/field_setup/populate_unused_fields.py \
        --druid_fields_input_file=test.csv \
        --db_fields_input_file=test2.csv
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
        '-f',
        '--druid_fields_input_file',
        type=str,
        required=True,
        help='Input csv file',
    )

    Flags.PARSER.add_argument(
        '-f', '--db_fields_input_file', type=str, required=True, help='Input csv file'
    )
    Flags.PARSER.add_argument(
        '--input_pipeline_field_metadata',
        type=str,
        required=False,
        help='The input file for indicators with metadata',
    )

    Flags.InitArgs()
    sql_connection_string = Flags.ARGS.sql_connection_string
    druid_fields_input_file = Flags.ARGS.druid_fields_input_file
    db_fields_input_file = Flags.ARGS.db_fields_input_file
    input_pipeline_field_metadata = Flags.ARGS.input_pipeline_field_metadata

    deployment_code = os.getenv('ZEN_ENV')
    if not sql_connection_string:
        deployment = Flags.ARGS.deployment
        sql_connection_string = (
            get_local_db_uri(deployment_code)
            if not deployment
            else get_db_uri(Flags.ARGS.deployment)
        )

    session = get_session(sql_connection_string)
    LOG.info('Starting to populate fields into the database')

    with Transaction(get_session=lambda: session) as transaction, open(
        druid_fields_input_file, 'r', encoding='utf-8'
    ) as druid_fields_file, open(db_fields_input_file, 'r') as db_fields_file:

        druid_fields_csv_reader = csv.DictReader(druid_fields_file)
        druid_fields = set()
        field_source_lookup = {}
        for row in druid_fields_csv_reader:
            field_id = row['field']
            druid_fields.add(field_id)
            field_source_lookup[field_id] = row['pipeline_source_name']

        LOG.info('Received %d unique fields from druid', len(druid_fields))
        db_fields_csv_reader = csv.DictReader(db_fields_file)
        db_fields = {row['field'] for row in db_fields_csv_reader}
        LOG.info('Received %d unique field ids from the database', len(db_fields))

        unused_fields = druid_fields - db_fields
        if not unused_fields:
            LOG.info('No new fields to add to the database')
            return 0
        unused_field_datasource_mappings = []

        for field_id in unused_fields:
            pipeline_source_name = field_source_lookup.get(field_id)
            if pipeline_source_name:
                search = "%{}%".format(pipeline_source_name)
                # pylint: disable=protected-access
                pipeline_source = (
                    transaction._session.query(PipelineDatasource)
                    .filter(PipelineDatasource.name.ilike(search))
                    .first()
                )

                if pipeline_source:
                    unused_field_datasource_mappings.append(
                        {
                            'unpublished_field_id': field_id,
                            'pipeline_datasource_id': pipeline_source.id,
                        }
                    )

        # Optionally pull in indicator metadata that already exists in the pipeline for these
        # unpublished fields.
        pipeline_field_lookup = {}
        if input_pipeline_field_metadata:
            with open(input_pipeline_field_metadata, 'r') as pipeline_field_metadata:
                pipeline_metadata = csv.DictReader(pipeline_field_metadata)
                pipeline_field_lookup = {row['id']: row for row in pipeline_metadata}

        unpublished_fields = [
            pipeline_field_lookup.get(
                field_id,
                {
                    'id': field_id,
                    # add sum calculation as a default calculation
                    'calculation': related.to_dict(
                        SumCalculation(filter=FieldFilter(field_id=field_id))
                    ),
                },
            )
            for field_id in unused_fields
        ]
        # TODO(moriah): figure out how to add unpublished categories and category mapping.
        LOG.info('Starting to insert new fields into database')
        # pylint: disable=protected-access
        transaction._session.bulk_insert_mappings(UnpublishedField, unpublished_fields)
        LOG.info(
            'Populated %d unused fields into the unpublished field table',
            len(unused_fields),
        )

        if not unused_field_datasource_mappings:
            LOG.info('No new field pipepline source mappings to add to the database')
            return 0

        LOG.info('Starting to populate field pipepline source mappings')
        transaction._session.bulk_insert_mappings(
            UnpublishedFieldPipelineDatasourceMapping, unused_field_datasource_mappings
        )
        LOG.info(
            'Populated %d field pipeline data source mappings',
            len(unused_field_datasource_mappings),
        )
        return 0


if __name__ == '__main__':
    sys.exit(main())
