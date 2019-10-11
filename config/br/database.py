from config.br.general import DEPLOYMENT_NAME
from db.druid.metadata import DruidMetadata

############################################################################
# Database settings

# Latest druid datasource to use
DATASOURCE = DruidMetadata.get_most_recent_datasource(DEPLOYMENT_NAME)

# NOTE(moriah): This site does not support the GeoExplorer
POSTGRES_CONFIG = None
POSTGRES_DATASOURCE = None
