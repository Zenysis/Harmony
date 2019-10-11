from builtins import object
from alembic.environment import EnvironmentContext  # pylint: disable=import-error
from alembic.script import ScriptDirectory

class RevisionStatus(object):
    '''A class that captures data about Alembic schema versions.
    '''

    def __init__(self):
        # Defer importing the current app since other utilities might not
        # require being inside a flask application context
        from flask import current_app

        # Grab the current alembic configuration set by flask_migrate
        config = current_app.extensions['migrate'].migrate.get_config()
        script = ScriptDirectory.from_config(config)
        self.head_revision = script.get_current_head()

        # Current revision will be set via a callback once the alembic
        # environment is entered
        self.current_revision = None

        # Enter the alembic EnvironmentContext so that we can pull the latest
        # revision from the DB.
        with EnvironmentContext(config, script, fn=self._set_current_revision):
            script.run_env()

    def _set_current_revision(self, _, context):
        self.current_revision = context.get_current_revision()
        # EnvironmentContext passes this function as a callback to alembic's
        # MigrationContext. MigrationContext requires that each callback
        # return an iterable.
        return []
