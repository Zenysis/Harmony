import traceback

from celery.signals import task_failure, task_internal_error
from log import LOG

from web.server.workers import create_celery

celery = create_celery()


@task_failure.connect
def handle_task_failure(**kwargs):
    task = kwargs.get('sender')
    error = traceback.format_exc()
    LOG.info(f'Task {task} failed with error: {error}')


@task_internal_error.connect
def handle_task_internal_error(**kwargs):
    task = kwargs.get('sender')
    error = traceback.format_exc()
    LOG.info(f'Task {task} failed with error: {error}')
