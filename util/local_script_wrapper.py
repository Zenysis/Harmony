"""
This wrapper makes it easier to write scripts that need to access remote deployments DBs,
for example, from the pipeline. The script itself now has a flask app with db connection
so can use it just as from the web server and deal with one deployment at a time.
"""

import os

from pylib.base.flags import Flags

from util.flask import build_flask_config
from web.server.app_base import create_app, initialize_zenysis_module


def local_main_wrapper(main, setup_arguments=None):
    if setup_arguments:
        setup_arguments()
        Flags.InitArgs()

    environment = os.getenv('ZEN_ENV')
    if not environment:
        Flags.PARSER.error('Should specify ZEN_ENV for execution')
        return 1

    app = create_app(build_flask_config(environment))
    initialize_zenysis_module(app)
    with app.app_context():
        return main()
