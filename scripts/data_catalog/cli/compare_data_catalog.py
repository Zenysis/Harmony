from collections import namedtuple
from typing import List

from pylib.base.term_color import TermColor

from db.postgres.common import get_db_session
from models.alchemy.base import Base
from models.alchemy.query import (
    Category,
    Dimension,
    DimensionCategory,
    DimensionCategoryMapping,
    Field,
    FieldCategoryMapping,
    FieldDimensionMapping,
    FieldPipelineDatasourceMapping,
    PipelineDatasource,
)
from web.server.data.data_access import Transaction


# Purposely excluded unmapped field tables until they are fully rolled out.
DATA_CATALOG_TABLES = [
    Field,
    Dimension,
    PipelineDatasource,
    Category,
    DimensionCategory,
    FieldDimensionMapping,
    FieldPipelineDatasourceMapping,
    FieldCategoryMapping,
    DimensionCategoryMapping,
]


# Return the list of output for records compared to other records
def _collect_output(
    is_id_property: bool,
    columns: List[str],
    records: List[namedtuple],
    other_records: List[namedtuple],
    comparison_str: str,
) -> List[str]:
    to_print = []
    # For the mapping tables w/ an id, the mapping either exists or doesn't. For tables with
    # an id, display whether it's a completely new record or if just the metadata differs.
    if is_id_property:
        for record in sorted(records - other_records):
            to_print.append(f'\t\t{record}')
    else:
        # New records
        staging_only_ids = {record.id for record in records} - {
            record.id for record in other_records
        }
        completely_diff_records = {
            record for record in records if record.id in staging_only_ids
        }
        if completely_diff_records:
            to_print.append(TermColor.ColorStr('\t\tNew entries:', 'RED'))
        for record in sorted(completely_diff_records, key=lambda r: r.id):
            to_print.append(f'\t\t\t{record}')

        # Records w/ the same id, but different other column values
        metadata_different_records = records - other_records - completely_diff_records
        if metadata_different_records:
            to_print.append(
                TermColor.ColorStr(f'\t\tMetadata different: ({comparison_str})', 'RED')
            )
        for record in sorted(metadata_different_records, key=lambda r: r.id):
            to_print.append(f'\t\t\tId: {record.id}')
            matching_record = next(
                filter(lambda val: val.id == record.id, other_records)
            )
            for column_name in columns:
                if column_name != 'id' and getattr(record, column_name) != getattr(
                    matching_record, column_name
                ):
                    to_print.append(
                        f'\t\t\t\t{column_name}: "{getattr(record, column_name)}" vs. '
                        f'"{getattr(matching_record, column_name)}"'
                    )
    return to_print


# For the given table, compare and print
def _compare_and_print(
    table: Base, staging_transaction: Transaction, prod_transaction: Transaction
) -> None:
    table_name = table.__tablename__
    is_id_property = 'mapping' in table_name

    if is_id_property:
        table_tuple = namedtuple(
            table_name,
            [i.name for i in table.__table__.columns if i.name != 'id'],
        )
    else:
        table_tuple = namedtuple(table_name, [i.name for i in table.__table__.columns])

    staging_records = set(
        table_tuple(**{col: str(getattr(x, col)) for col in table_tuple._fields})
        for x in staging_transaction.find_all(table)
    )
    prod_records = set(
        table_tuple(**{col: str(getattr(x, col)) for col in table_tuple._fields})
        for x in prod_transaction.find_all(table)
    )

    staging_output = _collect_output(
        is_id_property,
        table_tuple._fields,
        staging_records,
        prod_records,
        'staging vs. prod',
    )
    prod_output = _collect_output(
        is_id_property,
        table_tuple._fields,
        prod_records,
        staging_records,
        'prod vs. staging',
    )

    if staging_output or prod_output:
        print(TermColor.ColorStr(f'{table_name} {"-" * 150}', 'PURPLE'))
    if staging_output:
        print(TermColor.ColorStr('\tStaging only:', 'DARK_CYAN'))
        print('\n'.join(staging_output))
    if prod_output:
        print(TermColor.ColorStr('\tProd only:', 'DARK_CYAN'))
        print('\n'.join(prod_output))


# For each data catalog table, compare staging to prod and output any differences.
def compare_data_catalog(
    staging_deployment: str,
    prod_deployment: str,
) -> None:
    staging_db_session = get_db_session(staging_deployment)
    prod_db_session = get_db_session(prod_deployment)

    with Transaction(
        get_session=lambda: staging_db_session
    ) as staging_transaction, Transaction(
        get_session=lambda: prod_db_session
    ) as prod_transaction:
        for table in DATA_CATALOG_TABLES:
            _compare_and_print(table, staging_transaction, prod_transaction)
