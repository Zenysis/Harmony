import traceback
from celery.signals import task_failure, task_internal_error
# from util.slack import notify_slack

from web.server.workers import create_celery

celery = create_celery()


@task_failure.connect
def handle_task_failure(**kwargs):
    task = kwargs.get('sender')
    error = traceback.format_exc()
    # notify_slack(f'Task {task.name} failed with error: {error}')


@task_internal_error.connect
def handle_task_internal_error(**kwargs):
    task = kwargs.get('sender')
    error = traceback.format_exc()
    # notify_slack(f'Task {task} failed with error: {error}')
