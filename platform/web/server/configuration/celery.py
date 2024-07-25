# Celery configurations
from os import getenv

DEFAULT_BROKER_URL = 'redis://redis:6379/'


def get_broker_url():
    redis_host = getenv('REDIS_HOST')
    if redis_host:
        broker_url = f'redis://{redis_host}:6379/'
        return broker_url
    return getenv('BROKER_URL', DEFAULT_BROKER_URL)


class CeleryConfig:
    result_backend = get_broker_url()
    broker_url = get_broker_url()
    accept_content = ['application/json']
    task_serializer = 'json'
    result_serializer = 'json'
    MAILGUN_URL = 'https://api.mailgun.net/v3/{0}/messages'
    TASKS_LIST = ['web.server.tasks.notifications']
    CELERY_ENABLE_UTC = True
    task_track_started = True
