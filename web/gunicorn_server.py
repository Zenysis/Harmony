#!/usr/bin/env python
import argparse
import os
import sys

from google.cloud import logging as google_cloud_logging
from google.cloud.logging.handlers import CloudLoggingHandler
from gunicorn.app.base import BaseApplication
from multiprocessing import cpu_count
from pylib.file.file_utils import FileUtils

from log.log import LOG
from web.server.app import create_app
from web.server.environment import IS_TEST

# HACK(stephen): Add the gunicorn environment variable so that the existing
# zen_app initialization code still runs. Figure out a better method soon.
os.environ['SERVER_SOFTWARE'] = 'gunicorn'

WORKER_COUNT_ENV_VAR = 'ZEN_GUNICORN_WORKER_THREADS'
WORKER_TIMEOUT_ENV_VAR = 'ZEN_GUNICORN_WORKER_TIMEOUT'
LISTEN_ADDRESS_ENV_VAR = 'ZEN_GUNICORN_LISTEN_ADDRESS'
LISTEN_PORT_ENV_VAR = 'ZEN_GUNICORN_LISTEN_PORT'

DEFAULT_LISTEN_ADDRESS = '0.0.0.0'
DEFAULT_LISTEN_PORT = 5000
DEFAULT_WORKER_THREAD_COUNT = cpu_count() * 4
DEFAULT_WORKER_TIMEOUT = 30


class GunicornApplication(BaseApplication):
    '''
    Simple gunicorn application customization wrapper based on:
    http://docs.gunicorn.org/en/stable/custom.html
    '''

    def __init__(self, app, options=None):
        self.options = options or {}
        self.app = app
        super(GunicornApplication, self).__init__()

    def load_config(self):
        '''
        Add customized instance options to the gunicorn config.
        '''
        for key, value in list(self.options.items()):
            if key in self.cfg.settings and value:
                self.cfg.set(key.lower(), value)

    def load(self):
        return self.app


def main():
    parser = argparse.ArgumentParser(
        description='The production hosting environment for the Zenysis Application.'
    )
    parser.add_argument(
        '-l',
        '--listen_address',
        type=str,
        required=False,
        help=(
            (
                'The IP Address that the server will listen on. '
                'A value of \'0.0.0.0\' indicates that the server '
                'will listen on all available interfaces. Can also '
                'be specified via the \'%s\' environment variable. '
                'The inline parameter takes priority. '
            )
            % (LISTEN_ADDRESS_ENV_VAR)
        ),
    )
    parser.add_argument(
        '-p',
        '--listen_port',
        type=str,
        required=False,
        help=(
            (
                'The port that the server will listen on. Can also '
                'be specified via the \'%s\' environment variable. '
                'The inline parameter takes priority. '
            )
            % (LISTEN_PORT_ENV_VAR)
        ),
    )
    parser.add_argument(
        '-w',
        '--workers',
        type=str,
        required=False,
        help=(
            (
                'The number of Gunicorn worker threads that the server will start. '
                'By default, this is the number of available CPUs * 4. '
                'Can also be specified via the \'%s\' environment variable. '
                'The inline parameter takes priority. '
            )
            % (WORKER_COUNT_ENV_VAR)
        ),
    )
    parser.add_argument(
        '-t',
        '--timeout',
        type=str,
        required=False,
        default=DEFAULT_WORKER_TIMEOUT,
        help='The maximum time a worker thread can be silent '
        'for before Gunicorn kills the thread. Can also '
        'be specified via the \'%s\' environment '
        'variable. The inline parameter takes priority.' % WORKER_TIMEOUT_ENV_VAR,
    )
    arguments = parser.parse_args()
    worker_count = arguments.workers
    worker_timeout = int(arguments.timeout)
    listen_port = arguments.listen_port

    listen_address = (
        arguments.listen_address
        or os.getenv(LISTEN_ADDRESS_ENV_VAR)
        or DEFAULT_LISTEN_ADDRESS
    )
    listen_port = (
        int(listen_port if listen_port else 0)
        or int(os.getenv(LISTEN_PORT_ENV_VAR, 0))
        or int(DEFAULT_LISTEN_PORT)
    )

    worker_count = (
        int(worker_count if worker_count else 0)
        or int(os.getenv(WORKER_COUNT_ENV_VAR, 0))
        or DEFAULT_WORKER_THREAD_COUNT
    )

    worker_timeout_env = os.getenv(WORKER_COUNT_ENV_VAR)
    if worker_timeout_env:
        worker_timeout = int(worker_timeout_env)

    if listen_port < 1 or listen_port > 65535:
        raise ValueError('\'listen_port\' must be between 1 and 65535.')

    if worker_count < 1:
        raise ValueError('\'worker_count\' must be greater than or equal to 1.')

    def setup_post_fork_logging(server, worker):
        # After the gunicorn fork, recreate the Google Cloud Logging clients.
        # There is an issue with the clients where they do not log after a
        # process fork.
        if not IS_TEST:
            setup_stackdriver_logger(LOG)

    options = {
        'bind': '%s:%s' % (listen_address, listen_port),
        'workers': worker_count,
        'timeout': worker_timeout,
        # FIXME(ian): Post fork logging temporarily disabled due to thread
        # safety issues identified in KE instance.
        # 'post_fork': setup_post_fork_logging,
        'reload': True,
    }

    flask_application = create_app()

    GunicornApplication(flask_application, options).run()


if __name__ == '__main__':
    sys.exit(main())
