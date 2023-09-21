#!/usr/bin/env python
# pylint: disable=C0413
import subprocess
import sys

from pylib.base.flags import Flags

from db.postgres.common import get_db_uri, get_local_db_uri


def fetch_table(
    db_uri: str, table_name: str, output_folder: str, lz4_zip: bool = False
):
    connection = ["psql", db_uri, "--port=5432", "-a", "-w", "-c"]
    output_file_name = f'{output_folder}/{table_name}.csv'

    if lz4_zip:
        output_file_name += '.lz4'
        copy_command = (
            # pylint: disable=anomalous-backslash-in-string
            f"\copy {table_name} to PROGRAM 'lz4 > {output_file_name}' csv header;"
        )
    else:
        # pylint: disable=anomalous-backslash-in-string
        copy_command = f'\copy {table_name} to {output_file_name} csv header;'

    copy_result = subprocess.check_call(connection + [copy_command])
    return copy_result


def main():
    '''Use --deployment_code to pull from a local db or --deployment_name to
    pull from a production database.
    '''
    Flags.PARSER.add_argument(
        '--deployment_code',
        type=str,
        required=False,
        help='Deployment code for local db.',
    )
    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help='Name of the deployment database to pull tables from.',
    )
    Flags.PARSER.add_argument(
        '--output_folder',
        type=str,
        required=True,
        help=(
            'The output folder where the files will be written. The files '
            'will be named with the table name.'
        ),
    )
    Flags.PARSER.add_argument(
        '--table_name',
        type=str,
        required=True,
        help='Name of the table that you want.',
    )
    Flags.PARSER.add_argument(
        '--lz4_zip',
        action='store_true',
        default=False,
        help='Whether the output should be lz4 zipped.',
    )
    Flags.InitArgs()

    db_uri = (
        get_local_db_uri(Flags.ARGS.deployment_code)
        if Flags.ARGS.deployment_code
        else get_db_uri(Flags.ARGS.deployment_name)
    )

    copy_result = fetch_table(
        db_uri, Flags.ARGS.table_name, Flags.ARGS.output_folder, Flags.ARGS.lz4_zip
    )
    print(copy_result)


if __name__ == '__main__':
    sys.exit(main())
