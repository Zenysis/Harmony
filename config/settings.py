import os

from log import LOG
from web.server.environment import IS_PRODUCTION, IS_TEST


def getenv(name, default=None):
    '''It's better to know what has been configured and what hasn't!'''
    result = os.environ.get(name, default)
    if result is None or result == '':
        LOG.warning('Environment variable %s not set', name)
    return result


# Flask
DEFAULT_SECRET_KEY = os.environ['DEFAULT_SECRET_KEY']

# Other
NOREPLY_EMAIL = getenv('NOREPLY_EMAIL', None)
SUPPORT_EMAIL = getenv('SUPPORT_EMAIL', None)

REDIS_HOST = getenv('REDIS_HOST', '')  # Redis isn't a hard requirement
HASURA_HOST = os.environ['HASURA_HOST']

DRUID_HOST = os.environ['DRUID_HOST']

RENDERBOT_EMAIL = getenv('RENDERBOT_EMAIL', None)
URLBOX_API_KEY = getenv('URLBOX_API_KEY', None)
