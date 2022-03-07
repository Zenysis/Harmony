'''This script repopulates the PipelineDatasource table and the FieldPipelineDatasourceMapping
and UnpublishedFieldPipelineDatasourceMapping tables. All previous datasources (except for ones
created through data upload) and mappings are deleted. The datasources are repopulated with the
sources as defined in PIPELINE_CONFIG. The mappings are repopulated from druid. See
`FieldDatasourcesCache` for more info.

Example usage:
    ZEN_ENV=afsa yarn cli-data-catalog populate_datasources \
        --mapping field1:AGYW field2:"AGYW Biomedical"
'''

import os
from typing import Dict, List, Optional

from pylib.base.term_color import TermColor

from db.postgres.common import get_db_session
from models.alchemy.data_upload import SelfServeSource
from models.alchemy.query import (
    FieldPipelineDatasourceMapping,
    PipelineDatasource,
    UnpublishedFieldPipelineDatasourceMapping,
)
from scripts.cli_util.list_deployments import (
    get_zen_env_from_deployment,
    is_deployment_code_valid,
    is_deployment_name_valid,
)
from scripts.data_catalog.compute_datasource_from_druid import FieldDatasourcesCache
from web.server.data.data_access import Transaction


SELF_SERVE_SOURCE_NAME = 'self_serve'


# Clear the FieldPipelineDatasourceMapping, UnpublishedFieldPipelineDatasourceMapping, and
# PipelineDatasource tables. For the PipelineDatasource table, don't delete self serve sources
# as that will delete the linked SelfServeSources. Log the number of entries in each.
def clear_tables(transaction: Transaction) -> None:
    # FieldPipelineDatasourceMapping table
    field_datasource_mappings = transaction.run_raw().query(
        FieldPipelineDatasourceMapping
    )
    print(
        TermColor.ColorStr(
            f'\nDeleting {field_datasource_mappings.count()} entries from the '
            'FieldPipelineDatasourceMapping table',
            'PURPLE',
        )
    )
    field_datasource_mappings.delete()

    # UnpublishedFieldPipelineDatasourceMapping table
    unpublished_field_datasource_mappings = transaction.run_raw().query(
        UnpublishedFieldPipelineDatasourceMapping
    )
    print(
        TermColor.ColorStr(
            f'Deleting {unpublished_field_datasource_mappings.count()} entries from the '
            'UnpublishedFieldPipelineDatasourceMapping table',
            'PURPLE',
        )
    )
    unpublished_field_datasource_mappings.delete()

    # PipelineDatasource table
    # Get all pipeline datasources that do not have a self serve source
    datasources = (
        transaction.run_raw()
        .query(PipelineDatasource)
        .join(SelfServeSource, isouter=True)
        # pylint: disable=singleton-comparison
        .filter(SelfServeSource.id == None)
    )
    print(
        TermColor.ColorStr(
            f'Deleting {datasources.count()} entries from the PipelineDatasource table',
            'PURPLE',
        )
    )
    for record in datasources:
        transaction.delete(record)


# Populate the FieldPipelineDatasourceMapping, UnpublishedFieldPipelineDatasourceMapping, and
# PipelineDatasource tables with the values from druid. Log new number of entries for each table.
def populate_tables(
    transaction: Transaction,
    pipeline_sources: Dict[str, Dict[str, str]],
    source_to_published_fields: Dict[str, List[str]],
    source_to_unpublished_fields: Dict[str, List[str]],
) -> None:
    print(TermColor.ColorStr('\nBeginning populating fields', 'DARK_CYAN'))
    source_ids = set()
    datasources = []
    published_field_datasource_mappings = []
    unpublished_field_datasource_mappings = []

    for source in pipeline_sources.values():
        source_id = source['id']
        # Some pipeline sources share a druid_source, so they have already been processed.
        if source_id in source_ids:
            continue
        # The self serve sources weren't deleted, so only add datasources if they don't already
        # exist.
        if not transaction.find_by_id(PipelineDatasource, source_id):
            datasources.append(source)

        source_ids.add(source_id)
        if (
            source_id not in source_to_published_fields
            and source_id not in source_to_unpublished_fields
        ):
            # Self serve is just the pipeline step, so it won't ever have fields.
            if source_id != SELF_SERVE_SOURCE_NAME:
                print(f'Source "{source_id}" has no fields or unpublished fields.')
            continue

        # Loop through all fields in each source and assign their respective mapping.
        field_list = source_to_published_fields.pop(source_id, [])
        for field_id in field_list:
            published_field_datasource_mappings.append(
                {'field_id': field_id, 'pipeline_datasource_id': source_id}
            )

        unpublished_field_list = source_to_unpublished_fields.pop(source_id, [])
        for field_id in unpublished_field_list:
            unpublished_field_datasource_mappings.append(
                {'unpublished_field_id': field_id, 'pipeline_datasource_id': source_id}
            )

    # Bulk insert the datasources and mappings into the db.
    transaction.run_raw().bulk_insert_mappings(PipelineDatasource, datasources)
    transaction.run_raw().bulk_insert_mappings(
        FieldPipelineDatasourceMapping, published_field_datasource_mappings
    )
    transaction.run_raw().bulk_insert_mappings(
        UnpublishedFieldPipelineDatasourceMapping,
        unpublished_field_datasource_mappings,
    )
    print(TermColor.ColorStr('Completed populating fields', 'DARK_CYAN'))

    print(
        TermColor.ColorStr(
            f'\nAdded {len(published_field_datasource_mappings)} entries to the '
            'FieldPipelineDatasourceMapping table.',
            'PURPLE',
        )
    )
    print(
        TermColor.ColorStr(
            f'Added {len(unpublished_field_datasource_mappings)} entries to the '
            'UnpublishedFieldPipelineDatasourceMapping table.',
            'PURPLE',
        )
    )
    print(
        TermColor.ColorStr(
            f'There are now {len(source_ids)} entries in the PipelineDatasource table.',
            'PURPLE',
        )
    )


# Populate the PipelineDatasource table with values from PIPELINE_CONFIG and read all fields
# from druid to populate the PipelineDatasource mapping tables. Deletes all existing
# PipelineDatasources (except self serve sources) and mappings.
def populate_datasources(
    deployment_name: Optional[str] = None, mapping: List[str] = None
):
    if deployment_name is not None:
        is_deployment_name_valid(deployment_name, print_help=True)
        deployment_code = get_zen_env_from_deployment(deployment_name)
    else:
        deployment_code = os.getenv('ZEN_ENV')
        is_deployment_code_valid(deployment_code, print_help=True)
    session = get_db_session(deployment_name, deployment_code)

    field_datasource_cache = FieldDatasourcesCache(deployment_code, session)
    field_datasource_cache.build_field_mapping(deployment_code, session, mapping)

    with Transaction(get_session=lambda: session) as transaction:
        # Delete all current entries from these tables
        clear_tables(transaction)
        # Populate the new entries generated by FieldDatasourcesCache
        populate_tables(
            transaction,
            field_datasource_cache.datasources,
            field_datasource_cache.source_to_published_fields,
            field_datasource_cache.source_to_unpublished_fields,
        )
