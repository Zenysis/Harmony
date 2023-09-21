#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
'''Populate unused fields found in druid into the database. Optionally can also take in
field metadata to populate the fields with.

To run:
    ZEN_ENV=<> ./scripts/field_setup/populate_unused_fields.py \
        --druid_fields_input_file=druid_fields.csv \
        --db_fields_input_file=db_fields.csv
'''
import argparse
import csv
import json
import os
import sys
from typing import Dict, List, Optional, Set, Tuple

import related

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker

from data.field.util import build_sum_calculation
from data.pipeline.field_setup.util import ZenCategory
from db.postgres.common import get_db_uri, get_local_db_uri
from log import LOG
from models.alchemy.query import (
    Category,
    PipelineDatasource,
    UnpublishedField,
    UnpublishedFieldCategoryMapping,
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


def default_calculation(field_id: str) -> dict:
    # Builds a sum calculation as a default calculation
    return related.to_dict(build_sum_calculation(field=field_id))


def read_in_fields(
    druid_fields_input_file: str, db_fields_input_file: str
) -> Tuple[Set[str], Dict[str, str], Set[str]]:
    '''Load fields from druid and the database.'''
    with open(
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

        return druid_fields, field_source_lookup, db_fields


def add_missing_pipeline_datasources(
    transaction: Transaction, field_source_lookup: Dict[str, str], sources: Set[str]
) -> None:
    '''Check if a pipeline source may have been added for any unpublished fields without
    a source.'''
    missing_field_datasource_mappings = []
    for unpublished_field_with_no_source in (
        transaction.run_raw()
        .query(UnpublishedField.id)
        .join(UnpublishedFieldPipelineDatasourceMapping, isouter=True)
        # pylint: disable=singleton-comparison
        .filter(UnpublishedFieldPipelineDatasourceMapping.id == None)
    ):
        # Returns as a tuple like (id,)
        unpublished_field_id = unpublished_field_with_no_source[0]
        pipeline_source_id = field_source_lookup.get(unpublished_field_id)
        if pipeline_source_id and pipeline_source_id in sources:
            missing_field_datasource_mappings.append(
                {
                    'unpublished_field_id': unpublished_field_id,
                    'pipeline_datasource_id': pipeline_source_id,
                }
            )

    if missing_field_datasource_mappings:
        LOG.info(
            'Adding pipeline source mappings for %s fields. Starting to populate field '
            'pipeline source mappings.',
            len(missing_field_datasource_mappings),
        )
        transaction.run_raw().bulk_insert_mappings(
            UnpublishedFieldPipelineDatasourceMapping,
            missing_field_datasource_mappings,
        )


def handle_metadata_row(
    row: Dict[str, str],
    db_fields: Set[str],
    field_source_lookup: Dict[str, str],
    unused_fields: Set[str],
    unpublished_fields: List[dict],
    field_datasource_mappings: List[Dict[str, str]],
    field_category_mappings: List[Dict[str, str]],
    metadata_fields_not_in_druid: Dict[str, List[str]],
) -> None:
    '''Build database objects for fields with metadata. Logs fields that are not in Druid.'''
    field_id = row['id']
    # Fields with metadata are populated regardless of whether they are in Druid
    if field_id in db_fields:
        return

    field = {
        'id': field_id,
        'name': row['name'],
        'short_name': row['short_name'],
        'calculation': (
            json.loads(row['calculation'])
            if row['calculation']
            else default_calculation(field_id)
        ),
        'description': row['description'],
    }
    unpublished_fields.append(field)
    field_datasource_mappings.append(
        {
            'unpublished_field_id': field_id,
            'pipeline_datasource_id': row['pipeline_datasource_id'],
        }
    )
    field_category_mappings.append(
        {
            'unpublished_field_id': field_id,
            'category_id': row['category_id'],
        }
    )

    # Save the fields with metadata that are not in Druid to log
    if field_id in field_source_lookup:
        assert (
            field_source_lookup[field_id] == row['pipeline_datasource_id']
        ), 'Field metadata provided pipeline datasource id that did not match Druid'
        unused_fields.remove(field_id)
    # These are formula and composite fields that would not be in Druid
    elif row['constructed'] == 'True':
        metadata_fields_not_in_druid['constructed'].append(field_id)
    else:
        metadata_fields_not_in_druid['missing'].append(field_id)


def populate_field_metadata(
    input_pipeline_field_metadata: Optional[str],
    druid_fields: Set[str],
    db_fields: Set[str],
    field_source_lookup: Dict[str, str],
    sources: Set[str],
) -> Tuple[List[dict], List[Dict[str, str]], List[Dict[str, str]]]:
    '''Optionally pull in indicator metadata that already exists in the pipeline for these
    unpublished fields. The return dict type is similar to ZenField, except most fields are
    optional.'''
    unused_fields = druid_fields - db_fields
    metadata_fields_not_in_druid: Dict[str, List[str]] = {
        # Constructed fields (ex. formula or composite fields) are not expected to be in Druid
        'constructed': [],
        'missing': [],
    }
    unpublished_fields: List[dict] = []
    field_datasource_mappings: List[Dict[str, str]] = []
    field_category_mappings: List[Dict[str, str]] = []

    if input_pipeline_field_metadata:
        with open(input_pipeline_field_metadata, 'r') as pipeline_field_metadata:
            pipeline_metadata = csv.DictReader(pipeline_field_metadata)
            for row in pipeline_metadata:
                handle_metadata_row(
                    row,
                    db_fields,
                    field_source_lookup,
                    unused_fields,
                    unpublished_fields,
                    field_datasource_mappings,
                    field_category_mappings,
                    metadata_fields_not_in_druid,
                )

    if metadata_fields_not_in_druid['constructed']:
        LOG.info(
            'Found %d constructed fields from metadata',
            len(metadata_fields_not_in_druid['constructed']),
        )
    if metadata_fields_not_in_druid['missing']:
        LOG.warning(
            'Found %d fields from metadata that are not in Druid: %s',
            len(metadata_fields_not_in_druid['missing']),
            ', '.join(metadata_fields_not_in_druid['missing']),
        )

    for field_id in unused_fields:
        unpublished_fields.append(
            {'id': field_id, 'calculation': default_calculation(field_id)}
        )

        pipeline_source_id = field_source_lookup.get(field_id)
        if pipeline_source_id and pipeline_source_id in sources:
            field_datasource_mappings.append(
                {
                    'unpublished_field_id': field_id,
                    'pipeline_datasource_id': pipeline_source_id,
                }
            )

    return unpublished_fields, field_datasource_mappings, field_category_mappings


def populate_database(
    transaction: Transaction,
    categories: List[ZenCategory],
    unpublished_fields: List[dict],
    field_datasource_mappings: List[Dict[str, str]],
    field_category_mappings: List[Dict[str, str]],
) -> None:
    '''Populate the database with the new categories, unpublished fields, field <> datasource
    mappings, and field <> category mappings.'''
    if not unpublished_fields:
        LOG.info('No new fields to add to the database')
        return

    LOG.info('Starting to insert new categories into database')
    transaction.run_raw().bulk_insert_mappings(Category, categories)
    LOG.info('Populated %d new categories into the category table', len(categories))
    if categories:
        category_ids = ', '.join(category['id'] for category in categories)
        LOG.info('New category ids: %s', category_ids)

    LOG.info('Starting to insert new fields into database')
    transaction.run_raw().bulk_insert_mappings(UnpublishedField, unpublished_fields)
    LOG.info(
        'Populated %d unused fields into the unpublished field table',
        len(unpublished_fields),
    )

    LOG.info('Starting to populate field pipeline source mappings')
    transaction.run_raw().bulk_insert_mappings(
        UnpublishedFieldPipelineDatasourceMapping, field_datasource_mappings
    )
    LOG.info(
        'Populated %d field pipeline data source mappings',
        len(field_datasource_mappings),
    )

    LOG.info('Starting to populate field category mappings')
    transaction.run_raw().bulk_insert_mappings(
        UnpublishedFieldCategoryMapping, field_category_mappings
    )
    LOG.info('Populated %d field category mappings', len(field_category_mappings))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--deployment',
        type=str,
        required=False,
        help=(
            'Name of the deployment used to get db uri'
            'based on database credential id in roledef'
        ),
    )
    parser.add_argument(
        '-d',
        '--sql_connection_string',
        type=str,
        required=False,
        help='The SQL Connection String to use to connect to the SQL '
        'Database. Can also be specified via the \'DATABASE_URL\' '
        'environment variable. The inline parameter takes priority'
        'over the environment variable.',
    )
    parser.add_argument(
        '--druid_fields_input_file',
        type=str,
        required=True,
        help='Input csv file with list of druid fields and datasources',
    )
    parser.add_argument(
        '--db_fields_input_file',
        type=str,
        required=True,
        help='Input csv file with list of fields in the database',
    )
    parser.add_argument(
        '--input_pipeline_field_metadata',
        type=str,
        required=False,
        help='The input file for fields with metadata',
    )
    parser.add_argument(
        '--input_pipeline_category_metadata',
        type=str,
        required=False,
        help='The input file for category metadata. All of these categories will '
        'be added to the database, so it is assumed that they have already been '
        'filtered to those not in the database already.',
    )
    args = parser.parse_args()

    sql_connection_string = args.sql_connection_string
    druid_fields_input_file = args.druid_fields_input_file
    db_fields_input_file = args.db_fields_input_file
    input_pipeline_field_metadata = args.input_pipeline_field_metadata
    input_pipeline_category_metadata = args.input_pipeline_category_metadata

    deployment_code = os.getenv('ZEN_ENV')
    if not sql_connection_string:
        deployment = args.deployment
        sql_connection_string = (
            get_local_db_uri(deployment_code)
            if not deployment and deployment_code
            else get_db_uri(args.deployment)
        )

    session = get_session(sql_connection_string)
    LOG.info('Starting to populate fields into the database')

    # If provided, read in the category metadata
    categories: List[ZenCategory] = []
    if input_pipeline_field_metadata:
        with open(input_pipeline_category_metadata, 'r') as pipeline_category_metadata:
            category_metadata = csv.DictReader(pipeline_category_metadata)
            categories.extend(
                {
                    'id': row['id'],
                    'name': row['name'],
                    'parent_id': row['parent_id'],
                }
                for row in category_metadata
            )

    druid_fields, field_source_lookup, db_fields = read_in_fields(
        druid_fields_input_file, db_fields_input_file
    )

    with Transaction(get_session=lambda: session) as transaction:
        sources = {source.id for source in transaction.find_all(PipelineDatasource)}
        add_missing_pipeline_datasources(transaction, field_source_lookup, sources)
        (
            unpublished_fields,
            field_datasource_mappings,
            field_category_mappings,
        ) = populate_field_metadata(
            input_pipeline_field_metadata,
            druid_fields,
            db_fields,
            field_source_lookup,
            sources,
        )
        populate_database(
            transaction,
            categories,
            unpublished_fields,
            field_datasource_mappings,
            field_category_mappings,
        )

    return 0


if __name__ == '__main__':
    sys.exit(main())
