import tempfile

from os import getenv, path
from typing import Optional

import global_config
from web.server.environment import IS_PRODUCTION

# Store uploads here.  This is a relative path from the app's instance root.
DATA_UPLOAD_FOLDER = 'uploads/'

DEFAULT_DATABASE_NAME = 'zenysis'
DEFAULT_DB_URI = 'postgresql:///%s' % DEFAULT_DATABASE_NAME

# The Flask Application expects capitalized keys to be provided.
# TODO(vedant) - Write a conversion method to uppercase all
# configuration keys and disable this lint.
# pylint:disable=C0103
class FlaskConfiguration:
    def __init__(self):
        # Flask settings
        zen_env = getenv('ZEN_ENV')
        self.SECRET_KEY = getenv('SECRET_KEY', global_config.DEFAULT_SECRET_KEY)
        self.SQLALCHEMY_DATABASE_URI = getenv('DATABASE_URL', DEFAULT_DB_URI)
        self.SQLALCHEMY_TRACK_MODIFICATIONS = False
        self.SQLALCHEMY_ENGINE_OPTIONS = {
            # NOTE(solo): Set application name to be sent to post pg_stat_activity, useful
            # for debugging idle, idle in transaction connections
            'connect_args': {
                'application_name': f'{zen_env} webserver' if zen_env else 'webserver'
            }
        }
        self.CSRF_ENABLED = True

        self.IS_PRODUCTION = IS_PRODUCTION

        # Don't cache anything for now.
        self.SEND_FILE_MAX_AGE_DEFAULT = int(getenv('SEND_FILE_MAX_AGE_DEFAULT', '0'))

        # 128 mb max
        self.MAX_CONTENT_LENGTH = int(getenv('MAX_CONTENT_LENGTH', 128 * 1024 * 1024))

        # Set JWT token expiration to 15 minutes, this can overriden
        # by the JWT manager caller
        self.JWT_TOKEN_EXPIRATION_TIME = 15 * 60

        # Flask-User settings
        self.USER_APP_NAME = 'Zenysis'
        self.USER_ENABLE_EMAIL = False  # register with email. We have this disabled
        # because we want to use email as the username,
        # and not have both email AND username
        self.USER_ENABLE_RETYPE_PASSWORD = False  # prompt for 'retype password' in
        # registration/change pw/reset pw forms
        self.USER_ENABLE_USERNAME = True  # register and login with username
        self.USER_ENABLE_CHANGE_USERNAME = True  # allow user to change username
        self.USER_ENABLE_CONFIRM_EMAIL = False  # force users to confirm email
        # (requires USER_ENABLE_EMAIL=True)
        self.USER_ENABLE_FORGOT_PASSWORD = (
            True  # requires USER_ENABLE_EMAIL=True, which
        )
        # we do not use, so we have to override this view
        self.USER_SEND_REGISTERED_EMAIL = False  # requires USER_ENABLE_EMAIL=True
        self.USER_SEND_PASSWORD_CHANGED_EMAIL = False  # requires USER_ENABLE_EMAIL=True
        self.USER_SEND_USERNAME_CHANGED_EMAIL = False  # requires USER_ENABLE_EMAIL=True
        self.USER_SHOW_USERNAME_EMAIL_DOES_NOT_EXIST = (
            True  # Show 'Username does not exist' error
        )
        self.USER_RESET_PASSWORD_EXPIRATION = 2 * 24 * 3600  # 2 days

        # Don't automatically login the user on registration.
        self.USER_AUTO_LOGIN = False

        # Templates
        self.USER_LOGIN_TEMPLATE = 'auth/login.html'
        self.USER_REGISTER_TEMPLATE = 'auth/register.html'
        self.USER_FORGOT_PASSWORD_TEMPLATE = 'auth/forgot_password.html'
        self.USER_RESET_PASSWORD_TEMPLATE = 'auth/reset_password.html'
        self.USER_PROFILE_TEMPLATE = 'auth/user_profile.html'

        # flask-user URLs
        self.USER_LOGIN_URL = '/login'  # url_for('user.login')
        self.USER_REGISTER_URL = '/zen/register'  # url_for('user.register')
        self.USER_FORGOT_PASSWORD_URL = (
            '/user/forgot-password'  # url_for('user.forgot_password')
        )
        self.USER_RESET_PASSWORD_URL = (
            '/user/reset-password/<token>'  # url_for('user.reset_password')
        )

        # flask-user maps endpoints using url_for, and maps empty endpoints to '/'
        self.USER_AFTER_LOGIN_ENDPOINT = ''
        self.USER_AFTER_FORGOT_PASSWORD_ENDPOINT = ''
        self.USER_AFTER_REGISTER_ENDPOINT = ''

        self.VENDOR_SCRIPT_PATH = '/js/vendor/min' if IS_PRODUCTION else '/js/vendor'

        # Mailgun settings
        self.MAILGUN_API_KEY = global_config.MAILGUN_API_KEY
        self.MAILGUN_NAME = global_config.MAILGUN_NAME
        self.MAILGUN_SENDER = global_config.MAILGUN_SENDER

        # HACK(vedant) - This is to temporarily fix T2646. This is NOT the solution
        # The solution is to implement a paging service on the client.
        self.POTION_MAX_PER_PAGE = 10000
        self.CACHE_TIMEOUT_SECONDS = 10 * 60  # 10 minutes
        self.CACHE_DIR = path.join(tempfile.gettempdir(), 'zenysis-webserver-cache')

        self.ACCOUNT_SID = getenv('TWILIO_ACCOUNT_SID', 'account-sid')
        self.AUTH_TOKEN = getenv('TWILIO_AUTH_TOKEN', 'auth-token')
        self.TWILIO_PHONE_NUMBER = getenv('TWILIO_PHONE_NUMBER', 'phone-number')

        self.ASYNC_NOTIFICATIONS_ENABLED = False

        self.REDIS_HOST = getenv('REDIS_HOST', global_config.REDIS_HOST)
        self.HASURA_HOST = getenv(
            'HASURA_HOST',
            global_config.HASURA_HOST if IS_PRODUCTION else 'http://localhost:8088',
        )

        # NOTE(nina): Flag to switch between dashboard app and new dashboard
        # builder for testing
        self.USE_NEW_DASHBOARD_APP = False

    def apply_instance_config_overrides(self, instance_config: Optional[dict]) -> None:
        if not instance_config:
            return

        self.ASYNC_NOTIFICATIONS_ENABLED = instance_config.get(
            'async_notifications_enabled', self.ASYNC_NOTIFICATIONS_ENABLED
        )
