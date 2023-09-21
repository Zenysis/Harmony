''' Handle initialization and setup of the flask app and all its dependencies.
'''
from datetime import datetime
import queue
from typing import Optional
import os

from flask import Flask, g
from flask_jwt_extended import JWTManager
from flask_potion import Api
from flask_principal import Principal
from werkzeug.serving import is_running_from_reloader
from log import LOG

from data.query.mock import generate_web_query_mock_data
from models.alchemy.query import DruidDatasource
from web.server.api_setup import initialize_api_models
from web.server.app_base import create_app_base, initialize_zenysis_module
from web.server.app_cache import initialize_cache
from web.server.app_druid import initialize_druid_context
from web.server.configuration.flask import FlaskConfiguration
from web.server.data.data_access import Transaction
from web.server.database.setup import (
    initialize_user_manager,
    initialize_database_seed_values,
)
from web.server.errors.error_handlers import register_for_error_events
from web.server.migrations.util import RevisionStatus
from web.server.routes.views.query_policy import AuthorizedQueryClient
from web.server.security.signal_handlers import register_for_signals
from web.server.util.template_renderer import (
    TemplateRenderer,
    read_js_version,
    read_sourcemap,
)
from web.server.workers import create_celery
from web.server.util.error_links import get_error_background_link_msg
from util.flask import build_flask_config


def _register_principals(app):
    # Register for Login/Logout events for Flask-Principal
    # NOTE: we always load identities from login, so we don't need them in session
    # that also helps to avoid session cookie when JWT token is used to access APIs
    principals = Principal(app, use_sessions=False)
    register_for_signals(app, principals)
    register_for_error_events(app)


def _register_routes(app, register_webpack_proxy=False):
    # we don't do these imports on the top-level because
    # celery must be initialized before any celery tasks are being
    # imported
    # pylint: disable=import-outside-toplevel
    from web.server.routes.api import ApiRouter
    from web.server.routes.dashboard import DashboardPageRouter
    from web.server.routes.data_catalog import DataCatalogPageRouter
    from web.server.routes.embedded_query import EmbeddedQueryPageRouter
    from web.server.routes.index import PageRouter
    from web.server.routes.page_renderer import PageRendererRouter
    from web.server.routes.graphql_api import GraphqlPageRouter
    from web.server.routes.user_authentication import UserAuthenticationRouter
    from web.server.routes.util import ListConverter
    from web.server.routes.webpack_dev_proxy import webpack_dev_proxy

    # Register custom route converters first since some routes might
    # depend on their existance
    ListConverter.register_converter(app)

    default_locale = app.zen_config.ui.DEFAULT_LOCALE
    deployment_name = app.zen_config.general.DEPLOYMENT_NAME
    indicator_group_definitions = app.zen_config.indicators.GROUP_DEFINITIONS

    template_renderer = app.template_renderer
    main_page_router = PageRouter(
        template_renderer, default_locale, deployment_name, indicator_group_definitions
    )
    dashboard_router = DashboardPageRouter(template_renderer, default_locale)
    data_catalog_router = DataCatalogPageRouter(template_renderer, default_locale)
    embedded_query_router = EmbeddedQueryPageRouter(template_renderer, default_locale)
    api_router = ApiRouter(template_renderer, app.zen_config)
    page_renderer_router = PageRendererRouter()
    graphql_api_router = GraphqlPageRouter()
    user_authentication_router = UserAuthenticationRouter(
        template_renderer, default_locale
    )

    # Register routes
    app.register_blueprint(dashboard_router.generate_blueprint())
    app.register_blueprint(data_catalog_router.generate_blueprint())
    app.register_blueprint(embedded_query_router.generate_blueprint())
    app.register_blueprint(api_router.generate_blueprint())
    app.register_blueprint(page_renderer_router.generate_blueprint())
    app.register_blueprint(graphql_api_router.generate_blueprint())
    app.register_blueprint(main_page_router.generate_blueprint())
    app.register_blueprint(user_authentication_router.generate_blueprint())
    app.page_router = main_page_router
    app.user_authentication_router = user_authentication_router

    if register_webpack_proxy:
        app.register_blueprint(webpack_dev_proxy)

    _register_potion_routes(app)


def _register_potion_routes(app):
    # pylint: disable=import-outside-toplevel
    from web.server.routes.views.authentication import authentication_required

    potion_api = Api(
        app, decorators=[authentication_required(is_api_request=True)], prefix='/api2'
    )
    initialize_api_models(potion_api)


def _initialize_template_renderer(app):
    javascript_version = read_js_version()
    sourcemap = read_sourcemap()
    template_renderer = TemplateRenderer(app.zen_config, javascript_version, sourcemap)
    app.template_renderer = template_renderer


def _initialize_email_renderer(app):
    # pylint: disable=import-outside-toplevel
    from web.server.util.emails import EmailRenderer

    general_configuration = app.zen_config.general
    ui_configuration = app.zen_config.ui

    default_locale = ui_configuration.DEFAULT_LOCALE
    deployment_abbreviated_name = general_configuration.DEPLOYMENT_NAME
    deployment_full_name = general_configuration.DEPLOYMENT_FULL_NAME
    deployment_short_name = general_configuration.DEPLOYMENT_SHORT_NAME
    deployment_base_url = general_configuration.DEPLOYMENT_BASE_URL
    full_platform_name = ui_configuration.FULL_PLATFORM_NAME

    email_renderer = EmailRenderer(
        default_locale,
        deployment_abbreviated_name,
        deployment_full_name,
        deployment_short_name,
        deployment_base_url,
        full_platform_name,
    )
    app.email_renderer = email_renderer


def _initialize_app(app, db, is_production):
    _register_routes(app, not is_production)

    # Setup Flask-User
    initialize_user_manager(app, db)

    # Setup Flask-Principals
    _register_principals(app)


def _maybe_update_db_druid_metadata(
    app: Flask, is_production: bool, force_druid_db_update: bool
):
    # pylint: disable=import-outside-toplevel
    from db.druid.update_db_datasource import update_db_datasource

    is_metadata_updated = app.cache.get('druid-metadata-last-updated')

    # if there are no datasources in the db web server just won't start
    # so to avoid complicated intetwines between its first start and first
    # pipeline run make sure it gets populated
    with Transaction() as transaction:
        db_is_empty = not transaction.run_raw().query(DruidDatasource.id).first()
        force_druid_db_update = force_druid_db_update or db_is_empty

    if (is_production or is_metadata_updated) and not force_druid_db_update:
        return
    update_db_datasource(skip_grouped_sketch_sizes=True)
    # NOTE: update metadata every 12 hours on server restart for devs comfort
    app.cache.set('druid-metadata-last-updated', datetime.now(), timeout=12 * 3600)


def _initialize_authorized_druid_client(app):
    app.query_client = AuthorizedQueryClient(app.query_client)


def _create_app_internal(
    flask_config, instance_configuration, skip_db_check, force_druid_db_update
):
    # Create and configure the main Flask app. Perform any initializations that
    # should happen before the site goes online.

    # TODO: Is this the right place for this log to happen?
    is_production = flask_config.IS_PRODUCTION
    if is_production:
        LOG.info('Zenysis is running in PRODUCTION mode')

    (app, db) = create_app_base(flask_config)
    initialize_zenysis_module(app)

    # Only initialize the application if we are on the main processing thread.
    # In debug mode when the app is started directly (not via gunicorn), the
    # werkzeug reloader spawns a child process that gets restarted after a file
    # change. The parent process is then not used.
    if os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn') or (
        app.debug and is_running_from_reloader()
    ):
        # NOTE: Not sure if this is the best way to accomplish this but it will at least
        # prevent errors from being thrown during server start.
        # NOTE: Initializing database seed values before app setup
        # so that if new database values are added, app setup won't error.
        initialize_database_seed_values(flask_config.SQLALCHEMY_DATABASE_URI)

        with app.app_context():
            initialize_cache(app)
            if not skip_db_check:
                _fail_if_schema_upgrade_needed()
            _maybe_update_db_druid_metadata(app, is_production, force_druid_db_update)
            _initialize_template_renderer(app)
            _initialize_email_renderer(app)
            initialize_druid_context(app, datasource_config=None)
            _initialize_authorized_druid_client(app)
            _initialize_query_data(app)
            _initialize_celery(app, instance_configuration)
            _initialize_notification_service(app, instance_configuration)
            initialize_jwt_manager(app)
            _initialize_app(app, db, is_production)

    # NOTE: The last thing we need to do when bootstrapping our app is
    # dispose of the DB connection used to initialize the app. This connection
    # *cannot* be shared across threads and disposing it prevents that from
    # happening. After disposal, each thread will have a new connection
    # established when they first access the DB.
    with app.app_context():
        db.engine.dispose()
    return app


def _fail_if_schema_upgrade_needed():
    status = RevisionStatus()
    if status.head_revision != status.current_revision:
        error_msg_link = get_error_background_link_msg('DatabaseRevisionStatusError')
        error_message = (
            f'Database schema is out of date. Current database schema '
            f'version is {status.current_revision}. Latest version is {status.head_revision}. '
            'To skip this check, add the --skip-db-check flag. '
            f'To upgrade, run: yarn init-db {error_msg_link}'
        )
        LOG.error(error_message)
        raise EnvironmentError(error_message)
    LOG.info('Database schema version is: %s', status.current_revision)


def _initialize_query_data(app):
    LOG.info('Initializing Query data')
    aggregation_module = app.zen_config.aggregation
    calendar_settings = aggregation_module.CALENDAR_SETTINGS
    app.query_data = generate_web_query_mock_data(calendar_settings)
    LOG.info('Finished initializing Query data')


def _initialize_celery(app, instance_configuration):
    # NOTE: flask does not use thread pool thus celery's mechanisms to reuse
    # instances and make them thread-safe won't work well. To work around that we
    # keep a queue of celery instances and install one of the previously created
    # at each request simulating what celery was intended to do with usual pooling approach.

    celery_queue = queue.Queue()  # NOTE: should we limit the max size of this?

    celery_queue.put(create_celery(instance_configuration))

    @app.before_request
    def create_celery_for_request():
        try:
            celery = celery_queue.get(block=False)
        except queue.Empty:
            celery = create_celery(instance_configuration)
        celery.set_current()
        g.celery_app = celery

    @app.teardown_request
    def release_celery_from_request(_request):
        if hasattr(g, 'celery_app'):
            celery_queue.put(g.celery_app)


def _initialize_notification_service(app, _instance_configuration):
    # pylint: disable=import-outside-toplevel
    from web.server.notifications.notification_service import NotificationService

    notification_service = NotificationService(
        sms_client_kwargs={
            'account_sid': app.config.get('ACCOUNT_SID'),
            'auth_token': app.config.get('AUTH_TOKEN'),
            'twilio_phone_number': app.config.get('TWILIO_PHONE_NUMBER'),
        },
        email_client_kwargs=app.config.get('SMTP_CONFIG'),
    )
    app.notification_service = notification_service


def initialize_jwt_manager(app):
    JWTManager(app)


def create_app(
    flask_config: Optional[FlaskConfiguration] = None,
    instance_config: Optional[dict] = None,
    zenysis_environment: Optional[str] = None,
    skip_db_check: bool = False,
    force_druid_db_update: bool = False,
) -> Flask:
    if not zenysis_environment:
        zenysis_environment = os.getenv('ZEN_ENV')

    if not zenysis_environment:
        raise ValueError(
            '`ZEN_ENV` was not set and/or `zenysis_environment` was not specified'
        )

    # If no flask configuration is provided, create a new one and populate secrets by
    # reading the instance config.
    flask_config = flask_config or build_flask_config(zenysis_environment)

    app = _create_app_internal(
        flask_config, instance_config, skip_db_check, force_druid_db_update
    )
    return app
