import os
from typing import Optional

from web.server.configuration.flask import FlaskConfiguration
from web.server.configuration.instance import load_instance_configuration_from_file
from util.credentials.provider import CredentialProvider


def build_flask_config(
    environment: str, instance_config: Optional[dict] = None
) -> FlaskConfiguration:
    flask_config = FlaskConfiguration()
    instance_config = (
        instance_config
        if instance_config is not None
        else load_instance_configuration_from_file()
    )
    flask_config.apply_instance_config_overrides(instance_config)
    with CredentialProvider(instance_config) as credential_provider:
        flask_config.SQLALCHEMY_DATABASE_URI = db_uri = (
            credential_provider.get('SQLALCHEMY_DATABASE_URI')
            or os.environ.get('DATABASE_URL')
            or f'postgresql://{os.environ["POSTGRES_USER"]}:@{os.environ["POSTGRES_HOST"]}/{environment}-local'
        )

    # NOTE: It's not very safe to manipulate Python's in-memory environment
    # variables dict, but I wanted to make sure that any downstream modules that
    # rely on the DATABASE_URL environment variable get the correct one.
    os.environ['DATABASE_URL'] = db_uri
    return flask_config
