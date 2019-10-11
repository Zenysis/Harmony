#!/usr/bin/env python
# Simple script for fetching the current status of an indexing task from
# druid. Optionally supports polling druid and blocking until the specified
# task is no longer in the RUNNING state.
from builtins import str
from past.utils import old_div
import sys
import time

import requests

from enum import Enum
from pylib.base.flags import Flags

from db.druid.config import DruidConfig
from log import LOG

BASE_URL = '%s/druid/indexer/v1/task' % DruidConfig.indexing_endpoint()

# Number of seconds to sleep between task status checks
POLL_INTERVAL = 10

# Maximum time in seconds we can poll for task completion
POLL_TIMEOUT = 4 * 60 * 60

# Maximum number of connection errors to allow without failing.
MAX_CONNECTION_ERRORS = 5

# Mapping from task status name to exit code
class TaskStatus(Enum):
    SUCCESS = 0
    FAILED = 1
    RUNNING = 2
    POLL_TIMEOUT = 3
    CONNECTION_ERROR = 4


# Fetch and return the current status of the given task
def fetch_status(task_id):
    status_url = '%s/%s/status' % (BASE_URL, task_id)
    try:
        r = requests.get(status_url)
    except requests.exceptions.ConnectionError as e:
        LOG.error(e.message)
        return TaskStatus.CONNECTION_ERROR

    if not r.ok:
        LOG.error('Failed to retrieve task status. URL: %s', status_url)
        LOG.error(str(r))
        return TaskStatus.CONNECTION_ERROR

    # TODO(stephen): The final `status` property is deprecated and should be
    # replaced with statusCode. Need to handle both druid 0.12 and 0.14 running
    # simultaneously since Docker is not updated with the latest version.
    status_dict = r.json()['status']
    status_str = status_dict.get('statusCode', status_dict.get('status'))
    return TaskStatus[status_str]  # pylint: disable=unsubscriptable-object


def main():
    Flags.PARSER.add_argument(
        '--task_id', type=str, required=True, help='The indexing task ID to lookup'
    )
    Flags.PARSER.add_argument(
        '--block_until_completed',
        action='store_true',
        default=False,
        help='Poll druid and exit this script only when ' 'a task is no longer running',
    )
    Flags.InitArgs()

    block_until_completed = Flags.ARGS.block_until_completed
    task_id = Flags.ARGS.task_id
    LOG.info('Fetching status for task ID: %s', task_id)

    elapsed_time = 0
    connection_failure_count = 0
    while True:
        if elapsed_time >= POLL_TIMEOUT:
            status = TaskStatus.POLL_TIMEOUT
            break

        if connection_failure_count >= MAX_CONNECTION_ERRORS:
            status = TaskStatus.MAX_CONNECTION_ERRORS
            break

        status = fetch_status(task_id)

        if status == TaskStatus.CONNECTION_ERROR:
            connection_failure_count += 1
        elif status != TaskStatus.RUNNING or not block_until_completed:
            break

        # Poll until the task is no longer in the RUNNING state
        elapsed_time += POLL_INTERVAL
        time.sleep(POLL_INTERVAL)

        # Report our status every 5 minutes
        if (elapsed_time % 60) == 0:
            LOG.info(
                'Task is still running. Elapsed time (minutes): %s',
                (old_div(elapsed_time, 60)),
            )

    # Return exit code stored for this task status
    LOG.info('Task status: %s', status.name)
    return status.value


if __name__ == '__main__':
    sys.exit(main())
