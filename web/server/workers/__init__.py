from celery import current_app, Celery
from celery.signals import worker_process_init
from flask import current_app as flask_app
from sqlalchemy import create_engine

import config as zen_config
from web.server.configuration.celery import CeleryConfig
from web.server.configuration.instance import load_instance_configuration_from_file
from util.credentials.provider import CredentialProvider


@worker_process_init.connect
def init(**_kwargs):
    # pylint: disable=import-outside-toplevel
    from web.server.app import (
        create_app,
        initialize_cache,
        initialize_jwt_manager,
    )

    try:
        getattr(flask_app, '_', None)
        current_app.conf['flask_app'] = flask_app
    except RuntimeError:
        app = current_app.conf['flask_app'] = create_app()
        with app.app_context():
            initialize_cache(app)
            initialize_jwt_manager(app)


config = CeleryConfig()
celery_app = Celery(__name__, include=config.TASKS_LIST)
celery_app.config_from_object(config)


def create_celery(instance_configuration=None):
    '''Create a new celery application instance'''
    instance_configuration = (
        instance_configuration or load_instance_configuration_from_file()
    )
    config = CeleryConfig()

    with CredentialProvider(instance_configuration) as provider:
        config.SQLALCHEMY_DATABASE_URI = provider.get('SQLALCHEMY_DATABASE_URI')

    # NOTE: there's no need in engine any more, flask_app can be used instead
    engine = create_engine(
        config.SQLALCHEMY_DATABASE_URI,
        pool_size=2,
        max_overflow=0,
        connect_args={'application_name': 'worker'},
    )
    celery_app.conf['engine'] = engine
    return celery_app
