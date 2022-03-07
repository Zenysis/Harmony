'''Class FieldDatasourcesCache builds a list of datasources and maps each field in data catalog
to its corresponding source.

It takes the sources as defined in PIPELINE_CONFIG where the PipelineDatasource id is the
`druid_source` (the source in druid), which will default to the `source_id` (the name of the
pipeline step) if not provided. It will also include any sources created through data upload as
they are user created and defined only in the database.

It then queries druid to fetch all fields and sources to create the mapping from
pipeline datasource to a list of fields and unpublished fields. If a field exists in data
catalog, but is not present in druid, then its source can be passed in via the `mapping`
parameter.

Red log messages are fatal errors. Yellow log messages are non-fatal, but should be addressed
as they signify druid sources missing from PIPELINE_CONFIG or fields without a source.
'''

from collections import defaultdict
import os
import sys
from typing import Dict, List, Optional, Union

from pylib.base.term_color import TermColor
from sqlalchemy.orm.session import Session

from config.druid_base import FIELD_NAME, SOURCE_NAME
from config.loader import import_configuration_module
from db.druid.config import construct_druid_configuration
from db.druid.errors import MissingDatasourceException
from db.druid.metadata import DruidMetadata_
from db.druid.query_client import DruidQueryClient_
from log import LOG
from models.alchemy.data_upload import SelfServeSource
from models.alchemy.query import Field, PipelineDatasource, UnpublishedField
from web.server.data.data_access import Transaction
from web.server.data.time_boundary import DataTimeBoundary
from web.server.util.dev.static_data_query_client import StaticDataQueryClient


# Fetch from druid all fields and sources.
def get_druid_field_sources(
    druid_host: str, deployment_code: str
) -> List[Dict[str, str]]:
    druid_configuration = construct_druid_configuration(druid_host)
    base_query_client = DruidQueryClient_(druid_configuration)
    druid_metadata = DruidMetadata_(druid_configuration, base_query_client)

    try:
        datasource = druid_metadata.get_most_recent_datasource(deployment_code)
    except MissingDatasourceException:
        LOG.info(
            'No datasource could be found for deployment %s. Skipping',
            deployment_code,
        )
        sys.exit(1)

    query_client = (
        base_query_client
        if os.getenv('IS_PRODUCTION') or os.getenv('IS_TEST')
        else StaticDataQueryClient(druid_configuration, datasource, druid_metadata)
    )
    time_boundary = DataTimeBoundary(query_client, datasource)

    # Group by field and source any filter out any rows without a field.
    query = {
        'aggregations': [],
        'dataSource': datasource.name,
        'dimensions': [FIELD_NAME, SOURCE_NAME],
        'granularity': 'all',
        'queryType': 'groupBy',
        'intervals': time_boundary.get_full_time_interval(),
        'filter': {
            'type': 'not',
            FIELD_NAME: {'type': 'selector', 'dimension': FIELD_NAME, 'value': ''},
        },
    }
    return query_client.run_raw_query(query)


# If a field was not assigned a source, attempt to find one:
#  - For copied fields, use the copied field's source.
#  - For composite fields, attempt to find the single source they're under.
#  - Otherwise, log the field.
def handle_unmatched_field(
    field: Union[Field, UnpublishedField],
    field_to_source: Dict[str, str],
    source_to_fields: Dict[str, List[str]],
) -> None:
    # Copied fields have their own id, but the same source. Unpublished fields cannot be copied.
    copied_id = (
        field.copied_from_field_id if hasattr(field, 'copied_from_field_id') else None
    )
    if copied_id is not None:
        if copied_id in field_to_source:
            source_id = field_to_source[copied_id]
            field_to_source[field.id] = source_id
            source_to_fields[source_id].append(field.id)
        else:
            LOG.info(
                TermColor.ColorStr(
                    f'The copied field id "{copied_id}" for field "{field.id}" was not '
                    'found in druid or supplemental mapping.',
                    'YELLOW',
                )
            )
    # Try to assign a source for composite fields.
    elif (
        field.calculation['filter']
        and 'type' in field.calculation['filter']
        and field.calculation['filter']['type'] == 'FIELD_IN'
    ):
        if any(
            field_id not in field_to_source
            for field_id in field.calculation['filter']['fieldIds']
        ):
            LOG.info(
                TermColor.ColorStr(
                    f'Composite field "{field.id}" had sub-fields not found in druid '
                    'or supplemental mapping',
                    'YELLOW',
                )
            )
        else:
            composite_sources = {
                field_to_source[field_id]
                for field_id in field.calculation['filter']['fieldIds']
            }
            # If a composite field has multiple sources, skip it
            if len(composite_sources) == 1:
                source = composite_sources.pop()
                field_to_source[field.id] = source
                source_to_fields[source].append(field.id)
            else:
                LOG.info(
                    'Composite field "%s" had %s sources and will not be assigned a mapping.',
                    field.id,
                    len(composite_sources),
                )
    else:
        LOG.info(
            TermColor.ColorStr(
                f'"{field.id}" not found in druid or supplemental mapping', 'YELLOW'
            )
        )


# Formula and cohort fields have no source.
def should_have_datasource(field: Union[Field, UnpublishedField]) -> bool:
    return field.calculation['type'] not in {'FORMULA', 'COHORT'}


class FieldDatasourcesCache:
    '''Query Druid and cache the source for every raw field ID. Init will only build the list
    of datasources. `build_field_mapping` must also be called to create the field mappings.

    Attributes:
        datasources: A mapping from source id to a dict of id and name
        source_to_published_fields: A mapping from source id to a list of field ids that
            are in that source. Only fields in data catalog are included in these lists.
        source_to_unpublished_fields: A mapping from source id to a list of unpublished
            field ids that are in that source. Only unpublished fields in data catalog
            are included in these lists.
        field_to_source: A mapping from field id to source id. All field ids in druid are
            included in this mapping.

    NOTE(abby): This class should *never* be used in a server context. It should only
    be used by data catalog scripts in development.
    '''

    def __init__(
        self,
        deployment_code: str,
        session: Session,
    ):
        env_config = import_configuration_module(deployment_code)
        pipeline_config = env_config.pipeline_sources.PIPELINE_CONFIG

        LOG.info('Building datasource list')
        # Build the list of datasources. Self serve sources exist only in the database, so fetch
        # those and combine them with the other sources defined in config.pipeline_sources.
        # Reverse the order because some druid sources are duplicated and we want the first
        # pipeline source.
        self.datasources = {}
        for source in pipeline_config:
            self.datasources[source.source_id] = {
                'id': source.source_id,
                'name': source.display_name,
            }
            for druid_source in source.druid_sources:
                self.datasources[druid_source] = {
                    'id': druid_source,
                    'name': druid_source,
                }

        with Transaction(get_session=lambda: session) as transaction:
            # HACK(open source): there is no self serve
            # landed. Remove soon.
            if hasattr(SelfServeSource, 'source_name'):
                self_serve_sources = []
            else:
                self_serve_sources = []
                for source in self_serve_sources:
                    # For any self-serve dataprep sources, override the config source definition.
                    self.datasources[source.id] = {'id': source.id, 'name': source.name}
            LOG.info(
                TermColor.ColorStr(
                    'Completed building datasource list. Datasources: '
                    f'{len(self.datasources)} ({len(self_serve_sources)} are self serve)',
                    'PURPLE',
                )
            )

        self.source_to_published_fields = defaultdict(list)
        self.source_to_unpublished_fields = defaultdict(list)
        self.field_to_source = {}

    # Query druid and build `source_to_published_fields`, `source_to_unpublished_fields`, and
    # `field_to_source` lookups.
    def build_field_mapping(
        self,
        deployment_code: str,
        session: Session,
        mapping: Optional[List[str]] = None,
    ):
        env_config = import_configuration_module(deployment_code)
        druid_host = env_config.druid.DRUID_HOST

        with Transaction(get_session=lambda: session) as transaction:
            # Fetch all fields and unpublished fields to be mapped
            LOG.info('Building field datasource mapping cache')
            fields = {field.id: field for field in transaction.find_all(Field)}
            unpublished_fields = {
                unpublished_field.id: unpublished_field
                for unpublished_field in transaction.find_all(UnpublishedField)
            }

        # Build supplemental mapping and check all sources exist
        mapping = [] if mapping is None else mapping
        error_state = False
        for field_source in mapping:
            field_id, source_id = field_source.split(':')
            if source_id not in self.datasources:
                LOG.info(
                    TermColor.ColorStr(f'Source {source_id} does not exist', 'RED')
                )
                error_state = True

            if field_id in fields:
                self.source_to_published_fields[source_id].append(field_id)
            elif field_id in unpublished_fields:
                self.source_to_unpublished_fields[source_id].append(field_id)
            self.field_to_source[field_id] = source_id
        if error_state:
            LOG.info(
                TermColor.ColorStr(
                    'Cannot build mapping with non-existant sources, exiting', 'RED'
                )
            )
            sys.exit(1)

        # Query druid for mapping between field ids and source. Build mapping between them.
        # druid_results = get_druid_field_sources(druid_host, deployment_code)
        druid_results = []
        self.add_druid_fields_to_lookup(
            druid_results,
            fields,
            unpublished_fields,
        )

        number_published_mappings = sum(
            len(field_list) for field_list in self.source_to_published_fields.values()
        )
        number_unpublished_mappings = sum(
            len(field_list) for field_list in self.source_to_unpublished_fields.values()
        )
        # Formula and cohort fields should not have a datasource
        expected_published_mappings = sum(
            field.calculation['type'] not in {'FORMULA', 'COHORT'}
            for field in fields.values()
        )
        LOG.info(
            TermColor.ColorStr(
                f'Field datasource mapping cache is built. For {len(fields)} fields, '
                f'{number_published_mappings} out of {expected_published_mappings} expected '
                f'mappings found. For {len(unpublished_fields)} unpublished fields, '
                f'{number_unpublished_mappings} out of {len(unpublished_fields)} expected '
                'mappings found.',
                'PURPLE',
            )
        )

    # Add the fields from druid to the lookup from druid source to a list of corresponding
    # fields and unpublished fields.
    def add_druid_fields_to_lookup(
        self,
        druid_results: List[Dict[str, str]],
        fields: Dict[str, Field],
        unpublished_fields: Dict[str, UnpublishedField],
    ) -> None:
        druid_only_sources = defaultdict(int)

        LOG.info(TermColor.ColorStr('Beginning organizing fields', 'DARK_CYAN'))
        for row in druid_results:
            field_id = row['event'][FIELD_NAME]
            source_id = row['event'][SOURCE_NAME]

            if field_id in self.field_to_source:
                LOG.info(
                    TermColor.ColorStr(
                        f'Field id "{field_id}" has multiple sources', 'RED'
                    )
                )
            if source_id not in self.datasources:
                druid_only_sources[source_id] += 1

            self.field_to_source[field_id] = source_id
            if field_id in fields and should_have_datasource(fields[field_id]):
                self.source_to_published_fields[source_id].append(field_id)
            elif field_id in unpublished_fields:
                self.source_to_unpublished_fields[source_id].append(field_id)

        for field in fields.values():
            if field.id not in self.field_to_source and should_have_datasource(field):
                handle_unmatched_field(
                    field, self.field_to_source, self.source_to_published_fields
                )

        for unpublished_field in unpublished_fields.values():
            if unpublished_field.id not in self.field_to_source:
                handle_unmatched_field(
                    unpublished_field,
                    self.field_to_source,
                    self.source_to_unpublished_fields,
                )

        for source, num_fields in druid_only_sources.items():
            LOG.info(
                TermColor.ColorStr(
                    f'Druid source "{source}" has no matching config source. It has {num_fields} '
                    'field(s).',
                    'YELLOW',
                )
            )

        LOG.info(TermColor.ColorStr('Completed organizing fields', 'DARK_CYAN'))
