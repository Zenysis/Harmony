''' Handle initialization and setup of the flask app and all its dependencies.
'''
import os
import flask_admin

from flask import Flask
from flask_migrate import Migrate
from flask_potion import Api
from flask_principal import Principal
from pylib.file.file_utils import FileUtils
from werkzeug.serving import is_running_from_reloader
from werkzeug.contrib.cache import FileSystemCache

from config.loader import import_configuration_module
from data.wip.mock import generate_aqt_mock_data
from db.druid.datasource import SiteDruidDatasource
from db.druid.query_client import DruidQueryClient_
from db.druid.metadata import DruidMetadata_, DruidMetadata
from db.druid.config import construct_druid_configuration
from log import LOG

# These are required by Flask-Migrate for auto-detection of schema changes
# pylint: disable=W0611
from models.alchemy.alerts import AlertDefinition, AlertNotification
from models.alchemy.configuration import Configuration
from models.alchemy.case_management import Case, CaseEvent
from models.alchemy.history import HistoryRecord
from models.alchemy.dashboard import Dashboard
from models.alchemy.indicator import Indicators, IndicatorGroups
from models.alchemy.location import (
    CanonicalLocations,
    LocationTypes,
    MappedLocations,
    SuggestedMatches,
    UnmatchedLocations,
    UserMatches,
    FlaggedLocations,
)
from models.alchemy.security_group import Group, GroupRoles, GroupUsers
from models.alchemy.permission import (
    Permission,
    Resource,
    ResourceType,
    Role,
    RolePermissions,
)
from models.alchemy.query_policy import QueryPolicy
from models.alchemy.user import User, UserRoles
from models.alchemy.user_query_session import UserQuerySession
from web.server.api_setup import initialize_api_models
from web.server.app_db import create_db
from web.server.configuration.instance import load_instance_configuration_from_file
from web.server.configuration.flask import FlaskConfiguration
from web.server.configuration.settings import CUR_DATASOURCE_KEY, get_configuration
from web.server.data.data_access import Transaction
from web.server.data.dimension_metadata import DimensionMetadata
from web.server.data.dimension_values import DimensionValuesLookup
from web.server.data.druid_context import DruidApplicationContext
from web.server.data.explorer import GeoExplorerCache
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
from web.server.routes.index import PageRouter
from web.server.routes.page_renderer import PageRendererRouter
from web.server.routes.util import ListConverter
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.flask_admin_view import ZenysisModelView
from web.server.routes.views.query_policy import AuthorizedQueryClient
from web.server.routes.views.locations import LocationHierachy
from web.server.routes.webpack_dev_proxy import webpack_dev_proxy
from web.server.security.signal_handlers import register_for_signals
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
    geo_dashboard_class = app.zen_config.dashboard.GeoDashboardConfig
    field_dashboard_class = app.zen_config.dashboard.FieldDashboardConfig
    indicator_group_definitions = app.zen_config.indicators.GROUP_DEFINITIONS

    template_renderer = app.template_renderer
    main_page_router = PageRouter(
        template_renderer, default_locale, deployment_name, indicator_group_definitions
    )
    dashboard_router = DashboardPageRouter(
        template_renderer, default_locale, geo_dashboard_class, field_dashboard_class
    )
    api_router = ApiRouter(template_renderer, app.zen_config)
    page_renderer_router = PageRendererRouter()

    # Register routes
    app.register_blueprint(dashboard_router.generate_blueprint())
    app.register_blueprint(api_router.generate_blueprint())
    app.register_blueprint(page_renderer_router.generate_blueprint())
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


def _intitialize_flask_admin(app, db):
    if not IS_PRODUCTION:
        admin = flask_admin.Admin(
            app,
            name=app.zen_config.general.DEPLOYMENT_FULL_NAME,
            template_mode='bootstrap3',
            url='/flask-admin',
        )
        # Add views
        admin.add_view(ZenysisModelView(IndicatorGroups, db.session))
        admin.add_view(ZenysisModelView(Indicators, db.session))


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
    _intitialize_flask_admin(app, db)
    _initialize_location_hierarchy(app)
    _register_routes(app, not is_production)

    # Setup Flask-User
    initialize_user_manager(app, db)

    # Setup Flask-Principals
    _register_principals(app)


def _create_app_internal(
    db, flask_config, instance_configuration, zen_configuration_module
):
    # Create and configure the main Flask app. Perform any initializations that
    # should happen before the site goes online.

    # TODO(stephen): Is this the right place for this log to happen?
    is_production = flask_config.IS_PRODUCTION
    if is_production:
        LOG.info('Zenysis is running in PRODUCTION mode')

    app = Flask(__name__, static_folder='../public', static_url_path='')

    # Misc app setup and settings.
    app.secret_key = flask_config.SECRET_KEY
    app.debug = not is_production
    app.config.from_object(flask_config)

    # Register the app with our db reference
    db.init_app(app)

    # Handle migrations before anyone uses the DB
    migrations_directory = FileUtils.GetAbsPathForFile('web/server/migrations')
    Migrate(app, db, migrations_directory)

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
            _initialize_aqt_data(app)
            _initialize_notification_service(app, instance_configuration)
            _initialize_simple_cache(app)
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
        error_message = (
            'Database schema is out of date. Current database schema version is %s. '
            'Latest version is %s. To upgrade, run: scripts/upgrade_database.sh'
            % (status.current_revision, status.head_revision)
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

    LOG.info('** Using datasource %s **', datasource.name)

    dimension_values = DimensionValuesLookup(
        system_query_client,
        datasource,
        filter_dimensions,
        dimension_slices,
        authorizable_dimensions,
        geo_field_ordering,
    )
    dimension_values.load_dimensions_from_druid()

    time_boundary = DataTimeBoundary(system_query_client, datasource)
    time_boundary.load_time_boundary_from_druid()

    row_count_lookup = RowCountLookup(system_query_client, datasource)

    status_information = SourceStatus(
        system_query_client,
        datasource,
        data_status_static_info,
        et_date_selection_enabled,
    )
    status_information.load_all_status()

    dimension_metadata = DimensionMetadata(system_query_client, datasource)
    dimension_metadata.load_dimension_metadata(
        dimension_categories, dimension_id_map, time_boundary.get_full_time_interval()
    )

    druid_context = DruidApplicationContext(
        druid_metadata,
        druid_configuration,
        dimension_values,
        time_boundary,
        status_information,
        row_count_lookup,
        dimension_metadata,
        datasource,
    )

    app.query_client = AuthorizedQueryClient(system_query_client)
    app.system_query_client = system_query_client
    app.druid_context = druid_context


def _initialize_geo_explorer(app):
    geo_explorer_cache = MockGeoExplorerCache()
    app.explorer_cache = geo_explorer_cache


def _initialize_aqt_data(app):
    dimension_values = app.druid_context.dimension_values_lookup

    aggregation_module = app.zen_config.aggregation
    dimension_parents = aggregation_module.DIMENSION_PARENTS
    dimension_categories = aggregation_module.DIMENSION_CATEGORIES
    enabled_granularities = aggregation_module.ENABLED_GRANULARITIES
    dimension_id_map = aggregation_module.DIMENSION_ID_MAP

    data_sources = app.zen_config.indicators.DATA_SOURCES
    calculations_for_field = app.zen_config.aggregation_rules.CALCULATIONS_FOR_FIELD

    app.aqt_data = generate_aqt_mock_data(
        dimension_values.get_dimension_value_map(filter_values_by_identity=False),
        data_sources,
        dimension_parents,
        dimension_categories,
        enabled_granularities,
        calculations_for_field,
        dimension_id_map,
        app.druid_context.dimension_metadata.sketch_sizes,
    )


def _initialize_location_hierarchy(app):
    app.location_hierarchy = LocationHierachy()


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


def _initialize_zenysis_module(app, zen_configuration_module):
    app.zen_config = zen_configuration_module


def create_app(
    flask_configuration=None, instance_configuration=None, zenysis_environment=None
):
    flask_configuration = flask_configuration or FlaskConfiguration()
    instance_configuration = load_instance_configuration_from_file()
    with CredentialProvider(instance_configuration) as credential_provider:
        flask_configuration.SQLALCHEMY_DATABASE_URI = credential_provider.get(
            'SQLALCHEMY_DATABASE_URI'
        )
        flask_configuration.MAILGUN_API_KEY = credential_provider.get('MAILGUN_API_KEY')

    flask_configuration.ASYNC_NOTIFICATIONS_ENABLED = instance_configuration.get(
        'async_notifications_enabled', False
    )
    if not zenysis_environment:
        zenysis_environment = os.getenv('ZEN_ENV')

    if not zenysis_environment:
        raise ValueError(
            '`ZEN_ENV` was not set and/or `zenysis_environment` was not specified'
        )

    db = create_db()
    configuration_module = import_configuration_module()
    app = _create_app_internal(
        db, flask_configuration, instance_configuration, configuration_module
    )
    return app
