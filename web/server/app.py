''' Handle initialization and setup of the flask app and all its dependencies.
'''
import os

from typing import Optional

from flask import Flask
from flask_potion import Api
from flask_principal import Principal
from werkzeug.serving import is_running_from_reloader
from werkzeug.contrib.cache import FileSystemCache
from log import LOG

from config.loader import import_configuration_module
from data.query.mock import generate_query_mock_data
from db.druid.datasource import SiteDruidDatasource
from db.druid.query_client import DruidQueryClient_
from db.druid.metadata import DruidMetadata_
from db.druid.config import construct_druid_configuration
from models.alchemy.configuration import Configuration
from web.server.api_setup import initialize_api_models
from web.server.app_base import create_app_base
from web.server.configuration.instance import load_instance_configuration_from_file
from web.server.configuration.flask import FlaskConfiguration
from web.server.configuration.settings import CUR_DATASOURCE_KEY, get_configuration
from web.server.data.data_access import Transaction
from web.server.data.dimension_metadata import DimensionMetadata
from web.server.data.dimension_values import DimensionValuesLookup
from web.server.data.druid_context import DruidApplicationContext
from web.server.data.status import SourceStatus
from web.server.data.time_boundary import DataTimeBoundary
from web.server.data.row_count import RowCountLookup
from web.server.database.setup import (
    initialize_user_manager,
    initialize_database_seed_values,
)
from web.server.errors.error_handlers import register_for_error_events
from web.server.migrations.util import RevisionStatus
from web.server.routes.api import ApiRouter
from web.server.routes.dashboard import DashboardPageRouter
from web.server.routes.data_catalog import DataCatalogPageRouter
from web.server.routes.embedded_query import EmbeddedQueryPageRouter
from web.server.routes.index import PageRouter
from web.server.routes.util import ListConverter
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.query_policy import AuthorizedQueryClient
from web.server.routes.views.locations import LocationHierarchy
from web.server.routes.webpack_dev_proxy import webpack_dev_proxy
from web.server.security.signal_handlers import register_for_signals
from web.server.security.jwt_manager import JWTManager
from web.server.util.dev.static_data_query_client import StaticDataQueryClient
from web.server.util.emails import EmailRenderer
from web.server.util.email_client import MailgunClient
from web.server.util.template_renderer import TemplateRenderer, read_js_version
from web.server.notifications.sms_client import TwilioClient
from web.server.notifications.notification_service import (
    SynchronousNotificationService,
    AsynchronousNotificationService,
)
from web.server.environment import IS_PRODUCTION, OFFLINE_MODE
from web.server.workers import create_celery
from util.error_links import get_error_background_link_msg
from util.offline_mode import (
    MockDruidQueryClient,
    MockDruidMetadata,
    MockGeoExplorerCache,
)
from util.credentials.provider import CredentialProvider


def _register_principals(app):
    # Register for Login/Logout events for Flask-Principal
    principals = Principal(app)
    register_for_signals(app, principals)
    register_for_error_events(app)


def _register_routes(app, register_webpack_proxy=False):
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

    # Register routes
    app.register_blueprint(dashboard_router.generate_blueprint())
    app.register_blueprint(data_catalog_router.generate_blueprint())
    app.register_blueprint(embedded_query_router.generate_blueprint())
    app.register_blueprint(api_router.generate_blueprint())
    app.register_blueprint(main_page_router.generate_blueprint())
    app.page_router = main_page_router

    if register_webpack_proxy:
        app.register_blueprint(webpack_dev_proxy)

    _register_potion_routes(app)


def _register_potion_routes(app):
    potion_api = Api(
        app, decorators=[authentication_required(is_api_request=True)], prefix='/api2'
    )
    initialize_api_models(potion_api)


def _initialize_template_renderer(app):
    javascript_version = read_js_version()
    template_renderer = TemplateRenderer(app.zen_config, javascript_version)
    app.template_renderer = template_renderer


def _initialize_email_renderer(app):
    general_configuration = app.zen_config.general
    ui_configuration = app.zen_config.ui

    default_locale = ui_configuration.DEFAULT_LOCALE
    deployment_abbreviated_name = general_configuration.DEPLOYMENT_NAME
    deployment_full_name = general_configuration.DEPLOYMENT_FULL_NAME
    deployment_base_url = general_configuration.DEPLOYMENT_BASE_URL
    full_platform_name = ui_configuration.FULL_PLATFORM_NAME

    email_renderer = EmailRenderer(
        default_locale,
        deployment_abbreviated_name,
        deployment_full_name,
        deployment_base_url,
        full_platform_name,
    )
    app.email_renderer = email_renderer


def _initialize_app(app, db, is_production):
    _initialize_location_hierarchy(app, db)
    _register_routes(app, not is_production)

    # Setup Flask-User
    initialize_user_manager(app, db)

    # Setup Flask-Principals
    _register_principals(app)


def _create_app_internal(
    flask_config, instance_configuration, zen_configuration_module
):
    # Create and configure the main Flask app. Perform any initializations that
    # should happen before the site goes online.

    # TODO(stephen): Is this the right place for this log to happen?
    is_production = flask_config.IS_PRODUCTION
    if is_production:
        LOG.info('Zenysis is running in PRODUCTION mode')

    (app, db) = create_app_base(flask_config)

    # Only initialize the application if we are on the main processing thread.
    # In debug mode when the app is started directly (not via gunicorn), the
    # werkzeug reloader spawns a child process that gets restarted after a file
    # change. The parent process is then not used.
    if os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn') or (
        app.debug and is_running_from_reloader()
    ):

        # NOTE(vedant): Not sure if this is the best way to accomplish this but it will at least
        # prevent errors from being thrown during server start.
        # NOTE(yitian): Initializing database seed values before app setup
        # so that if new database values are added, app setup won't error.
        initialize_database_seed_values(flask_config.SQLALCHEMY_DATABASE_URI)

        with app.app_context():
            _fail_if_schema_upgrade_needed()
            _initialize_zenysis_module(app, zen_configuration_module)
            _initialize_template_renderer(app)
            _initialize_email_renderer(app)
            _initialize_druid_context(app)
            _initialize_geo_explorer(app)
            _initialize_query_data(app)
            _initialize_notification_service(app, instance_configuration)
            _initialize_simple_cache(app)
            _initialize_jwt_manager(app)
            _initialize_app(app, db, is_production)

    # NOTE(stephen): The last thing we need to do when bootstrapping our app is
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
            'Database schema is out of date. Current database schema version is %s. '
            'Latest version is %s. To upgrade, run: yarn init-db %s'
            % (status.current_revision, status.head_revision, error_msg_link)
        )
        LOG.error(error_message)
        raise EnvironmentError(error_message)
    LOG.info('Database schema version is: %s', status.current_revision)


def _initialize_druid_context(app):
    zen_configuration = app.zen_config
    # Pulling Data from Zen_Config Module
    druid_host = os.getenv('DRUID_HOST', zen_configuration.druid.DRUID_HOST)
    deployment_name = zen_configuration.general.DEPLOYMENT_NAME
    et_date_selection_enabled = zen_configuration.ui.ENABLE_ET_DATE_SELECTION
    data_status_static_info = zen_configuration.data_status.DATA_STATUS_STATIC_INFO
    geo_field_ordering = zen_configuration.aggregation.GEO_FIELD_ORDERING
    dimension_slices = zen_configuration.aggregation.DIMENSION_SLICES
    filter_dimensions = zen_configuration.filters.FILTER_DIMENSIONS
    authorizable_dimensions = zen_configuration.filters.AUTHORIZABLE_DIMENSIONS
    dimension_categories = zen_configuration.aggregation.DIMENSION_CATEGORIES
    dimension_id_map = zen_configuration.aggregation.DIMENSION_ID_MAP

    druid_configuration = construct_druid_configuration(druid_host)
    system_query_client = DruidQueryClient_(druid_configuration)
    druid_metadata = DruidMetadata_(druid_configuration, system_query_client)

    # TODO(vedant, stephen) - Having an environment variable for this seems
    # like an incredibly limiting choice. This should probably be passed into
    # the configuration of the Flask App.
    # pylint: disable=E0110
    if OFFLINE_MODE:
        geo_to_lat_long_field = zen_configuration.aggregation.GEO_TO_LATLNG_FIELD
        map_default_lat_long = zen_configuration.ui.MAP_DEFAULT_LATLNG
        system_query_client = MockDruidQueryClient(
            geo_to_lat_long_field, map_default_lat_long
        )
        druid_metadata = MockDruidMetadata(deployment_name)

    # If an admin selected 'LATEST_DATASOURCE' in the admin app, app will always
    # select the most recent datasource. Otherwise, we will use the datasource
    # the admin selected and default to most recent datasource if datasource
    # doesn't exist.
    datasource_config = get_configuration(CUR_DATASOURCE_KEY)
    if datasource_config in druid_metadata.get_datasources_for_site(deployment_name):
        datasource = SiteDruidDatasource.build(datasource_config)
    else:
        datasource = druid_metadata.get_most_recent_datasource(deployment_name)
        if datasource_config != 'LATEST_DATASOURCE':
            LOG.error('Datasource %s does not exist.', datasource_config)
            with Transaction() as transaction:
                config_database_entity = transaction.find_one_by_fields(
                    Configuration,
                    search_fields={'key': CUR_DATASOURCE_KEY},
                    case_sensitive=False,
                )
                config_database_entity.overwritten_value = 'LATEST_DATASOURCE'
                config_database_entity.overwritten = True
                transaction.add_or_update(config_database_entity, flush=True)

    LOG.info(
        '** Using datasource %s on host %s **',
        datasource.name,
        druid_configuration.base_endpoint(),
    )

    # If we are in development, we can use a special caching query client just for the
    # Druid static data we load each time. This speeds up development reload times.
    use_static_data_cache = not IS_PRODUCTION and not OFFLINE_MODE
    static_data_query_client = (
        system_query_client
        if not use_static_data_cache
        else StaticDataQueryClient(druid_configuration, datasource, druid_metadata)
    )

    dimension_values = DimensionValuesLookup(
        static_data_query_client,
        datasource,
        filter_dimensions,
        dimension_slices,
        authorizable_dimensions,
        geo_field_ordering,
    )
    dimension_values.load_dimensions_from_druid()

    time_boundary = DataTimeBoundary(static_data_query_client, datasource)
    time_boundary.load_time_boundary_from_druid()
    # TODO(stephen): The way we initialize static data is difficult to work with. Some
    # classes are only used during initialization, while others are used throughout the
    # app lifetime. All of them hold a reference to the query client, which makes it
    # difficult to use the static data query client only during app initialization.
    time_boundary.query_client = system_query_client

    status_information = SourceStatus(
        static_data_query_client,
        datasource,
        data_status_static_info,
        et_date_selection_enabled,
    )
    status_information.load_all_status()

    dimension_metadata = DimensionMetadata(static_data_query_client, datasource)
    dimension_metadata.load_dimension_metadata(
        dimension_categories, dimension_id_map, time_boundary.get_full_time_interval()
    )

    # If we are using a caching query client for loading static data, write the cache
    # values (if changed) after we have finished loading.
    if use_static_data_cache:
        static_data_query_client.write_cache()

    druid_context = DruidApplicationContext(
        druid_metadata,
        druid_configuration,
        dimension_values,
        time_boundary,
        status_information,
        RowCountLookup(system_query_client, datasource),
        dimension_metadata,
        datasource,
    )

    app.query_client = AuthorizedQueryClient(system_query_client)
    app.system_query_client = system_query_client
    app.druid_context = druid_context


def _initialize_geo_explorer(app):
    geo_explorer_cache = MockGeoExplorerCache()
    app.explorer_cache = geo_explorer_cache


def _initialize_query_data(app):
    LOG.info('Initializing Query data')
    dimension_values = app.druid_context.dimension_values_lookup

    aggregation_module = app.zen_config.aggregation
    dimension_parents = aggregation_module.DIMENSION_PARENTS
    dimension_categories = aggregation_module.DIMENSION_CATEGORIES
    calendar_settings = aggregation_module.CALENDAR_SETTINGS
    dimension_id_map = aggregation_module.DIMENSION_ID_MAP

    data_sources = app.zen_config.indicators.DATA_SOURCES
    calculations_for_field = app.zen_config.aggregation_rules.CALCULATIONS_FOR_FIELD
    calc_ind_constituents = (
        app.zen_config.calculated_indicators.CALCULATED_INDICATOR_CONSTITUENTS
    )

    app.query_data = generate_query_mock_data(
        dimension_values.get_dimension_value_map(filter_values_by_identity=False),
        data_sources,
        dimension_parents,
        dimension_categories,
        calendar_settings,
        calculations_for_field,
        calc_ind_constituents,
        dimension_id_map,
        app.druid_context.dimension_metadata.sketch_sizes,
        app.druid_context.dimension_metadata.field_metadata,
    )
    LOG.info('Finished initializing Query data')


def _initialize_location_hierarchy(app, db):
    app.location_hierarchy = LocationHierarchy(db)


def _initialize_notification_service(app, instance_configuration):
    mailgun_api_url = 'https://api.mailgun.net/v3/{0}/messages'.format(
        app.config.get('MAILGUN_NAME')
    )
    mailgun_sender = app.config.get('MAILGUN_SENDER')
    mailgun_api_key = app.config.get('MAILGUN_API_KEY')

    mailgun_client = MailgunClient(mailgun_sender, mailgun_api_key, mailgun_api_url)

    sms_client = TwilioClient(
        account_sid=app.config.get('ACCOUNT_SID'),
        auth_token=app.config.get('AUTH_TOKEN'),
        twilio_phone_number=app.config.get('TWILIO_PHONE_NUMBER'),
    )

    notification_service = SynchronousNotificationService(
        email_client=mailgun_client, sms_client=sms_client
    )

    if app.config.get('ASYNC_NOTIFICATIONS_ENABLED'):
        notification_service = AsynchronousNotificationService(
            email_client=mailgun_client,
            sms_client=sms_client,
            celery_worker=create_celery(instance_configuration),
        )
    app.notification_service = notification_service


def _initialize_simple_cache(app):
    cache = FileSystemCache(
        cache_dir=app.config['CACHE_DIR'],
        default_timeout=app.config['CACHE_TIMEOUT_SECONDS'],
    )
    app.cache = cache


def _initialize_jwt_manager(app):
    jwt_manager = JWTManager(
        app.zen_config.general.DEPLOYMENT_FULL_NAME,
        app.config['SECRET_KEY'],
        app.config['JWT_TOKEN_EXPIRATION_TIME'],
    )
    app.jwt_manager = jwt_manager


def _initialize_zenysis_module(app, zen_configuration_module):
    app.zen_config = zen_configuration_module


def create_app(
    flask_config: Optional[FlaskConfiguration] = None,
    instance_config: Optional[dict] = None,
    zenysis_environment: Optional[str] = None,
) -> Flask:
    # If no flask configuration is provided, create a new one and populate secrets by
    # reading the instance config.
    if not flask_config:
        flask_config = FlaskConfiguration()
        instance_config = (
            instance_config
            if instance_config is not None
            else load_instance_configuration_from_file()
        )
        flask_config.apply_instance_config_overrides(instance_config)
        with CredentialProvider(instance_config) as credential_provider:
            flask_config.SQLALCHEMY_DATABASE_URI = credential_provider.get(
                'SQLALCHEMY_DATABASE_URI'
            )
            flask_config.MAILGUN_API_KEY = credential_provider.get('MAILGUN_API_KEY')

    if not zenysis_environment:
        zenysis_environment = os.getenv('ZEN_ENV')

    if not zenysis_environment:
        raise ValueError(
            '`ZEN_ENV` was not set and/or `zenysis_environment` was not specified'
        )

    configuration_module = import_configuration_module()
    app = _create_app_internal(flask_config, instance_config, configuration_module)
    return app
