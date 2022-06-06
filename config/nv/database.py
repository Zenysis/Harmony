from config.template.general import DEPLOYMENT_NAME
from db.druid.metadata import DruidMetadata

############################################################################
# Database settings

# Latest druid datasource to use
DATASOURCE = DruidMetadata.get_most_recent_datasource(DEPLOYMENT_NAME)

POSTGRES_CONFIG = None
POSTGRES_DATASOURCE = None
