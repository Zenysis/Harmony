# Celery configurations

from builtins import object
from os import getenv

DEFAULT_BROKER_URL = 'redis://localhost:6379'


class CeleryConfig(object):
    CELERY_RESULT_BACKEND = 'rpc://'
    BROKER_URL = getenv('BROKER_URL', DEFAULT_BROKER_URL)
    CELERY_ACCEPT_CONTENT = ['application/json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    MAILGUN_URL = 'https://api.mailgun.net/v3/{0}/messages'
    TASKS_LIST = ['web.server.tasks.notifications']
