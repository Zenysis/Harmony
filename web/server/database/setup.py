'''A module containing initialization logic for the User Database.
'''
import sqlite3

from flask_user import UserManager, SQLAlchemyAdapter
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm.session import sessionmaker


from log import LOG
from models.alchemy.user import User
from web.server.configuration.settings import _populate_configuration_table
from web.server.routes.views.flask_user_views import (
    forgot_password,
    login,
    register,
    unauthenticated,
)
from web.server.util.forms import ExpandedRegisterForm, ZenForgotPasswordForm
from web.server.util.util import validate_email, validate_password


def initialize_user_manager(app, db):
    db_adapter = SQLAlchemyAdapter(db, UserClass=User)

    # Initialize Flask-User.
    UserManager(
        db_adapter,
        app,
        password_validator=validate_password,
        username_validator=validate_email,
        login_view_function=login,
        register_form=ExpandedRegisterForm,
        register_view_function=register,
        forgot_password_form=ZenForgotPasswordForm,
        forgot_password_view_function=forgot_password,
        unauthenticated_view_function=unauthenticated,
        unauthorized_view_function=app.page_router.unauthorized,
    )


def initialize_database_seed_values(database_connection_string):
    ''' Performs any application-specific data initialization that must be run on application
    startup vs during database migration.

    Parameters
    ----------
        database_connection_string: string
            The connection string that will be used to connect to the database and perform any
            runtime seeding.
    '''
    # pylint: disable=C0103
    Session = sessionmaker()
    engine = create_engine(
        database_connection_string,
        connect_args={'application_name': 'setup:initialize db seed values'},
    )
    Session.configure(bind=engine)
    session = Session()

    _populate_configuration_table(session)


# pylint: disable=W0613
# This is the signal handler's method signature.
@event.listens_for(Engine, "connect")
def enforce_foreign_key_constraints(dbapi_connection, connection_record):
    '''A listener that ensures that the underlying SQLite Database respects
    foreign key constraints on insert operations.
    '''
    # PostgreSQL and any other RDBMS will barf on this particular pragma directive. Only execute
    # this command IFF the connection is being established w/ a SQLite3 Database.
    if isinstance(dbapi_connection, sqlite3.Connection):
        LOG.debug(
            'SQLite3 Detected. Configuring DB Connection to enforce Foreign Key constraints.'
        )
        LOG.debug(
            'SQLite3 is no longer \'officially\' supported by our platform. Consider '
            'switching to PostgreSQL instead'
        )
        cursor = dbapi_connection.cursor()
        cursor.execute('PRAGMA foreign_keys=ON')
        cursor.close()
