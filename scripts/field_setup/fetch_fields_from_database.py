#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
'''Fetch field ids from the field and unpublished field tables.

To run locally:
    ZEN_ENV=<> ./scripts/field_setup/fetch_fields_from_database.py \
        --output_file db_fields.csv
'''
import csv
import sys
from typing import List, Optional, Set, TextIO

from flask import current_app
from pylib.base.flags import Flags

from config.druid_base import FIELD_NAME
from data.query.models.calculation import Calculation
from db.druid.util import (
    EmptyFilter,
    build_filter_from_aggregation,
    get_dimension_filters,
)
from log import LOG
from models.alchemy.query import Category, Field, UnpublishedField
from web.server.app_druid import initialize_druid_context
from web.server.data.data_access import Transaction
from util.local_script_wrapper import local_main_wrapper


# TODO: This isn't the full code we would want to use long term,
# but it could be worth having in the short term to unblock us here.
# The main problem with it is that the get_dimension_filters method is built
# for a query building use-case and does not claim to be fully accurate.
# If it sees a filter it doesn't understand, it will stop recursing
# and will return an empty set.
# We need to produce a recursive method that digs into the aggregation filter
# and finds any "selector" filters or "in" filters that operate on the "field"
# dimension. Then, we would take these values and build our set from this.
def get_ids_from_field(field: Field) -> Set[str]:
    # Always include the field id so there aren't database conflicts
    ids = {field.id}
    raw_calculation = field.calculation
    if raw_calculation:
        calculation_filter = raw_calculation.get('filter') or {}
        filter_type = calculation_filter.get('type')
        if not filter_type:
            return ids

        calculation = Calculation.polymorphic_to_model(raw_calculation)
        druid_calculation = calculation.to_druid(field.id)
        full_filter = EmptyFilter()
        for aggregation in druid_calculation.aggregations.values():
            agg_filter = build_filter_from_aggregation(aggregation)
            if agg_filter:
                full_filter |= agg_filter

        if isinstance(full_filter, EmptyFilter):
            return ids

        dimension_filters = get_dimension_filters(full_filter)
        ids.update(dimension_filters[0][FIELD_NAME])
    return ids


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


def _write(
    output_file: TextIO, header: str, output_ids: List[str], log_message: str
) -> None:
    writer = csv.writer(output_file)
    writer.writerow([header])
    for id_ in output_ids:
        writer.writerow([id_])
    LOG.info(log_message, len(output_ids))


def _get_and_write_fields(
    transaction: Transaction,
    output_field_file: TextIO,
    output_categories_file_name: Optional[str] = None,
) -> None:
    # Output all field ids to the output file
    published_fields = get_fields_from_fields_table(transaction)
    unpublished_fields = get_used_fields_from_unpublished_fields_table(transaction)
    all_field_ids = sorted({*published_fields, *unpublished_fields})
    _write(
        output_field_file,
        FIELD_NAME,
        all_field_ids,
        'Found %d fields in both the field and unpublished_field tables',
    )

    # If enabled, output category ids to the output file
    if output_categories_file_name is None:
        return
    category_ids = sorted([category.id for category in transaction.find_all(Category)])
    with open(
        output_categories_file_name, 'w', encoding='utf-8'
    ) as output_categories_file:
        _write(
            output_categories_file,
            'category_id',
            category_ids,
            'Found %d categories in the category table',
        )


def setup_arguments() -> None:
    Flags.PARSER.add_argument(
        '-f', '--output_file', type=str, required=True, help='Output csv file'
    )
    Flags.PARSER.add_argument(
        '--output_categories_file',
        type=str,
        required=False,
        help='Output csv file for the category ids found in the database',
    )


def main() -> int:
    initialize_druid_context(current_app)
    output_fields_file_name = Flags.ARGS.output_file
    output_categories_file_name = Flags.ARGS.output_categories_file

    LOG.info('Starting to fetch fields from db')
    with Transaction() as transaction, open(
        output_fields_file_name, 'w', encoding='utf-8'
    ) as output_fields_file:
        _get_and_write_fields(
            transaction,
            output_fields_file,
            output_categories_file_name,
        )
    LOG.info('Done!')
    return 0


if __name__ == '__main__':
    sys.exit(local_main_wrapper(main, setup_arguments))
