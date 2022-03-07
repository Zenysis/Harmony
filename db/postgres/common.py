import subprocess
from os import getenv
from typing import Dict

from sqlalchemy import create_engine
from sqlalchemy.orm.session import sessionmaker

import global_config

from util.file.unicode_csv import UnicodeDictReader
from config import VALID_MODULES

POSTGRES_PROTOCOL_STR = 'postgresql://'

DEPLOYMENT_CODES = set(VALID_MODULES)

DEPLOYMENT_CREDENTIAL_CACHE: Dict[str, str] = {}


def get_db_uri(deployment_name: str) -> str:
    '''Gets DB connection string from fabfile.'''
    return global_config.POSTGRES_DB_URI


def get_local_db_uri(db_or_deployment_code: str) -> str:
    '''Get the DB connection string from a database name or a deployment code (as
    defined in our `config/` directory
    '''
    db_name = db_or_deployment_code
    if db_or_deployment_code in DEPLOYMENT_CODES:
        db_name = f'{db_or_deployment_code}-local'
    return f'postgresql://postgres:@localhost/{db_name}'


def get_db_connection_config(db_uri_or_deployment_name):
    '''Get a dict of DB connection info from a postgres credential URI that
    includes username, password, hostname, and db-name. For example,
    using `get_db_uri` will return a valid string.

    Args:
        db_uri_or_deployment_name (str): There are two possible strings that can be
            passed here:
            1. A postgres db URI with credentials. For example the kind of string
                you'd get from `get_db_uri`. The string must be of the format:
                    'postgresql://username:password@hostname/db-name'
            2. Or, a deployment name, from which we will call:
                `get_db_uri(deployment_name)`
                to get the db credentials
    Returns:
        dict of `str`: including `username`, `password`, `hostname`, and `db_name`
    '''
    db_uri = None
    db_uri = db_uri_or_deployment_name

    db_name_delimiter = db_uri.rfind('/')
    db_name = db_uri[db_name_delimiter + 1 :]
    db_hostname_delimiter = db_uri.rfind('@')
    db_hostname = db_uri[db_hostname_delimiter + 1 : db_name_delimiter]
    username_password_str = db_uri[len(POSTGRES_PROTOCOL_STR) : db_hostname_delimiter]
    password_delimiter = username_password_str.find(':')
    db_username = username_password_str[:password_delimiter]
    password = username_password_str[password_delimiter + 1 :]
    return {
        'username': db_username,
        'password': password,
        'hostname': db_hostname,
        'db_name': db_name,
    }


def get_session(database_uri: str):
    '''Gets a session based on `database_uri`. If it cannot be connected to,
    return `None`.
    '''
    engine = create_engine(
        database_uri,
        connect_args={
            # NOTE(solo): For debugging purposes this is logged in postgres's pg_stat_activity
            'application_name': 'db.postgres.common'
        },
    )

    # pylint: disable=C0103
    Session = sessionmaker(bind=engine)
    return Session()


def get_db_session(deployment_name: str = '', deployment_code: str = ''):
    '''Gets Postgres DB session. If a `deployment_name` is passed, lookup the URI. If
    a `deployment_code` is passed, use the local DB. If nothing is passed for either, we
    default to local DB environment var.
    '''
    if deployment_name:
        db_uri = get_db_uri(deployment_name)
    elif deployment_code:
        db_uri = get_local_db_uri(deployment_code)
    else:
        db_uri = getenv('DATABASE_URL', '')
    return get_session(db_uri)


def run_psql_query(query: str, deployment: str, run_local: bool = False):
    '''Run a postgres query against a deployment's Postgres DB, and return a CSV
    reader with all results. If no deployment name is provided, this query
    will run against the local server.

    Args:
        query (str): the postgres query to run
        deployment (str): the deployment to query. If we're
            running a remote query, the deployment name must be a valid web role.
            If we are running locally, then the deployment name must be a valid
            valid deployment code from our config/ directory.
        run_local (bool, optional): whether or not to run this query locally

    Returns:
        UnicodeDictReader
        A csv reader so you can iterate through the psql results
        using. Example:
            ```
            csv = _run_psql_query('zen', 'select * from case_type')
            for row in csv:
            ```
    '''
    if run_local:
        db_config = get_db_connection_config(get_local_db_uri(deployment))
    else:
        db_config = get_db_connection_config(deployment)

    password = db_config['password']
    db_username = db_config['username']
    db_hostname = db_config['hostname']
    db_name = db_config['db_name']

    psql_cmd = f'\
        PGPASSWORD=\'{password}\' psql -h {db_hostname} -U {db_username} -p 5432 {db_name}\
        -c "COPY ({query}) TO STDOUT WITH CSV HEADER"'

    # pylint: disable=unexpected-keyword-arg
    csv_str = subprocess.check_output(psql_cmd, shell=True, text=True)
    return UnicodeDictReader(csv_str.split('\n'), delimiter=',')
