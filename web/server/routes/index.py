# pylint: disable=E0611
from http.client import NOT_FOUND
from urllib.parse import urlparse, parse_qs

from flask import Blueprint, abort, jsonify, redirect, request
from flask_user import current_user

from web.server.configuration.settings import get_configuration, DEFAULT_URL_KEY
from web.server.data.alerts import is_alert_enabled
from web.server.data.case_management import get_case_management_options
from web.server.data.data_upload import get_raw_data_upload_app_options
from web.server.data.status_page import get_status_page_data
from web.server.routes.upload import handle_data_upload, serve_upload
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import authorization_required
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID
from web.server.util.util import is_zenysis_user


class PageRouter:
    def __init__(
        self,
        template_renderer,
        default_locale,
        deployment_name,
        indicator_group_definitions,
    ):
        self.template_renderer = template_renderer
        self.default_locale = default_locale
        self.deployment_name = deployment_name
        self.indicator_group_definitions = indicator_group_definitions

    @authentication_required()
    def homepage(self):
        return redirect(get_configuration(DEFAULT_URL_KEY))

    @authentication_required(force_authentication=True)
    def overview(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper(
            'overview.html',
            locale,
        )

    @authentication_required(force_authentication=True)
    @authorization_required('view_query_form', 'site', None)
    def query(self, locale=None):
        # HACK(stephen): Redirect all users attempting to go to SQT except for the
        # ET deployment.
        if self.deployment_name != 'et':
            aqt_url = f'/{locale}/advanced-query' if locale else '/advanced-query'
            return redirect(aqt_url, 302)

        locale = locale or self.default_locale
        return self.template_renderer.render_helper(
            'query.html',
            locale,
        )

    @authentication_required(force_authentication=True)
    def geo_explorer(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('geo_explorer.html', locale)

    @authentication_required(force_authentication=True)
    def upload_data(self, locale=None):
        locale = locale or self.default_locale
        if request.method == 'POST':
            uploads = request.files.getlist('files[]')
            category = request.form.get('category')
            if handle_data_upload(category, uploads):
                return jsonify({'success': True})
            return jsonify({'success': False})

        js = {
            'dataUploadAppOptions': get_raw_data_upload_app_options(
                self.deployment_name, self.indicator_group_definitions
            )
        }
        return self.template_renderer.render_helper(
            'upload.html', locale, pass_to_js=js
        )

    @authorization_required('view_admin_page', 'site')
    def uploads(self, datestamp, uploadpath):
        return serve_upload(datestamp, uploadpath)

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def data_status(self, locale=None):
        locale = locale or self.default_locale
        pass_to_template = {'source_status': get_status_page_data()}
        return self.template_renderer.render_helper(
            'data_status.html',
            locale=locale,
            pass_to_template=pass_to_template,
        )

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def admin(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('admin.html', locale)

    @authentication_required()
    def location_admin(self, locale=None):
        return self.template_renderer.render_helper('location_admin.html', locale)

    @authentication_required()
    def review_admin(self, locale=None):
        return self.template_renderer.render_helper('review_admin.html', locale)

    @authentication_required()
    def mfr_explorer(self, locale=None):
        return self.template_renderer.render_helper('mfr_explorer.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('view_query_form', 'site', None)
    def advanced_query(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('advanced_query.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('create_resource', 'alert')
    def alerts(self, locale=None):
        locale = locale or self.default_locale
        # If alerts are not enabled for deployment, show not found page
        if not is_alert_enabled():
            return self.template_renderer.render_helper('notfound.html', locale)
        return self.template_renderer.render_helper(
            'alerts.html',
            locale,
        )

    @authentication_required(force_authentication=True)
    @authorization_required('view_case_management', 'site')
    def case_management(self, locale=None):
        locale = locale or self.default_locale
        cma_options = get_case_management_options(self.deployment_name)

        if not cma_options['appEnabled']:
            return self.template_renderer.render_helper('notfound.html', locale)

        home_page_dash_slug = cma_options['homePageDashboardSlug']
        url_args = parse_qs(urlparse(request.full_path).query)

        # if there is a home page dashboard slug, AND we're not querying for
        # any specific case type (i.e. we're not trying to access a URL of
        # the form /case-management?caseType=someCase&arg=someArg, then we
        # should redirect to the dashboard page. Otherwise, render the expected
        # case management pageg.
        if home_page_dash_slug and 'caseType' not in url_args:
            return redirect(f'/dashboard/{home_page_dash_slug}')

        return self.template_renderer.render_helper(
            'case_management.html',
            locale,
        )

    @authentication_required(force_authentication=True)
    @authorization_required('view_data_quality', 'site')
    def data_quality(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_quality.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def data_digest(self, locale=None):
        if not is_zenysis_user(current_user.username):
            return redirect('/unauthorized')

        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_digest.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('can_upload_data', 'site')
    def data_upload(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_upload.html', locale)

    # TODO(david): Add required authoriztion to view entity matching page before
    # launch
    @authentication_required(force_authentication=True)
    def entity_matching(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('entity_matching.html', locale)

    @authentication_required()
    def unauthorized(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper(
            'unauthorized.html',
            locale,
        )

    @authentication_required(force_authentication=True)
    def geo_mapping(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('geo_mapping.html', locale)

    @authentication_required(force_authentication=True)
    def field_setup(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('field_setup.html', locale)

    def generate_blueprint(self):
        index = Blueprint('index', __name__, template_folder='templates')
        # Index Page
        index.add_url_rule('/', 'homepage', self.homepage)

        # Overview Page
        index.add_url_rule('/overview', 'overview', self.overview)
        index.add_url_rule('/<locale>/overview', 'overview', self.overview)

        # Simple Query Tool
        index.add_url_rule('/query', 'query', self.query)
        index.add_url_rule('/<locale>/query', 'query', self.query)

        # Advanced Query Tool
        index.add_url_rule('/advanced-query', 'advanced_query', self.advanced_query)
        index.add_url_rule(
            '/<locale>/advanced-query', 'advanced_query', self.advanced_query
        )

        # GeoExplorer
        index.add_url_rule('/geo-explorer', 'geo_explorer', self.geo_explorer)
        index.add_url_rule('/<locale>/geo-explorer', 'geo_explorer', self.geo_explorer)

        # Raw Data Upload
        # TODO(sophie, anyone): deprecate
        index.add_url_rule(
            '/upload-data', 'upload_data', self.upload_data, methods=['GET', 'POST']
        )
        index.add_url_rule(
            '/<locale>/upload-data',
            'upload_data',
            self.upload_data,
            methods=['GET', 'POST'],
        )
        index.add_url_rule(
            '/uploads/<datestamp>/<path:uploadpath>',
            'uploads',
            self.uploads,
            methods=['GET'],
        )

        # Data Status
        index.add_url_rule('/data-status', 'data_status', self.data_status)
        index.add_url_rule('/<locale>/data-status', 'data_status', self.data_status)

        # Admin App
        index.add_url_rule('/<locale>/admin', 'admin', self.admin)
        index.add_url_rule('/admin', 'admin', self.admin)

        # Location Admin
        index.add_url_rule('/location_admin', 'location_admin', self.location_admin)
        index.add_url_rule(
            '/<locale>/location_admin', 'location_admin', self.location_admin
        )

        index.add_url_rule('/review_admin', 'review_admin', self.review_admin)
        index.add_url_rule('/<locale>/review_admin', 'review_admin', self.review_admin)

        index.add_url_rule('/mfr_explorer', 'mfr_explorer', self.mfr_explorer)
        index.add_url_rule('/<locale>/mfr_explorer', 'mfr_explorer', self.mfr_explorer)

        # Alerts
        index.add_url_rule('/alerts', 'alerts', self.alerts)
        index.add_url_rule('/<locale>/alerts', 'alerts', self.alerts)

        # Case Management
        index.add_url_rule('/case-management', 'case_management', self.case_management)
        index.add_url_rule(
            '/<locale>/case-management', 'case_management', self.case_management
        )

        # Data Quality
        index.add_url_rule('/data-quality', 'data_quality', self.data_quality)
        index.add_url_rule('/<locale>/data-quality', 'data_quality', self.data_quality)

        # Data Digest
        index.add_url_rule('/data-digest', 'data_digest', self.data_digest)
        index.add_url_rule('/<locale>/data-digest', 'data_digest', self.data_digest)

        # Data Upload Self Serve
        index.add_url_rule('/data-upload', 'data_upload', self.data_upload)
        index.add_url_rule('/<locale>/data-upload', 'data_upload', self.data_upload)

        # Unauthorized Page
        index.add_url_rule('/unauthorized', 'unauthorized', self.unauthorized)
        index.add_url_rule('/<locale>/unauthorized', 'unauthorized', self.unauthorized)

        # Geo Mapping
        index.add_url_rule('/geo-mapping', 'geo_mapping', self.geo_mapping)
        index.add_url_rule('/<locale>/geo-mapping', 'geo_mapping', self.geo_mapping)

        # Entity Matching
        index.add_url_rule('/entity-matching', 'entity_matching', self.entity_matching)
        index.add_url_rule(
            '/<locale>/entity-matching', 'entity_matching', self.entity_matching
        )

        # Field Setup
        index.add_url_rule('/field-setup', 'field_setup', self.field_setup)
        index.add_url_rule('/<locale>/field-setup', 'field_setup', self.field_setup)

        return index
