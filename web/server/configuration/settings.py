'''Administrator adjustable configuration settings for the web server
'''
from builtins import str, object
from flask import g

from models.alchemy.configuration import Configuration
from log import LOG
from web.server.data.data_access import get_db_adapter, find_one_by_fields, Transaction
from web.server.util.util import (
    assert_boolean,
    assert_string,
    assert_optional_string,
    assert_users_exist,
)

'''
The configuration setting for toggling public access to the site. If enabled, unregistered
users will have access to the permissions defined in the `default_roles` table for rows which the
`apply_to_unregistered` flag is set to `True`.
'''
PUBLIC_ACCESS_KEY = 'public_access'

'''
The configuration setting that dictates which page the user will be redirected to upon logging in
/ accessing the index page.
'''
DEFAULT_URL_KEY = 'default_url'

PROJECT_MANAGER_ID_KEY = 'project_manager_ids'

CRISP_ID_KEY = 'crisp_id'
CRISP_ENABLED_KEY = 'crisp_enabled'
CUR_DATASOURCE_KEY = 'cur_datasource'

'''
This setting dictates whether or not users will be automatically signed out after
30 minutes of inactivity by default. Users will still be able to select the
'Keep me signed in' check box to avoid being automatically signed out
'''
AUTOMATIC_SIGN_OUT_KEY = 'keep_me_signed_in'

'''
This setting enable case management for this instance
'''
ENABLE_CASE_MANAGEMENT = 'enable_case_management'

'''
This setting controls the case management app name to be displayed on the navbar
'''
CASE_MANAGEMENT_APP_NAME = 'case_management_app_name'

'''
This setting holds the slug for the dashboard to use as the case management home page
'''
CASE_MANAGEMENT_HOME_PAGE_DASHBOARD = 'case_management_home_page_dashboard'

CONFIGURATION_KEYS = set(
    [
        PUBLIC_ACCESS_KEY,
        DEFAULT_URL_KEY,
        PROJECT_MANAGER_ID_KEY,
        CRISP_ENABLED_KEY,
        CRISP_ID_KEY,
        CUR_DATASOURCE_KEY,
        AUTOMATIC_SIGN_OUT_KEY,
        ENABLE_CASE_MANAGEMENT,
        CASE_MANAGEMENT_APP_NAME,
        CASE_MANAGEMENT_HOME_PAGE_DASHBOARD,
    ]
)

'''
The type mapping between the text entry stored in the database
'''
_KEY_TO_VALIDATOR = {
    PUBLIC_ACCESS_KEY: assert_boolean,
    DEFAULT_URL_KEY: assert_string,
    PROJECT_MANAGER_ID_KEY: assert_users_exist,
    CRISP_ENABLED_KEY: assert_boolean,
    CRISP_ID_KEY: assert_string,
    CUR_DATASOURCE_KEY: assert_string,
    AUTOMATIC_SIGN_OUT_KEY: assert_boolean,
    ENABLE_CASE_MANAGEMENT: assert_boolean,
    CASE_MANAGEMENT_APP_NAME: assert_string,
    CASE_MANAGEMENT_HOME_PAGE_DASHBOARD: assert_optional_string,
}

'''The default values for all configuration settings.
'''
_DEFAULT_SETTINGS = {
    PUBLIC_ACCESS_KEY: False,
    DEFAULT_URL_KEY: '/overview',
    PROJECT_MANAGER_ID_KEY: [],
    CRISP_ENABLED_KEY: False,
    CRISP_ID_KEY: '00000000-0000-0000-0000-000000000000',
    CUR_DATASOURCE_KEY: 'LATEST_DATASOURCE',
    AUTOMATIC_SIGN_OUT_KEY: True,
    ENABLE_CASE_MANAGEMENT: False,
    CASE_MANAGEMENT_APP_NAME: 'Case Management',
    CASE_MANAGEMENT_HOME_PAGE_DASHBOARD: None,
}

_SETTING_TO_DESCRIPTION = {
    PUBLIC_ACCESS_KEY: 'Indicates whether or not public user support is enabled. '
    'When enabled, unregistered users will be able to access the site as well.',
    DEFAULT_URL_KEY: 'This setting dictates which page the user will be redirected to upon logging '
    'in/accessing the index page.',
    PROJECT_MANAGER_ID_KEY: 'A list of project managers for this platform. '
    'Project managers are bcc\'ed on all \'critical\' '
    'communications sent by the platform.',
    CRISP_ENABLED_KEY: 'Indicates whether or not Crisp chat is enabled',
    CRISP_ID_KEY: 'A unique identifier that Crisp uses to resolve a chat session to an individual'
    'domain.',
    CUR_DATASOURCE_KEY: 'Datasource used for this platform.',
    AUTOMATIC_SIGN_OUT_KEY: 'This setting dictates whether or not users will be automatically '
    'signed out after 30 minutes of inactivity by default.'
    'Users will still be able to select the \'Keep me signed in\''
    'check box to avoid being automatically signed out.',
    ENABLE_CASE_MANAGEMENT: 'This setting dictates whether or not to enable the case '
    'management app',
    CASE_MANAGEMENT_APP_NAME: 'The app name to display in the navbar',
    CASE_MANAGEMENT_HOME_PAGE_DASHBOARD: 'The dashboard to optionally use as the '
    'case management home page',
}

''' The in-memory configuration store containing all the default values. You should NOT reference
this store directly. To query any configuration value, ALWAYS use the `get_configuration` method.
That will determine whether or not to return the value defined in the database or the hard-coded
default.
'''
_DEFAULT_CONFIGURATION_STORE = {
    key: {
        'description': _SETTING_TO_DESCRIPTION[key],
        'key': key,
        'value': _DEFAULT_SETTINGS[key],
    }
    for key in CONFIGURATION_KEYS
}


class ConfigurationRepository(object):
    def __init__(self, configuration_keys=None, default_configuration_store=None):
        self.configuration_keys = configuration_keys or CONFIGURATION_KEYS
        self.default_configuration_store = (
            default_configuration_store or _DEFAULT_CONFIGURATION_STORE
        )

    def get_configuration(self):
        pass

    def update_configuration(self):
        pass

    def assert_valid_configuration(self):
        pass


def get_configuration(key):
    '''
    Retrieves the value for a key from the configuration store.

    Parameters
    ----------
    key : str
        The name of the setting that you want to determine the value of. Must be defined in
        `web.server.configuration.settings.CONFIGURATION_KEYS` or an exception will be thrown.

    Returns
    -------
    object
        The value associated with `key`. If a value is declared in the database
        that value is returned. In all other circumstances, the default value as given in
        `web.server.configuration.settings.DEFAULT_SETTINGS[key]` is returned

    Raises
    -------
    KeyError
        In the event that `key` is not a valid configuration key listed in
        `web.server.configuration.settings.CONFIGURATION_KEYS`.
    '''
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG
    if key not in CONFIGURATION_KEYS:
        message = (
            'Configuration key \'%s\' is not a valid key. '
            'The list of valid keys is \'%s\'' % (key, CONFIGURATION_KEYS)
        )
        logger.error(message)
        raise KeyError(message)

    database_entity = find_one_by_fields(
        Configuration, search_fields={'key': key}, case_sensitive=False
    )
    value = (
        database_entity.overwritten_value
        if database_entity.overwritten
        else _DEFAULT_SETTINGS[key]
    )
    logger.debug('Retrieved value for key \'%s\' was \'%s\'', key, value)
    return value


def assert_valid_configuration(key, new_value):
    '''Given a key and the string representation of its new value,
    attempts to determine that the `new_value` is an appropriate updated
    configuration value for the given setting.

    Parameters
    ----------
    key : str
        The name of the setting that you want to test a new value for. Must be defined in
        `web.server.configuration.settings.CONFIGURATION_KEYS` or an exception will be thrown.

    new_value: str
        The object representation of the new value for the setting associated with `key`

    Raises
    -------
    KeyError
        In the event that `key` is not a valid configuration key listed in
        `web.server.configuration.settings.CONFIGURATION_KEYS`.

    ValueError
        In the event that the conversion of `new_value` to its native Python type fails.
    '''

    if key not in CONFIGURATION_KEYS:
        message = (
            'Configuration key \'%s\' is not a valid key. '
            'The list of valid keys is \'%s\'' % (key, CONFIGURATION_KEYS)
        )
        g.request_logger.error(message)
        raise KeyError(message)

    try:
        _KEY_TO_VALIDATOR[key](new_value)
    except Exception as e:
        message = (
            'An error occurred while parsing a new configuration value for \'%s\'. '
            'The update will be rejected. Details as follows: \'%s\''
        ) % (key, e)
        g.request_logger.warning(message)
        raise ValueError(message)


def _populate_configuration_table(session=None):
    '''Populates the `configuration` table of the SQL Database with the default values from the
    in-memory configuration store.
    '''

    session = session or get_db_adapter().session

    LOG.debug('Populating configuration store with default values. ')
    default_value_errors = []
    with Transaction(get_session=lambda: session) as transaction:
        for key in CONFIGURATION_KEYS:
            entity = transaction.find_one_by_fields(Configuration, True, {'key': key})

            value = _DEFAULT_CONFIGURATION_STORE[key]['value']

            try:
                assert_valid_configuration(key, value)
            # We intentionally want to catch all exceptions
            # pylint:disable=W0703
            except Exception as e:
                default_value_errors.append(e)
                LOG.error(
                    'Encountered an error when attempting to update default value for key \'%s\'. '
                    'Default value was \'%s\'. Error was \'%s\'. ',
                    key,
                    value,
                    e,
                )

            if not entity:
                LOG.debug(
                    'Configuration for \'%s\' did not exist in database, adding it.',
                    key,
                )
                new_entity = Configuration(
                    key=key, overwritten_value=None, overwritten=False
                )
                transaction.add_or_update(new_entity, flush=True)
                LOG.debug('Added configuration entry for \'%s\'.', key)
            else:
                LOG.debug(
                    'Configuration for \'%s\' already exists in database, skipping it.',
                    key,
                )

    if default_value_errors:
        raise ValueError(
            'Default configurations were not valid. Details as follows: %s'
            % str(default_value_errors)
        )
