'''A module containing initialization logic for all Server APIs.
'''

from web.server.api.api_models import list_all_resource_types
from web.server.security.signal_handlers import install_potion_signal_handlers
from web.server.api.authentication_api_models import AuthenticationResource


def initialize_api_models(api):
    '''Registers all the Potion Resource Classes with Flask-Potion and adds
    the necessary AuthZ checks around CRUD operations on those resources.

    Parameters
    ----------
    api : flask_potion.Api
        The Flask-Potion extension object that is tied to the Flask application.
    '''
    for resource in list_all_resource_types():
        # Add the Resource to the API
        api.add_resource(resource)

        # Install the Signal Handlers for the Potion Resource
        install_potion_signal_handlers(resource)

    # After adding all other resources, add AuthenticationResource without the auth decorator
    api.decorators = []
    api.add_resource(AuthenticationResource)
