from config import settings

############################################################################
# General settings

# Top-level name of wherever we're working.
NATION_NAME = 'template_deployment_name'

# Internal name of project.
DEPLOYMENT_NAME = 'template_deployment_code'

# Name of deployment, used in client email communications.
DEPLOYMENT_FULL_NAME = 'Zenysis'

# Name of deployment abbreviated, used in client email communications.
DEPLOYMENT_SHORT_NAME = 'Zenysis'

# URL of deployment, without trailing slash.
DEPLOYMENT_BASE_URL = 'https://template_deployment_code.zenysis.com'

# Ids of deployment project managers
PROJECT_MANAGER_IDS = []

# Support email for user comms
SUPPORT_EMAIL = settings.SUPPORT_EMAIL

# The alias for object storage
OBJECT_STORAGE_ALIAS = settings.getenv('OBJECT_STORAGE_ALIAS')
