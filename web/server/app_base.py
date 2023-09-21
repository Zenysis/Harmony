'''Create the base Flask app without customization. This registers the database
connection and migrations and creates the bare Flask app with only a minimal
configuration.
'''

from typing import Tuple

from flask import Flask
from flask_migrate import Migrate
from pylib.file.file_utils import FileUtils

# Register all models that are used in the platform so that Flask-Migrate can
# auto-detect schema changes.
# pylint: disable=unused-import
import models.alchemy.alerts
import models.alchemy.api_token
import models.alchemy.case_management
import models.alchemy.configuration
import models.alchemy.dashboard
import models.alchemy.data_upload
import models.alchemy.entity_matching
import models.alchemy.feed
import models.alchemy.permission
import models.alchemy.pipeline_runs
import models.alchemy.query
import models.alchemy.query_policy
import models.alchemy.security_group
import models.alchemy.schedule
import models.alchemy.user
import models.alchemy.user_query_session

from config.loader import import_configuration_module
from web.server.configuration.flask import FlaskConfiguration
from web.server.app_db import create_db

from db.sqlalchemy import SQLAlchemy


def create_bare_app(flask_config=None) -> Flask:
    # Create and configure the main Flask app.
    app = Flask(__name__, static_folder='../public', static_url_path='')

    flask_config = flask_config or FlaskConfiguration()

    # Misc app setup and settings.
    app.secret_key = flask_config.SECRET_KEY
    app.debug = not flask_config.IS_PRODUCTION
    app.config.from_object(flask_config)
    return app


def create_app_base(flask_config=None) -> Tuple[Flask, SQLAlchemy]:
    '''Create a new Flask app instance and DB reference.'''
    app = create_bare_app(flask_config)
    # Register the app with our db reference
    db = create_db()
    db.init_app(app)

    # Handle migrations before anyone uses the DB
    migrations_directory = FileUtils.GetAbsPathForFile('web/server/migrations')
    Migrate(app, db, migrations_directory)
    return (app, db)


def create_app(flask_config=None) -> Flask:
    '''Create a new Flask app instance and return it directly. All customization
    must be done by the user.

    NOTE: This function is useful for users that need to interact with the
    Flask ecosystem command line without wanting to fully stand up and initialize the
    entire app. A prime example of this is database migration. Flask-Migrate does not
    need the entire view to be initialized to be able to set up migrations correctly.
    '''
    return create_app_base(flask_config)[0]


def initialize_zenysis_module(app, zenysis_environment=None):
    # If no zenysis environment is provided, use ZEN_ENV environment variable.
    app.zen_config = import_configuration_module(zenysis_environment)
