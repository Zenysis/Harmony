import os
import sys
from pylib.base.flags import Flags

from config import VALID_MODULES
from web.server.app import create_app


def main():
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
        choices=[env for env in VALID_MODULES],
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

    app = create_app(zenysis_environment=environment)
    app.run(host='0.0.0.0', port=Flags.ARGS.port)


if __name__ == '__main__':
    sys.exit(main())
