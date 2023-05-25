import os
from web.server.environment import IS_PRODUCTION, IS_TEST

ROLLBAR_ACCESS_TOKEN = (
    os.getenv('ROLLBAR_ACCESS_TOKEN', None) if IS_PRODUCTION and not IS_TEST else None
)
ENABLE_ROLLBAR = ROLLBAR_ACCESS_TOKEN is not None
