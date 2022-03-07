#!/usr/bin/env python
import sys
from pylib.base.flags import Flags

from scripts.cli_util.commands import Command
from scripts.data_catalog.cli.compare_data_catalog import (
    compare_data_catalog,
)
from scripts.data_catalog.cli.populate_datasources import (
    populate_datasources,
)
from scripts.data_catalog.cli.transfer_data_catalog import (
    transfer_data_catalog,
)


def main():
    '''A CLI to execute common data catalog operations.'''
    Flags.PARSER.add_argument(
        '--from_deployment',
        type=str,
        required=False,
        help='The deployment name to export. This must be a valid web role name.',
    )

    Flags.PARSER.add_argument(
        '--to_deployment',
        type=str,
        required=False,
        help='The deployment name to target. This must be a valid web role name.',
    )

    Flags.PARSER.add_argument(
        '--to_local',
        action='store_true',
        default=False,
        help='Whether or not to tranfer data-catalog to local server',
    )

    Flags.PARSER.add_argument(
        '--disable_migration_check',
        action='store_true',
        default=False,
        help='Disable migration check for the source database and target'
        'database to be on the same migration',
    )

    Flags.PARSER.add_argument(
        '--staging_deployment',
        type=str,
        required=False,
        help='The staging deployment name to compare. This must be a valid web role name.',
    )

    Flags.PARSER.add_argument(
        '--prod_deployment',
        type=str,
        required=False,
        help='The prod deployment name to compare. This must be a valid web role name.',
    )

    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help='The deployment name. This must be a valid web role name.',
    )

    Flags.PARSER.add_argument(
        '--mapping',
        nargs='*',
        type=str,
        required=False,
        help='List of field to source mappings to use. Colon separated, the pattern '
        'is: field_id:source_id. Will supplement the mapping from druid.',
    )

    Command.register_command(
        name='transfer',
        description="Transfer deployment data-catalog from one deployment to another",
        func=transfer_data_catalog,
        params=[
            Command.ParamCombination(
                required_params=('--from_deployment', '--to_deployment'),
                optional_params=('--disable_migration_check',),
                description='Transfer data catalog from one deployment to another',
            ),
            Command.ParamCombination(
                required_params=('--from_deployment', '--to_local'),
                optional_params=('--disable_migration_check',),
                description='Transfer data catalog from one deployment to your local server',
            ),
        ],
    )

    Command.register_command(
        name='compare',
        description='Compare data-catalog set up between prod and staging',
        func=compare_data_catalog,
        params=[
            Command.ParamCombination(
                required_params=('--staging_deployment', '--prod_deployment'),
            ),
        ],
    )

    Command.register_command(
        name='populate_datasources',
        description='Clears the datasource and datasource mapping tables and repopulates '
        'them with values from druid',
        func=populate_datasources,
        params=[
            Command.ParamCombination(
                required_params='--deployment_name',
                optional_params='--mapping',
                description='Runs the script on the deployment specified.',
            ),
            Command.ParamCombination(
                optional_params='--mapping',
                description='Runs the script locally. ZEN_ENV must be set.',
            ),
        ],
    )

    Command.initialize_commands()
    Command.run(Flags.ARGS.command)


if __name__ == '__main__':
    sys.exit(main())
