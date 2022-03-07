import os
import rollbar
from celery.signals import task_failure

from web.server.environment import IS_PRODUCTION, IS_TEST
from web.server.workers import create_celery

celery = create_celery()


@task_failure.connect
def handle_task_failure(**kwargs):
    task = kwargs.get('sender')
    if IS_PRODUCTION and not IS_TEST:
        rollbar.init(
            '857fa045f2e34f8d823c14aea53429a3', 'production(worker service task failed)'
        )
        extra_data = {
            'deployment_name': os.getenv('ZEN_ENV', ''),
            'service': 'worker',
            'background_task': task.name,
        }
        rollbar.report_exc_info(extra_data=extra_data)
