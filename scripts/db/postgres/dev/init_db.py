#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
# This script is a one-stop-shop for keeping local dev databases in a good state. It
# manages the creation and upgrading of a separate database for each deployment and
# enforces a standard naming convention for databases for all engineers.
#
# Usage:
#   ./init_db.py
#       No arguments. This will perform database initialization for every deployment
#       we support. If a database does not exist in postgres, it will be created. When
#       the database does exist, migrations will be run to ensure it is in the fully
#       upgraded state.
#
#   ./init_db.py deployment_code [deployment_code, ...]
#       One or more arguments. This will perform database initialization for only the
#       deployment codes listed.
#
#   ./init_db.py --db_name db_name
#       The `--db_name` flag indicates that a database with this exact name should be
#       initialized. If any deployment codes are also specified, they will be ignored.
#       This flag is useful for performing database initialization for a special
#       database locally that does not match the default naming convention. This can
#       happen if a dev is working on special database changes and does not want to
#       taint their existing database for a deployment.
import os
import subprocess
import sys

from functools import partial
from typing import Callable, List

from pylib.base.flags import Flags
from pylib.base.term_color import TermColor
from pylib.file.file_utils import FileUtils

from config import VALID_MODULES


def run_dev_script(
    script_name: str, check_returncode: bool, *args: str
) -> subprocess.CompletedProcess:
    script_path = os.path.join('scripts/db/postgres/dev', script_name)
    result = subprocess.run(
        [script_path, *args],
        check=False,
        cwd=FileUtils.GetSrcRoot(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    if check_returncode and result.returncode != 0:
        print(result.stdout)
        result.check_returncode()

    return result


def run_database_upgrade(
    deployment_code: str, db_name: str, print_log: Callable[..., None]
) -> None:
    '''Upgrade a deployment's database to be on the latest version. If the database does
    not yet exist, it will be created and a default admin user will be added.
    '''
    result = run_dev_script('upgrade_dev_database.sh', True, deployment_code, db_name)
    result_text = result.stdout.strip()

    # If there is no data on stdout, then no migration needed to be performed.
    if not result_text:
        return

    # Detect if the database was simply upgraded or was created for the first time.
    if not (
        f'Creating database {db_name}' in result_text
        and 'CREATE DATABASE' in result_text
    ):
        print_log('Upgraded')
        return

    # If the database was created for the first time, add a default admin user
    # so the engineer can start working quickly.
    print_log('Created')

    create_user_result = run_dev_script('create_default_admin_user.py', False, db_name)
    print_log(create_user_result.stdout.strip())

    if create_user_result.returncode == 0:
        return

    # Failure condition catch-all. The create user command was issued
    # but an error occurred trying to populate the database.
    create_user_result.check_returncode()


def run_database_downgrade(
    deployment_code: str, db_name: str, print_log: Callable[..., None]
) -> None:
    '''Downgrade the deployment's database by one version.'''
    result = run_dev_script('downgrade_dev_database.sh', True, deployment_code, db_name)

    # NOTE: Printing the downgrade logs directly since they are useful
    # information to have during this rare operation.
    for line in result.stdout.strip().split('\n'):
        print_log(line.strip())
    print_log('Downgraded')


# args is never modified
# pylint: disable=dangerous-default-value
def _populate_from_config_helper(
    deployment_code: str, db_name: str, args: List[str] = []
) -> None:
    '''Helper function to run the populate_query_models_from_config.py script.'''
    # NOTE: The Data Catalog db population script relies on deployment specific
    # config and does not receive any command line arguments. We must craft the
    # environment instead.
    env = {
        'DATABASE_URL': f'postgresql://postgres:@localhost/{db_name}',
        'ZEN_ENV': deployment_code,
        **os.environ,
    }

    # NOTE: Swallow all logs since we don't need to parse them. If an error
    # occurs it will be thrown inside the script and not reported via log.
    result = subprocess.run(
        ['scripts/data_catalog/populate_query_models_from_config.py', *args],
        check=False,
        cwd=FileUtils.GetSrcRoot(),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    if result.returncode != 0:
        print(result.stdout)
        result.check_returncode()


def populate_data_catalog_tables_from_config(
    deployment_code: str, db_name: str, print_log: Callable[..., None]
) -> None:
    '''Fill data catalog related tables with values from the deployment's config.'''
    print_log('Populating data catalog DB tables from config')
    _populate_from_config_helper(deployment_code, db_name)


def populate_dimension_and_datasource_tables(
    deployment_code: str, db_name: str, print_log: Callable[..., None]
) -> None:
    '''Fill dimension and datasource related tables with values from the deployment's
    config.'''
    print_log('Populating dimension and datasource DB tables')
    _populate_from_config_helper(
        deployment_code,
        db_name,
        args=['--populate_dimensions_and_datasources_only'],
    )


def initialize_database(
    deployment_code: str,
    db_name: str,
    # List of initialization functions to run, in order, with the signature:
    # (deployment_code: str, db_name: str, print_log: *args -> None) -> None
    initialization_functions: List[Callable[[str, str, Callable[..., None]], None]],
) -> None:
    '''Run a series of initialization functions over the deployment/database specified.'''
    # Build a printing function that attaches a colored prefix indicating the deployment
    # code to each line printed.
    print_log = partial(print, TermColor.ColorStr(deployment_code, 'YELLOW'), '-')
    print_log('Starting')

    for initialization_function in initialization_functions:
        initialization_function(deployment_code, db_name, print_log)

    print_log('Complete')


def get_script_runner(
    script_path: str,
) -> Callable[[str, str, Callable[..., None]], None]:
    '''Returns a runnable script for the inputted script location'''

    def _run_input_script(
        deployment_code: str, db_name: str, print_log: Callable[..., None]
    ) -> None:
        # NOTE: We want to pass in both DATABASE_URL and ZEN_ENV since we
        # have scripts that are run both for prod and dev servers
        env = {
            'DATABASE_URL': f'postgresql://postgres:@localhost/{db_name}',
            'ZEN_ENV': deployment_code,
            **os.environ,
        }

        print_log('Running script: ', script_path)
        result = subprocess.run(
            script_path,
            check=False,
            cwd=FileUtils.GetSrcRoot(),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        if result.returncode != 0:
            # Using print instead of print_log here so the error log text will be
            # in the default color rather than yellow.
            print(result.stdout)
            result.check_returncode()

        for line in result.stdout.strip().split('\n'):
            print_log(line.strip())

    return _run_input_script


def build_initialization_functions(
    downgrade: bool,
    populate_indicators_from_config: bool,
    # pylint: disable=invalid-name
    populate_dimensions_and_datasources: bool,
    additional_scripts: List[str],
) -> List[Callable[[str, str, Callable[..., None]], None]]:
    '''Build a list of initialization functions to run against a specific database.'''
    output: List[Callable[[str, str, Callable[..., None]], None]] = [
        run_database_upgrade if not downgrade else run_database_downgrade
    ]

    # These commands all do similar things, so no need to ever run multiple at once.
    if populate_indicators_from_config:
        output.append(populate_data_catalog_tables_from_config)
    elif populate_dimensions_and_datasources:
        output.append(populate_dimension_and_datasource_tables)

    for script_path in additional_scripts:
        output.append(get_script_runner(script_path))

    return output


def main() -> int:
    Flags.PARSER.add_argument(
        'deployments',
        choices=[*VALID_MODULES, []],
        metavar='deployment_code',
        help='List of deployments to initialize a dev DB for. If omitted, all '
        'deployments will be used.',
        nargs='*',
    )
    Flags.PARSER.add_argument(
        '--db_name',
        required=False,
        type=str,
        help='Perform initialization specifically on a database with this exact name. '
        'When used, the deployment_code argument is ignored and only this single '
        'database is processed.',
    )
    Flags.PARSER.add_argument(
        '--downgrade',
        action='store_true',
        default=False,
        required=False,
        help='Downgrade the database for the deployment (or db_name) specified. Only '
        'supports downgrading a single database at a time. All other arguments '
        'are ignored.',
    )
    Flags.PARSER.add_argument(
        '--populate_indicators_from_config',
        action='store_true',
        default=False,
        required=False,
        help='Populate the data catalog db tables (field models, datasource, etc.) '
        'with values from the config for that deployment. DEPRECATED: instead use '
        '--populate_indicators. NOTE: This will replace any values already stored '
        'in the DB for these tables.',
    )
    Flags.PARSER.add_argument(
        '--populate_dimensions_and_datasources',
        action='store_true',
        default=False,
        required=False,
        help='Populate the dimension and datasource related tables with values from '
        'the config for that deployment.',
    )
    Flags.PARSER.add_argument(
        '--run_scripts',
        type=str,
        nargs='*',
        required=False,
        default=[],
        help='A list of scripts to execute per deployment, run from ZENYSIS_ROOT',
    )
    Flags.InitArgs()

    # Ordered list of DB initialization functions to run for each database requested.
    initialization_functions = build_initialization_functions(
        Flags.ARGS.downgrade,
        Flags.ARGS.populate_indicators_from_config,
        Flags.ARGS.populate_dimensions_and_datasources,
        Flags.ARGS.run_scripts,
    )

    # Test early to ensure the user is only trying to downgrade a single DB at a time.
    if (
        Flags.ARGS.downgrade
        and not Flags.ARGS.db_name
        and len(Flags.ARGS.deployments) != 1
    ):
        print(
            TermColor.ColorStr('ERROR', 'RED_BG'),
            'Only a single database can be downgraded at a time.',
        )
        return 1

    # Ensure the Postgres database is running locally and has received its initial
    # setup (like creating the postgres db admin user).
    run_dev_script('start_postgres.sh', True)

    TermColor.PrintStr('Beginning database initialization', 'PURPLE', False)

    # If a database name was specified, we will be initializing just that database and
    # ignoring all deployment codes specified.
    if Flags.ARGS.db_name:
        print(
            TermColor.ColorStr('Database to process:', 'AUQA'),
            TermColor.ColorStr(Flags.ARGS.db_name, 'YELLOW'),
        )
        initialize_database(os.getenv("ZEN_ENV"), Flags.ARGS.db_name, initialization_functions)
        return 0

    # Initialize the database for each deployment specified. If no deployments were
    # provided, use all deployments.
    deployment_codes = sorted(set(Flags.ARGS.deployments or VALID_MODULES))
    print(
        TermColor.ColorStr('Deployments to process:', 'AUQA'),
        TermColor.ColorStr(', '.join(deployment_codes), 'YELLOW'),
    )
    for deployment_code in deployment_codes:
        # Use standard database naming convention for each deployment locally.
        db_name = f'{deployment_code}-local'
        initialize_database(deployment_code, db_name, initialization_functions)

    return 0


if __name__ == '__main__':
    sys.exit(main())
