#!/usr/bin/env python
# Create a default admin account for a deployment in the dev database.
import os
import subprocess
import sys

from pylib.base.flags import Flags
from pylib.file.file_utils import FileUtils


def main():
    Flags.PARSER.add_argument(
        'db_name',
        type=str,
        help='The dev database name to add a default admin user for.',
    )
    Flags.InitArgs()

    first_name = 'Software'
    last_name = 'Developer'
    email = 'demo@zenysis.com'

    postgres_host = os.environ.get('POSTGRES_HOST', 'localhost')
    args = [
        '-d',
        f'postgresql://postgres:@{postgres_host}/{Flags.ARGS.db_name}',
        '-p',
        'zenysis',
        '-a',
        '-u',
        email,
        '-f',
        first_name,
    ]
    if last_name:
        args.extend(['-l', last_name])

    result = subprocess.run(
        ['scripts/create_user.py', *args],
        check=False,
        cwd=FileUtils.GetSrcRoot(),
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
        text=True,
    )

    if result.returncode != 0:
        print('Error creating user')
        print(result.stdout)
        return 1

    print(f'Default user created. Username: {email} Password: zenysis')
    return 0


if __name__ == '__main__':
    sys.exit(main())
