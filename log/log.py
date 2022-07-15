import logging
import platform
from logging.config import dictConfig

from log.config import DEV_CONFIG, PROD_CONFIG
from web.server.environment import IS_PRODUCTION, IS_TEST

# Load the appropriate logging configuration
LOG_CONFIG = PROD_CONFIG if IS_PRODUCTION else DEV_CONFIG
dictConfig(LOG_CONFIG)

LOG = logging.getLogger('ZenysisLogger')
