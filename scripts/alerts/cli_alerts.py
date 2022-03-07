#!/usr/bin/env python
import sys
from pylib.base.flags import Flags

from scripts.cli_util.commands import Command
from scripts.alerts.list_alerts import list_alerts


def main():
    '''A CLI to execute common dashboard operations.'''
    Flags.PARSER.add_argument(
        '--deployment_name',
        type=str,
        required=False,
        help='The deployment name to target. This must be a valid web role name.',
    )

    Flags.PARSER.add_argument(
        '--deployment_code',
        type=str,
        required=False,
        help='The deployment code to target. This must be a valid code from the config/ directory.',
    )

    Flags.PARSER.add_argument(
        '--localhost',
        action='store_true',
        default=False,
        help='Use this to run locally, instead of against a deployment. Some '
        'commands run against your local server, whereas others expect a '
        '--deployment_name to know which local postgres database to target.',
    )

    Flags.PARSER.add_argument(
        '--out',
        type=str,
        required=False,
        help='Filename of where to store output (if applicable)',
    )

    Command.register_command(
        name='list',
        description='List all the alerts associated with a given deployment. '
        'To run this command locally you will need to specify a deployment code. '
        'You can also write the output to a CSV by specifying a --out flag.',
        func=list_alerts,
        params=[
            Command.ParamCombination(
                required_params='--deployment_name',
                optional_params='--out',
                description='List all alerts on a remote deployment',
            ),
            Command.ParamCombination(
                required_params=('--localhost', '--deployment_code'),
                optional_params='--out',
                description='List all alerts from a local postgres db',
            ),
        ],
    )

    Command.initialize_commands()
    Command.run(Flags.ARGS.command)


if __name__ == '__main__':
    sys.exit(main())
