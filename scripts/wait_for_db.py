#!/usr/bin/env python
# Utility script to wait for DB to come online during testing.
import sys

from time import sleep

from sqlalchemy import create_engine

from util.credentials.provider import CredentialProvider
from web.server.configuration.instance import load_instance_configuration_from_file

# Wait up to 3 minutes before deciding the DB is unconnectable.
TIMEOUT = 3 * 60


def _connect_db(engine):
    try:
        c = engine.connect()
        c.close()
    except Exception as e:  # pylint: disable=broad-except
        return e
    return None


def wait_for_db(engine, interval=1):
    total_time = 0
    while total_time < TIMEOUT:
        result = _connect_db(engine)
        if result is None:
            print(f'*** DB connection successful after {total_time} seconds')
            return True

        # Only print messages every 10 seconds.
        if total_time % 10 == 0:
            print(f'*** DB still not available. Elapsed time: {total_time} seconds')
            print(f'Latest message:\n{result}')

        total_time += interval
        sleep(interval)

    print('*** Unable to connect to DB before timeout.')
    raise result


def load_db_uri():
    instance_configuration = load_instance_configuration_from_file()
    with CredentialProvider(instance_configuration) as credential_provider:
        return credential_provider.get('SQLALCHEMY_DATABASE_URI')


def main():
    db_uri = load_db_uri()
    engine = create_engine(db_uri)
    wait_for_db(engine)
    return 0


if __name__ == '__main__':
    sys.exit(main())
