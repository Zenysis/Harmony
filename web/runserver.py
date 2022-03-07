import os
import socket
import sys
from pylib.base.flags import Flags

# NOTE(stephen): Need to import our dev reloader since registration is handled in that
# file.
# pylint: disable=unused-import
import web.dev_reloader

from config import VALID_MODULES
from web.server.app import create_app
from web.server.configuration.instance import load_instance_configuration_from_file
from web.server.configuration.flask import FlaskConfiguration


def start_postgres():
    '''Start postgres server on dev machine if it is not running already.'''
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        port_in_use = s.connect_ex(('localhost', 5432)) == 0
        if not port_in_use:
            os.system('scripts/db/postgres/dev/start_postgres.sh')


def main():
    Flags.PARSER.add_argument(
        '--db_name',
        type=str,
        required=False,
        help='The name of the database in the Postgres server to connect to',
    )
    Flags.PARSER.add_argument(
        '--db_uri',
        type=str,
        required=False,
        help='The specific Postgres URI connection string to use for connecting to the '
        'database. This should rarely be used.',
    )
    Flags.PARSER.add_argument(
        '--port',
        '-p',
        type=int,
        required=False,
        default=5000,
        help='Port the server should use',
    )
    Flags.PARSER.add_argument(
        '--environment',
        '-e',
        required=False,
        type=str,
        default='',
        help='The Zenysis environment that the server should use. '
        'Can optionally be specified by setting the `ZEN_ENV` environment '
        'variable. The environment variable will take precedence over '
        'the command-line argument.',
        choices=VALID_MODULES,
    )
    Flags.InitArgs()

    environment = (
        Flags.ARGS.environment if Flags.ARGS.environment else os.getenv('ZEN_ENV')
    )
    if not environment:
        raise ValueError(
            'The Zenysis environment that the server should use is not set. '
            'It can optionally be specified by setting the `ZEN_ENV` environment '
            'variable or passing the environment flag.'
        )

    # An instance config is not required in dev, so we don't want to print an error if
    # it is missing.
    instance_config = load_instance_configuration_from_file(log_missing=False)

    # Create the default flask configuration. Apply any instance config overrides the
    # dev might be using locally.
    flask_config = FlaskConfiguration()
    flask_config.apply_instance_config_overrides(instance_config)

    # If no db_name flag was set, use the default database name for this deployment.
    db_name = Flags.ARGS.db_name or f'{environment}-local'

    # NOTE(stephen): Intentionally hardcoding the DB username/password/host since
    # this script is only used in development. Only allow overriding if the user has
    # explicitly stated they have a database URI to connect using.
    db_uri = Flags.ARGS.db_uri or f'postgresql://postgres:@localhost/{db_name}'

    # Make sure Postgres has been started on the developers machine.
    if not Flags.ARGS.db_uri:
        start_postgres()

    # HACK(stephen): It's not very safe to manipulate Python's in-memory environment
    # variables dict, but I wanted to make sure that any downstream modules that
    # rely on the DATABASE_URL environment variable get the correct one.
    os.environ['DATABASE_URL'] = db_uri
    flask_config.SQLALCHEMY_DATABASE_URI = db_uri

    # HACK(stephen): For ease of development, make sure hasura graphql docker services
    # are running and using the correct DB.
    os.system(f'scripts/db/hasura/dev/start_hasura.sh {db_name}')
    print('*** Hasura running on http://localhost:8088')

    app = create_app(flask_config, instance_config, environment)
    app.run(host='0.0.0.0', port=Flags.ARGS.port, reloader_type='zenysis_watchdog')


if __name__ == '__main__':
    sys.exit(main())
