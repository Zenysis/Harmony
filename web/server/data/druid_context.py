from functools import lru_cache
from typing import Dict, Optional

from flask import current_app

# pylint: disable=no-name-in-module
from werkzeug import cached_property

from db.druid.config import BaseDruidConfig
from db.druid.datasource import SiteDruidDatasource
from db.druid.metadata import AbstractDruidMetadata
from db.druid.query_client import DruidQueryRunner
from log import LOG
from models.alchemy.configuration import Configuration
from models.alchemy.query import DruidDatasource
from web.server.configuration.settings import CUR_DATASOURCE_KEY, get_configuration
from web.server.data.data_access import Transaction
from web.server.data.dimension_values import DimensionValuesLookup
from web.server.data.row_count import RowCountLookup
from web.server.data.status import SourceStatus
from web.server.data.time_boundary import DataTimeBoundary


class DruidApplicationContext:
    '''A class that contains and produces metadata related to the currently
    loaded Druid datasource.
    '''

    def __init__(
        self,
        deployment_name: str,
        query_client: DruidQueryRunner,
        druid_metadata: AbstractDruidMetadata,
        druid_port_configuration: BaseDruidConfig,
        datasource_config: Optional[str],
        skip_grouped_sketch_sizes: bool,
    ):
        self.druid_metadata = druid_metadata
        self.druid_port_configuration = druid_port_configuration
        self._datasource_config = datasource_config
        self._deployment_name = deployment_name
        self._query_client = query_client
        self._last_used_datasource: Optional[str] = None
        self._skip_grouped_sketch_sizes = skip_grouped_sketch_sizes

    @property
    def datasource_config(self):
        return self._datasource_config or get_configuration(CUR_DATASOURCE_KEY)

    def __repr__(self):
        # Neccessary so `get_current_db_datasource` memoization varies with deployment
        # as those use different databases and thus different datasources
        return f'<{self.__class__.__name__} object for {self._deployment_name}>'

    @lru_cache(1)
    def _get_row_count_lookup(self, datasource):
        return RowCountLookup(self._query_client, datasource)

    @property
    def row_count_lookup(self):
        return self._get_row_count_lookup(self.current_datasource)

    @lru_cache(1)
    def _get_data_status_information(self, datasource):
        status_information = SourceStatus(
            self._query_client,
            datasource,
            current_app.zen_config.data_status.DATA_STATUS_STATIC_INFO,
            current_app.zen_config.ui.ENABLE_ET_DATE_SELECTION,
        )
        status_information.load_all_status()
        return status_information

    @property
    def data_status_information(self):
        return self._get_data_status_information(self.current_datasource)

    @property
    def data_time_boundary(self):
        selected_datasource = self.current_db_datasource
        return DataTimeBoundary(
            self._query_client,
            self.current_datasource,
            {
                'timestamp': '',
                'result': {
                    'minTime': selected_datasource.min_date.isoformat(),
                    'maxTime': selected_datasource.max_date.isoformat(),
                },
            },
        )

    @property
    def available_datasources(self) -> Dict[str, DruidDatasource]:
        with Transaction() as transaction:
            druid_datasources = (
                transaction.run_raw()
                .query(DruidDatasource)
                .order_by(DruidDatasource.datasource.desc())
                .all()
            )
        return {datasource.datasource: datasource for datasource in druid_datasources}

    @property
    def current_datasource(self) -> SiteDruidDatasource:
        return SiteDruidDatasource.build(self.current_db_datasource.datasource)

    @property
    def current_db_datasource(self) -> DruidDatasource:
        return self.get_current_db_datasource()

    @property
    def get_current_db_datasource(self):
        return current_app.cache.memoize(timeout=180)(self._get_current_db_datasource)

    def _get_current_db_datasource(self) -> DruidDatasource:
        # If an admin selected 'LATEST_DATASOURCE' in the admin app, app will always
        # select the most recent datasource. Otherwise, we will use the datasource
        # the admin selected and default to most recent datasource if datasource
        # doesn't exist.
        available_datasources = self.available_datasources
        datasource_config = self.datasource_config
        if datasource_config in available_datasources:
            datasource = available_datasources[datasource_config]
        else:
            datasource = available_datasources[sorted(available_datasources)[-1]]
            if datasource_config != 'LATEST_DATASOURCE':
                LOG.error('Datasource %s does not exist.', datasource_config)
                with Transaction() as transaction:
                    config_database_entity = transaction.find_one_by_fields(
                        Configuration,
                        search_fields={'key': CUR_DATASOURCE_KEY},
                        case_sensitive=False,
                    )
                    config_database_entity.overwritten_value = 'LATEST_DATASOURCE'
                    config_database_entity.overwritten = True
                    transaction.add_or_update(config_database_entity, flush=True)

        if self._last_used_datasource != datasource.datasource:
            LOG.info(
                '** Using datasource %s on host %s **',
                datasource.datasource,
                self.druid_port_configuration.base_endpoint(),
            )
            self._last_used_datasource = datasource.datasource
        return datasource

    @lru_cache(1)
    def _get_dimension_values_lookup(self, datasource):
        zen_configuration = current_app.zen_config
        return DimensionValuesLookup(
            self._query_client,
            datasource,
            zen_configuration.filters.FILTER_DIMENSIONS,
            zen_configuration.aggregation.DIMENSION_SLICES,
            zen_configuration.filters.AUTHORIZABLE_DIMENSIONS,
            zen_configuration.aggregation.GEO_FIELD_ORDERING,
        )

    @property
    def dimension_values_lookup(self):
        return self._get_dimension_values_lookup(self.current_datasource)

    @lru_cache(1)
    def _get_dimension_metadata(self, datasource):
        # NOTE: defer this import because pipelines still have python that
        # don't support walrus operator and parsing of some of the imports down
        # the road fails pipeline. Can be moved back to the top when pipelines are
        # upgraded or dockerized
        # pylint: disable=import-outside-toplevel
        from web.server.data.dimension_metadata import DimensionMetadata

        return DimensionMetadata(self._query_client, datasource)

    @property
    def dimension_metadata(self):
        dimension_metadata = self._get_dimension_metadata(self.current_datasource)
        dimension_metadata.load_dimension_metadata()
        return dimension_metadata


class PopulatingDruidApplicationContext(DruidApplicationContext):
    '''A class that really loads data from druid rather than relying on what
    is stored in the db. Actually, should only be used to populate the db itself'''

    # pylint: disable=invalid-overridden-method
    @cached_property
    def dimension_values_lookup(self):
        dimension_values = super().dimension_values_lookup
        dimension_values.load_dimensions_from_druid()
        return dimension_values

    @cached_property
    def current_datasource(self):
        if self._datasource_config == 'LATEST_DATASOURCE':
            return self.druid_metadata.get_most_recent_datasource(self._deployment_name)
        datasources = {d.name: d for d in self.druid_metadata.get_site_datasources()}
        datasource = datasources.get(self._datasource_config)
        if datasource is None or datasource.site != self._deployment_name:
            raise ValueError(f'{self._datasource_config} is not a valid datasource')
        return datasource

    @cached_property
    def data_time_boundary(self):
        return DataTimeBoundary(self._query_client, self.current_datasource)

    @cached_property
    def dimension_metadata(self):
        dimension_metadata = self._get_dimension_metadata(self.current_datasource)
        dimension_metadata.populate_dimension_metadata(
            current_app.zen_config.aggregation.DIMENSION_CATEGORIES,
            current_app.zen_config.aggregation.DIMENSION_ID_MAP,
            # pylint: disable=no-member
            self.data_time_boundary.get_full_time_interval(),
            self._skip_grouped_sketch_sizes,
        )
        return dimension_metadata
