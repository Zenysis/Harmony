# Celery configurations
from os import getenv

DEFAULT_BROKER_URL = 'redis://redis:6379'


def get_broker_url():
    redis_host = getenv('REDIS_HOST')
    if redis_host:
        broker_url = f'redis://{redis_host}:6379'
        return broker_url
    return getenv('BROKER_URL', DEFAULT_BROKER_URL)


class CeleryConfig:
    CELERY_RESULT_BACKEND = get_broker_url()
    BROKER_URL = get_broker_url()
    CELERY_ACCEPT_CONTENT = ['application/json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    MAILGUN_URL = 'https://api.mailgun.net/v3/{0}/messages'
    TASKS_LIST = ['web.server.tasks.notifications']
    CELERY_ENABLE_UTC = True
    CELERY_TRACK_STARTED = True
