#!/usr/bin/env python
import os
import sys
from pylib.base.flags import Flags

from db.postgres.common import get_db_uri, get_db_connection_config

POSTGRES_PROTOCOL_STR = 'postgresql://'


def main():
    '''Connect directly via psql to a postgres db that we have a passphrase
    account for. General usage as follows:

    ./scripts/db/postgres/dev/connect.py gates-malaria-web-staging

    '''
    Flags.PARSER.add_argument(
        'deployment_name',
        type=str,
        help=(
            'Name of the deployment db to connect to. Expects a web role name '
            'i.e. bd-staging'
        ),
    )
    Flags.InitArgs()

    db_uri = get_db_uri(Flags.ARGS.deployment_name)
    db_config = get_db_connection_config(db_uri)

    password = db_config['password']
    db_username = db_config['username']
    db_hostname = db_config['hostname']
    db_name = db_config['db_name']

    psql_str = f"PGPASSWORD='{password}' psql -h {db_hostname} -U {db_username} -p 5432 {db_name}"
    os.system(psql_str)


if __name__ == '__main__':
    sys.exit(main())
