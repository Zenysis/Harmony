#!/usr/bin/env python

import sys

from log import LOG
from db.postgres.cur_datasource import get_cur_datasource_from_db, LATEST_DATASOURCE
from pylib.base.flags import Flags


def current_datasource(deployment: str):
    cur_datasource = get_cur_datasource_from_db(deployment)
    if not cur_datasource:
        cur_datasource = LATEST_DATASOURCE
    LOG.info(f'Current Datasource for {deployment}: {cur_datasource}')


def main():
    Flags.PARSER.add_argument(
        '-d',
        '--deployment',
        type=str,
        required=True,
        help='Deployment to lookup for the pinned datasource',
    )
    Flags.InitArgs()

    current_datasource(Flags.ARGS.deployment)


if __name__ == '__main__':
    sys.exit(main())
