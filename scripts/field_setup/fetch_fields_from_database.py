#!/usr/bin/env python

import os
import sys

from typing import Set

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker
from pylib.base.flags import Flags


from config.druid_base import FIELD_NAME
from data.query.models.calculation import Calculation
from db.postgres.common import get_db_uri, get_local_db_uri
from db.druid.util import (
    EmptyFilter,
    build_filter_from_aggregation,
    get_dimension_filters,
)
from log import LOG
from models.alchemy.query import Field, UnpublishedField
from web.server.data.data_access import Transaction


def get_session(sql_connection_string: str) -> sessionmaker:
    # pylint: disable=invalid-name
    Session = sessionmaker()
    engine = create_engine(sql_connection_string)
    Session.configure(bind=engine)
    session = Session()
    return session


# TODO(solo, stephen): This isn't the full code we would want to use long term,
# but it could be worth having in the short term to unblock us here.
# The main problem with it is that the get_dimension_filters method is built
# for a query building use-case and does not claim to be fully accurate.
# If it sees a filter it doesn't understand, it will stop recursing
# and will return an empty set.
# We need to produce a recursive method that digs into the aggregation filter
# and finds any "selector" filters or "in" filters that operate on the "field"
# dimension. Then, we would take these values and build our set from this.
def get_ids_from_field(field: Field) -> Set[str]:
    raw_calculation = field.calculation
    if raw_calculation:
        calculation_filter = raw_calculation.get('filter') or {}
        filter_type = calculation_filter.get('type')
        if not filter_type:
            return set()
        # HACK(solo): There is no easy way to convert polymorphic models directly
        # without them being used first as a child field. The easiest way would
        # have been to call related.to_model(Calculation, raw_calculation)
        # but calling to_druid on the resulting calculation raises a valueError.
        calculation_converter = Calculation.child_field().converter
        calculation = calculation_converter(raw_calculation)

        druid_calculation = calculation.to_druid(field.id)
        full_filter = EmptyFilter()
        for aggregation in druid_calculation.aggregations.values():
            agg_filter = build_filter_from_aggregation(aggregation)
            if agg_filter:
                full_filter |= agg_filter

        if isinstance(full_filter, EmptyFilter):
            return set()

        dimension_filters = get_dimension_filters(full_filter)
        return set(dimension_filters[0][FIELD_NAME])
    return set([field.id])


def get_fields_from_fields_table(transaction: Transaction) -> Set[str]:
    db_fields = transaction.find_all_by_fields(Field, {})
    field_ids = set()
    for field in db_fields:
        field_ids.update(get_ids_from_field(field))
    return field_ids


def get_used_fields_from_unpublished_fields_table(
    transaction: Transaction,
) -> Set[str]:
    db_fields = transaction.find_all_by_fields(UnpublishedField, {})
    field_ids = set()
    for field in db_fields:
        field_ids.update(get_ids_from_field(field))
    return field_ids


def main():
    '''Fetch field ids from the field and un published field tables.

    To run locally:
        ./scripts/field_setup/fetch_fields_from_database --output_file output.csv
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
        '-f', '--output_file', type=str, required=True, help='Output csv file'
    )

    Flags.InitArgs()
    sql_connection_string = Flags.ARGS.sql_connection_string
    output_file = Flags.ARGS.output_file

    deployment_code = os.getenv('ZEN_ENV')
    if not sql_connection_string:
        deployment = Flags.ARGS.deployment
        sql_connection_string = (
            get_local_db_uri(deployment_code)
            if not deployment
            else get_db_uri(Flags.ARGS.deployment)
        )

    LOG.info('Starting to fetch fields from db')
    session = get_session(sql_connection_string)

    with Transaction(get_session=lambda: session) as transaction, open(
        output_file, 'w', encoding='utf-8'
    ) as out:
        published_fields = get_fields_from_fields_table(transaction)
        unpublished_fields = get_used_fields_from_unpublished_fields_table(transaction)

        all_field_ids = sorted(set([*published_fields, *unpublished_fields]))
        out.write(FIELD_NAME)
        for field_id in all_field_ids:
            out.write('\n')
            out.write(field_id)
        out.write('\n')
    LOG.info(
        'Found %d fields in both the field and unpublished_field tables',
        len(all_field_ids),
    )
    LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
