# pylint: disable=E0611
from urllib.parse import urlparse, parse_qs

from flask import Blueprint, redirect, request
from flask_user import current_user
from web.server.configuration.settings import get_configuration, DEFAULT_URL_KEY
from web.server.data.status_page import get_status_page_data
from web.server.routes.upload import serve_upload
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import authorization_required


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
        return self.template_renderer.render_helper('overview.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('view_query_form', 'site', None)
    def query(self, locale=None):
        aqt_url = f'/{locale}/advanced-query' if locale else '/advanced-query'
        return redirect(aqt_url, 302)

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
        return self.template_renderer.render_helper('notfound.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('view_data_quality', 'site')
    def data_quality(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_quality.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def data_digest(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_digest.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('can_upload_data', 'site')
    def data_upload(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper('data_upload.html', locale)

    @authentication_required(force_authentication=True)
    @authorization_required('can_view_fields_setup', 'site')
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

        # Data Status
        index.add_url_rule('/data-status', 'data_status', self.data_status)
        index.add_url_rule('/<locale>/data-status', 'data_status', self.data_status)

        # Admin App
        index.add_url_rule('/<locale>/admin', 'admin', self.admin)
        index.add_url_rule('/admin', 'admin', self.admin)

        # Alerts
        index.add_url_rule('/alerts', 'alerts', self.alerts)
        index.add_url_rule('/<locale>/alerts', 'alerts', self.alerts)

        # Data Quality
        index.add_url_rule('/data-quality', 'data_quality', self.data_quality)
        index.add_url_rule('/<locale>/data-quality', 'data_quality', self.data_quality)

        # Data Digest
        index.add_url_rule('/data-digest', 'data_digest', self.data_digest)
        index.add_url_rule('/<locale>/data-digest', 'data_digest', self.data_digest)

        # Data Upload Self Serve
        index.add_url_rule('/data-upload', 'data_upload', self.data_upload)
        index.add_url_rule('/<locale>/data-upload', 'data_upload', self.data_upload)
        index.add_url_rule(
            '/uploads/<datestamp>/<path:uploadpath>',
            'uploads',
            self.uploads,
            methods=['GET'],
        )

        # Indicator Setup (Field Setup)
        index.add_url_rule('/indicator-setup', 'indicator_setup', self.field_setup)
        index.add_url_rule(
            '/<locale>/indicator-setup', 'indicator_setup', self.field_setup
        )

        return index
