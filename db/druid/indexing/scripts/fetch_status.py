#!/usr/bin/env python
# Simple script for fetching the current status of an indexing task from
# druid. Optionally supports polling druid and blocking until the specified
# task is no longer in the RUNNING state.
import sys
import time
from builtins import str
from enum import Enum

from pylib.base.flags import Flags
import requests

from db.druid.config import DruidConfig
from log import LOG
from util.druid import get_druid_request_params

BASE_URL = f'{DruidConfig.indexing_endpoint()}/druid/indexer/v1/task'

# Number of seconds to sleep between task status checks
POLL_INTERVAL = 10

# Default maximum time in seconds we can poll for task completion
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
    status_url = f'{BASE_URL}/{task_id}/status'
    try:
        r = requests.get(status_url, **get_druid_request_params(DruidConfig))
    except requests.exceptions.ConnectionError as e:
        LOG.error(e.message)
        return TaskStatus.CONNECTION_ERROR

    if not r.ok:
        LOG.error('Failed to retrieve task status. URL: %s', status_url)
        LOG.error(str(r))
        return TaskStatus.CONNECTION_ERROR

    status_str = r.json()['status']['statusCode']
    return TaskStatus[status_str]  # pylint: disable=unsubscriptable-object


def main():
    Flags.PARSER.add_argument(
        '--task_id', type=str, required=True, help='The indexing task ID to lookup'
    )
    Flags.PARSER.add_argument(
        '--block_until_completed',
        action='store_true',
        default=False,
        help='Poll druid and exit this script only when a task is no longer running',
    )
    Flags.PARSER.add_argument(
        '--max_timeout_seconds',
        type=int,
        required=False,
        default=POLL_TIMEOUT,
        help='The max time in seconds before this script times out',
    )
    Flags.InitArgs()

    block_until_completed = Flags.ARGS.block_until_completed
    task_id = Flags.ARGS.task_id
    max_timeout = Flags.ARGS.max_timeout_seconds
    LOG.info('Fetching status for task ID: %s', task_id)

    elapsed_time = 0
    connection_failure_count = 0
    while True:
        if elapsed_time >= max_timeout:
            status = TaskStatus.POLL_TIMEOUT
            break

        if connection_failure_count >= MAX_CONNECTION_ERRORS:
            status = TaskStatus.CONNECTION_ERROR
            break

        status = fetch_status(task_id)

        if status == TaskStatus.CONNECTION_ERROR:
            connection_failure_count += 1
        elif status != TaskStatus.RUNNING or not block_until_completed:
            break

        # Poll until the task is no longer in the RUNNING state
        elapsed_time += POLL_INTERVAL
        time.sleep(POLL_INTERVAL)

        # Report our status every 5 minutes (300 seconds)
        if (elapsed_time % 300) == 0:
            LOG.info(
                'Task is still running. Elapsed time (minutes): %s',
                (elapsed_time // 60),
            )

    # Return exit code stored for this task status
    LOG.info('Task status: %s', status.name)
    return status.value


if __name__ == '__main__':
    sys.exit(main())
