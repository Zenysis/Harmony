# NOTE (katuula): This class has too many statements, exceeding the recommended Pylint limit.
# A refactor is pending to improve readability and maintainability.
# Please consider this if you're modifying this class.
# Your contribution to this effort is appreciated.
# pylint: disable=too-many-statements

import tempfile

from datetime import timedelta
from os import path
from typing import Optional
from config.settings import getenv

from config.settings import getenv
from config import settings
from web.server.environment import IS_PRODUCTION, IS_TEST

# Store uploads here.  This is a relative path from the app's instance root.
DATA_UPLOAD_FOLDER = 'uploads/'

DEFAULT_DATABASE_NAME = 'zenysis'
DEFAULT_DB_URI = f'postgresql:///{DEFAULT_DATABASE_NAME}'


# The Flask Application expects capitalized keys to be provided.
# TODO - Write a conversion method to uppercase all
# configuration keys and disable this lint.
# pylint:disable=C0103
# pylint:disable=too-many-statements
class FlaskConfiguration:
    def __init__(self):
        # Flask settings
        zen_env = getenv('ZEN_ENV')
        self.SECRET_KEY = self.JWT_SECRET_KEY = getenv(
            'SECRET_KEY', settings.DEFAULT_SECRET_KEY
        )
        self.SQLALCHEMY_DATABASE_URI = getenv('DATABASE_URL', DEFAULT_DB_URI)
        self.SQLALCHEMY_TRACK_MODIFICATIONS = False
        self.SQLALCHEMY_ENGINE_OPTIONS = {
            # NOTE: Set application name to be sent to post pg_stat_activity, useful
            # for debugging idle, idle in transaction connections
            'connect_args': {
                'application_name': f'{zen_env} webserver' if zen_env else 'webserver'
            }
        }
        self.CSRF_ENABLED = True

        self.IS_PRODUCTION = IS_PRODUCTION
        self.IS_TEST = IS_TEST

        # Don't cache anything for now.
        self.SEND_FILE_MAX_AGE_DEFAULT = int(getenv('SEND_FILE_MAX_AGE_DEFAULT', '0'))

        # 128 mb max
        self.MAX_CONTENT_LENGTH = int(
            getenv('MAX_CONTENT_LENGTH', str(128 * 1024 * 1024))
        )

        # Set JWT token expiration to 15 minutes, this can overriden
        # by the JWT manager caller
        self.JWT_TOKEN_EXPIRATION_TIME = 15 * 60
        self.JWT_TOKEN_LOCATION = ['headers', 'cookies']
        self.JWT_ACCESS_COOKIE_NAME = 'accessKey'
        self.JWT_TOKEN_WEB_COOKIE_EXPIRATION = timedelta(days=365)
        # NOTE: I disable CSRF protection in flask-jwt-extended because this kind of
        # protection is supposed to be provided without using JWT as well
        self.JWT_CSRF_METHODS = []

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

        self.VENDOR_SCRIPT_PATH = '/js/vendor/min/'

        self.IMAGE_PATH = '' if self.IS_PRODUCTION else 'images/'

        # SMTP email settings
        self.SMTP_CONFIG = {
            'email_host': getenv('EMAIL_HOST', 'smtp.mailgun.org'),
            'email_host_password': getenv('EMAIL_HOST_PASSWORD'),
            'email_credential_id': getenv('MAILGUN_SMTP_ACCOUNT_ID', None),
            'email_host_user': getenv('EMAIL_HOST_USER', ''),
            'email_port': int(getenv('EMAIL_PORT', '587')),
            'email_use_encryption': getenv('EMAIL_USE_ENCRYPTION'),
            'email_tag_header_name': getenv('EMAIL_TAG_HEADER_NAME'),
        }

        # NOTE - This is to temporarily fix T2646. This is NOT the solution
        # The solution is to implement a paging service on the client.
        self.POTION_MAX_PER_PAGE = 10000

        self.ACCOUNT_SID = getenv('TWILIO_ACCOUNT_SID', 'account-sid')
        self.AUTH_TOKEN = getenv('TWILIO_AUTH_TOKEN', 'auth-token')
        self.TWILIO_PHONE_NUMBER = getenv('TWILIO_PHONE_NUMBER', 'phone-number')

        self.ASYNC_NOTIFICATIONS_ENABLED = False

        # Cache settings
        # We want to use redis in production but fallback for filesystem
        # cache for development, so there's no need in redis installed for devs
        self.CACHES = {
            'fs': {
                'CACHE_TYPE': 'FileSystemCache',
                'CACHE_DIR': path.join(
                    tempfile.gettempdir(), f'zenysis-webserver-cache-{zen_env}'
                ),
                'CACHE_THRESHOLD': 10000,
            },
            'redis': {
                'CACHE_KEY_PREFIX': f'zen-{zen_env}-',
                'CACHE_TYPE': 'RedisCache',
                'CACHE_REDIS_HOST': getenv('REDIS_HOST', settings.REDIS_HOST),
            },
        }
        # Add options common for all cache backends
        for cache in self.CACHES.values():
            cache['CACHE_DEFAULT_TIMEOUT'] = 10 * 60  # 10 minutes
        # We don't expect devs to have redis installed but they can
        # if provide the REDIS_HOST env var
        if IS_PRODUCTION or getenv('REDIS_HOST'):
            self.CACHES['default'] = self.CACHES['redis']
        else:
            self.CACHES['default'] = self.CACHES['fs']

        self.QUERY_DATA_CACHE_TIMEOUT = 86400  # 1 day, is it the best value?

        self.HASURA_HOST = getenv(
            'HASURA_HOST',
            settings.HASURA_HOST if IS_PRODUCTION else 'http://localhost:8088',
        )

        # NOTE: Flag to switch between dashboard app and new dashboard
        # builder for testing
        self.USE_NEW_DASHBOARD_APP = False

    def apply_instance_config_overrides(self, instance_config: Optional[dict]) -> None:
        if not instance_config:
            return

        self.ASYNC_NOTIFICATIONS_ENABLED = instance_config.get(
            'async_notifications_enabled', self.ASYNC_NOTIFICATIONS_ENABLED
        )
