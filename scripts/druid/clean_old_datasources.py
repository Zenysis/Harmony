#!/usr/bin/env python
'''
Disable outdated datasources for given deployments. Keep n deployments specified by
`--amount_to_keep` and pinned datasources.
'''
import os
import sys

from pylib.base.flags import Flags

from db.druid.clean_old_datasources import disable_datasources
from db.postgres.cur_datasource import get_cur_datasource_from_db


def main():
    Flags.PARSER.add_argument(
        '--amount_to_keep',
        type=int,
        default=2,
        help='Amount of datasources from a deployment' 'to keep',
    )
    Flags.PARSER.add_argument(
        '--force',
        action='store_true',
        help='Force disable datasources. This should'
        'only be used for automatic disabling.',
    )
    Flags.InitArgs()
    envs = set()
    cur_datasources = []
    env = os.getenv('ZEN_ENV')
    if not env:
        Flags.PARSER.error('ZEN_ENV must be set')
    envs.add(env)

    disable_datasources(
        ';'.join(envs), Flags.ARGS.amount_to_keep, Flags.ARGS.force, cur_datasources
    )


if __name__ == '__main__':
    sys.exit(main())
