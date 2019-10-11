# pylint: disable=E0611
from builtins import object
from flask import Blueprint, current_app, jsonify, redirect, request

from web.server.configuration.settings import get_configuration, DEFAULT_URL_KEY
from web.server.data.alerts import get_alert_options
from web.server.data.case_management import get_case_management_options
from web.server.data.data_upload import get_data_upload_app_options
from web.server.data.status_page import get_status_page_data
from web.server.routes.upload import handle_data_upload, serve_upload
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import authorization_required
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID


class PageRouter(object):
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

    @authentication_required()
    def overview(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('overview.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('view_query_form', 'site', ROOT_SITE_RESOURCE_ID)
    def query(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('query.html', locale)

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
            'dataUploadAppOptions': get_data_upload_app_options(
                self.deployment_name, self.indicator_group_definitions
            )
        }
        return self.template_renderer.render_helper(
            'upload.html', locale, lightweight_js_only=True, pass_to_js=js
        )

    @authorization_required('view_admin_page', 'site', ROOT_SITE_RESOURCE_ID)
    def uploads(self, datestamp, uploadpath):
        return serve_upload(datestamp, uploadpath)

    @authentication_required(force_authentication=True)
    def data_status(self, locale=None):
        locale = locale or self.default_locale
        pass_to_template = {'source_status': get_status_page_data()}
        return self.template_renderer.render_helper(
            'data_status.html',
            locale=locale,
            pass_to_template=pass_to_template,
            lightweight_js_only=True,
        )

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site', ROOT_SITE_RESOURCE_ID)
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
    def advanced_query(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('advanced_query.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('create_resource', 'alert')
    def alerts(self, locale=None):
        locale = locale or self.default_locale
        # If alerts are not enabled for deployment, show not found page
        if not get_alert_options():
            return self.template_renderer.render_helper('notfound.html', locale)
        return self.template_renderer.render_helper('alerts.html', locale)

    @authentication_required(force_authentication=True)
    def case_management(self, locale=None):
        locale = locale or self.default_locale
        # Only enable the case management tool for MZ for now
        cma_options = get_case_management_options(self.deployment_name)
        enable_cma = cma_options['showInNavbar']
        if not enable_cma:
            return self.template_renderer.render_helper('notfound.html', locale)
        return self.template_renderer.render_helper('case_management.html', locale)

    @authentication_required(force_authentication=True)
    def data_quality(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_quality.html', locale)

    @authentication_required()
    def unauthorized(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper(
            'unauthorized.html', locale, lightweight_js_only=True
        )

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

        # Data Upload
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

        # Unauthorized Page
        index.add_url_rule('/unauthorized', 'unauthorized', self.unauthorized)
        index.add_url_rule('/<locale>/unauthorized', 'unauthorized', self.unauthorized)

        return index
