#!/usr/bin/env python

import sys

from db.druid.clean_old_datasources import disable_datasources
from db.postgres.cur_datasource import get_cur_datasource_from_db
from log import LOG
from pylib.base.flags import Flags


def current_datasource(
    datasources_to_disable: str,
    amount_to_keep: int,
    force: bool,
    deployments: str,
):
    cur_datasources = []
    for deployment in deployments.split(';'):
        if not deployment:
            continue
        pinned_datasource = get_cur_datasource_from_db(deployment)
        if not pinned_datasource:
            continue
        cur_datasources.append(pinned_datasource)
    LOG.info(f'Current datasources for {deployments}: {cur_datasources}')
    disable_datasources(datasources_to_disable, amount_to_keep, force, cur_datasources)


def main():
    Flags.PARSER.add_argument(
        '-ds', '--datasources', type=str, required=True, help='Datasources to disable.'
    )
    Flags.PARSER.add_argument(
        '-k',
        '--keep',
        type=int,
        required=False,
        default=2,
        help='Amount of datasources to keep',
    )
    Flags.PARSER.add_argument(
        '-f',
        '--force',
        type=bool,
        required=False,
        default=False,
        help='Force disasble datasources',
    )
    Flags.PARSER.add_argument(
        '-d',
        '--deployments',
        type=str,
        required=False,
        default='',
        help='Deployments to lookup for pinned datasources',
    )
    Flags.InitArgs()

    current_datasource(
        datasources_to_disable=Flags.ARGS.datasources,
        amount_to_keep=Flags.ARGS.keep,
        force=Flags.ARGS.force,
        deployments=Flags.ARGS.deployments,
    )


if __name__ == '__main__':
    sys.exit(main())
