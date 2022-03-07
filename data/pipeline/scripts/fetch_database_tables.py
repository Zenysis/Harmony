#!/usr/bin/env python
# pylint: disable=C0413
import subprocess
import sys

from pylib.base.flags import Flags

from db.postgres.common import get_db_uri, get_local_db_uri


def main():
    '''Use --deployment_code to pull from a local db or --deployment_name to
    pull from a production database.
    '''
    Flags.PARSER.add_argument(
        '--deployment_code',
        type=str,
        required=False,
        help=('Deployment code for local db.'),
    )
    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help=('Name of the deployment database to pull tables from.'),
    )
    Flags.PARSER.add_argument(
        '--csv_path',
        type=str,
        required=True,
        help=(
            'DB connection string. If not provided,' '--deployment_name will be used'
        ),
    )
    Flags.PARSER.add_argument(
        '--table_name',
        type=str,
        required=True,
        help=('Name of the table that you want '),
    )
    Flags.InitArgs()

    db_uri = (
        get_local_db_uri(Flags.ARGS.deployment_code)
        if Flags.ARGS.deployment_code
        else get_db_uri(Flags.ARGS.deployment_name)
    )
    connection = ["psql", db_uri, "--port=5432", "-a", "-w", "-c"]

    # We are rewriting the tables that are created for location matching from the csv files
    # passed in. Because of primary key constriants if we don't remove all of the rows from
    # the tables being copied then the copy will fail.
    table_name = Flags.ARGS.table_name
    copy_command = "\copy %s to %s csv header;" % (
        table_name,
        '%s/%s.csv' % (Flags.ARGS.csv_path, table_name),
    )

    copy_result = subprocess.check_call(connection + [copy_command])
    print(copy_result)


if __name__ == '__main__':
    sys.exit(main())
