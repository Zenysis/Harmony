import os

from db.druid.config import construct_druid_configuration
from db.druid.query_client import DruidQueryClient_, DruidQueryRunner
from db.druid.metadata import AbstractDruidMetadata, DruidMetadata_
from web.server.data.druid_context import DruidApplicationContext
from web.server.environment import OFFLINE_MODE
from util.offline_mode import (
    MockDruidQueryClient,
    MockDruidMetadata,
)


def initialize_druid_context(
    app,
    datasource_config='LATEST_DATASOURCE',
    cls=DruidApplicationContext,
    # This should only be set if the cls is PopulatingDruidApplicationContext.
    # Otherwise, it's not used.
    skip_grouped_sketch_sizes: bool = False,
):
    zen_configuration = app.zen_config
    # Pulling Data from Zen_Config Module
    druid_host = os.getenv('DRUID_HOST', zen_configuration.druid.DRUID_HOST)
    deployment_name = zen_configuration.general.DEPLOYMENT_NAME

    druid_configuration = construct_druid_configuration(druid_host)
    system_query_client: DruidQueryRunner = DruidQueryClient_(druid_configuration)
    druid_metadata: AbstractDruidMetadata = DruidMetadata_(
        druid_configuration, system_query_client
    )

    # TODO - Having an environment variable for this seems
    # like an incredibly limiting choice. This should probably be passed into
    # the configuration of the Flask App.
    # pylint: disable=E0110
    if OFFLINE_MODE:
        geo_to_lat_long_field = zen_configuration.aggregation.GEO_TO_LATLNG_FIELD
        map_default_lat_long = zen_configuration.ui.MAP_DEFAULT_LATLNG
        system_query_client = MockDruidQueryClient(
            geo_to_lat_long_field, map_default_lat_long
        )
        druid_metadata = MockDruidMetadata(deployment_name)

    druid_context = cls(
        deployment_name,
        system_query_client,
        druid_metadata,
        druid_configuration,
        datasource_config,
        skip_grouped_sketch_sizes,
    )
    app.query_client = app.system_query_client = system_query_client

    app.system_query_client = system_query_client
    app.druid_context = druid_context
