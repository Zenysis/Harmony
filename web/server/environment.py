from os import getenv

# Environmental flags.
IS_PRODUCTION = getenv('ZEN_PROD', False)

IS_TEST = getenv('ZEN_TEST', False)

OFFLINE_MODE = getenv('ZEN_OFFLINE', False)

SEND_EMAILS = getenv('SEND_EMAILS', False)

BUILD_TAG = getenv('BUILD_TAG', 'unknown')
