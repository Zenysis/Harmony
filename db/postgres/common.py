import subprocess
from os import getenv

from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm.session import sessionmaker

from config import VALID_MODULES
from util.flask import build_flask_config
from util.file.unicode_csv import UnicodeDictReader

POSTGRES_PROTOCOL_STR = 'postgresql://'

DEPLOYMENT_CODES = set(VALID_MODULES)


def get_db_uri(deployment_name: str) -> str:
    '''Gets DB connection string from environment variables.'''
    return getenv('DATABASE_URL', '')


def get_local_db_uri(db_or_deployment_code: str) -> str:
    '''Get the DB connection string from a database name or a deployment code (as
    defined in our `config/` directory
    '''
    database_url = getenv('SQLALCHEMY_DATABASE_URI')
    if database_url is not None:
        return database_url

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
    db_uri = db_uri_or_deployment_name

    url = make_url(db_uri)
    assert url.drivername.startswith('postgre')
    return {
        'username': url.username,
        'password': url.password,
        'hostname': url.host,
        'db_name': url.database,
    }


def get_session(database_uri: str):
    '''Gets a session based on `database_uri`. If it cannot be connected to,
    return `None`.
    '''
    engine = create_engine(
        database_uri,
        connect_args={
            # NOTE: For debugging purposes this is logged in postgres's pg_stat_activity
            'application_name': 'db.postgres.common'
        },
    )

    # pylint: disable=C0103
    Session = sessionmaker(bind=engine)
    return Session()


def get_db_session(deployment_name: str = '', deployment_code: str = ''):
    '''Gets Postgres DB session. If a `deployment_name` is passed, lookup the URI. If
    a `deployment_code` is passed, use the local DB or DB from instance_config on prod.
    If nothing is passed for either, we default to local DB environment var.
    '''
    if deployment_code:
        flask_config = build_flask_config(deployment_code)
        db_uri = flask_config.SQLALCHEMY_DATABASE_URI or get_local_db_uri(
            deployment_code
        )
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
