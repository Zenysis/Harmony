from builtins import object
from flask import g
from flask_potion import fields
from flask_potion.routes import ItemRoute
from flask_potion.signals import before_create, before_delete
from werkzeug.exceptions import BadRequest, MethodNotAllowed

from models.alchemy.configuration import Configuration
from web.server.configuration.settings import (
    CONFIGURATION_KEYS,
    _DEFAULT_CONFIGURATION_STORE,
    get_configuration,
    assert_valid_configuration,
)
from web.server.data.data_access import Transaction
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.api.api_models import PrincipalResource


class ConfigurationResource(PrincipalResource):
    '''The potion class for performing CRUD operations on the `Configuration` class.
    '''

    class Meta(object):
        model = Configuration
        id_attribute = 'key'
        id_field_class = fields.String

        # Read Permissions are conferred upon all users.
        #
        # Create, Update and Delete Permissions are enforced by the
        # Signal Handlers installed when the API for this Resource
        # are initialized in `web.server.security.signal_handlers.py`
        permissions = {'read': 'yes'}
        read_only_fields = ('description', 'key')
        exclude_fields = ('overwritten_value', 'overwritten')

        # Allow API users to filter on resources by name and value
        filters = {'key': True, 'value': True}

    class Schema(object):
        key = fields.String(
            description='The unique name of the resource.', enum=CONFIGURATION_KEYS
        )
        value = fields.Custom(
            fields.Any(),
            attribute='key',
            description='The current value of the configuration setting. ',
            io='r',
            formatter=get_configuration,
        )
        description = fields.Custom(
            fields.String(),
            attribute='key',
            description='An explanation of what the configuration setting does.',
            io='r',
            formatter=lambda key: _DEFAULT_CONFIGURATION_STORE[key]['description'],
        )
        defaultValue = fields.Custom(
            fields.Any(),
            attribute='key',
            description='The default value of the setting.',
            io='r',
            formatter=lambda key: _DEFAULT_CONFIGURATION_STORE[key]['value'],
        )

    # Flask Potion requires this to be an instance method.
    # pylint: disable=R0201, E1101
    @ItemRoute.POST(
        '/reset',
        title='Reset configuration',
        description='Resets the value of the configuration to its default.',
        schema=None,
        response_schema=fields.Inline('self'),
        rel='reset',
    )
    def reset_configuration(self, configuration):
        with AuthorizedOperation(
            'edit_resource', 'configuration', configuration.id
        ), Transaction() as transaction:

            key = configuration.key
            default_value = _DEFAULT_CONFIGURATION_STORE[key]['value']
            old_value = get_configuration(key)

            message = (
                'The configuration for \'%s\' is being reset to its default value. '
                'The existing value is \'%s\'. '
                'The new (and default) value is \'%s\'. '
            ) % (key, old_value, default_value)
            g.request_logger.info(message)

            # By setting `overwritten` to False, we are signifying that we want to have the default
            # value apply. For housekeeping reasons, we also set `overwritten_value` back to None.
            configuration.overwritten_value = None
            configuration.overwritten = False
            transaction.add_or_update(configuration, flush=True)

        return configuration

    # Flask Potion requires this to be an instance method.
    # pylint: disable=R0201, E1101
    @ItemRoute.POST(
        '/set',
        title='Set configuration',
        description='Updates the value of the configuration to the value provided.',
        schema=fields.Any(),
        response_schema=fields.Inline('self'),
        rel='set',
    )
    def set_configuration(self, configuration, updated_value):
        with AuthorizedOperation(
            'edit_resource', 'configuration', configuration.id
        ), Transaction() as transaction:
            key = configuration.key
            try:
                old_value = get_configuration(key)
                assert_valid_configuration(key, updated_value)

                message = (
                    'The configuration for \'%s\' is being updated. '
                    'The existing value is \'%s\'. '
                    'The new value is \'%s\'. '
                ) % (key, old_value, updated_value)
                g.request_logger.info(message)
            except Exception as e:
                raise BadRequest(description=e.message)

            configuration.overwritten_value = (updated_value,)
            configuration.overwritten = True
            transaction.add_or_update(configuration, flush=True)

            # NOTE(vedant): I have NO idea why the object is stored by default as an array so we
            # always unpack it and reset the value.
            configuration.overwritten_value = configuration.overwritten_value[0]
            transaction.add_or_update(configuration)

        return configuration


# pylint:disable=W0613
# Suppressing this warning because this is the method signature for signal handlers.

# Flask-Potion signal Handlers for the Configuration API
@before_create.connect_via(ConfigurationResource)
def before_create_new_configuration(sender, item):
    raise MethodNotAllowed()


@before_delete.connect_via(ConfigurationResource)
def before_delete_configuration(sender, item):
    raise MethodNotAllowed()


RESOURCE_TYPES = [ConfigurationResource]
