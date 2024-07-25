#!/usr/bin/env python
import sys

from db.postgres.utils import psycopg_connection
from pylib.base.flags import Flags

from log import LOG

SQL = '''
-- create pgcrypto extension, required for UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- create the schemas required by the hasura system
CREATE SCHEMA IF NOT EXISTS hdb_catalog;
CREATE SCHEMA IF NOT EXISTS hdb_views;

-- grant the user privilleges on system schemas
GRANT ALL PRIVILEGES ON SCHEMA hdb_catalog TO "{db_user}";
GRANT ALL PRIVILEGES ON SCHEMA hdb_views TO "{db_user}";
ALTER SCHEMA hdb_catalog OWNER TO "{db_user}";
ALTER SCHEMA hdb_views OWNER TO "{db_user}";
GRANT ALL ON ALL TABLES IN SCHEMA hdb_catalog TO "{db_user}";
'''


def main():
    Flags.PARSER.add_argument('--dbname', type=str, required=True, help='database name')
    Flags.PARSER.add_argument('--dbhost', type=str, required=True, help='database host')
    Flags.PARSER.add_argument(
        '--superuser', type=str, required=True, help='database superuser username'
    )
    Flags.PARSER.add_argument(
        '--superuser_password',
        type=str,
        required=True,
        help='database superuser password',
    )
    Flags.PARSER.add_argument('--dbuser', type=str, required=True, help='database user')
    Flags.InitArgs()

    with psycopg_connection(
        host=Flags.ARGS.dbhost,
        database=Flags.ARGS.dbname,
        port='5432',
        user=Flags.ARGS.superuser,
        password=Flags.ARGS.superuser_password,
    ) as conn:

        LOG.info('Adding hasura db requirements')

        sql_command = SQL.format(db_user=Flags.ARGS.dbuser)
        q = conn.cursor().mogrify(sql_command)
        conn.cursor().execute(q)
        conn.commit()

        LOG.info('Done!')


if __name__ == '__main__':
    sys.exit(main())
