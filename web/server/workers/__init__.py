import os

from celery import Celery
from sqlalchemy import create_engine

from web.server.configuration.celery import CeleryConfig
from web.server.configuration.instance import load_instance_configuration_from_file
from util.credentials.provider import CredentialProvider
from db.postgres.common import get_db_uri


def create_celery(instance_configuration=None):
    '''Create a new celery application instance
    '''
    deployment_code = os.getenv('ZEN_ENV')
    instance_configuration = (
        instance_configuration or load_instance_configuration_from_file()
    )
    config = CeleryConfig()
    with CredentialProvider(instance_configuration) as provider:
        database_uri = provider.get('SQLALCHEMY_DATABASE_URI', get_db_uri(deployment_code))

    engine = create_engine(
        database_uri,
        pool_size=2,
        max_overflow=0,
        connect_args={'application_name': 'worker'},
    )
    celery = Celery(__name__, include=config.TASKS_LIST)
    celery.config_from_object(config)
    celery.conf['engine'] = engine

    return celery
