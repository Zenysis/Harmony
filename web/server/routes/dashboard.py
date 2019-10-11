from future import standard_library

standard_library.install_aliases()
from builtins import object
from http.client import NOT_FOUND

from flask import Blueprint, request, redirect, make_response, abort
from werkzeug.exceptions import BadRequest, Unauthorized

from config.dashboard_base import EMPTY_SPECIFICATION
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.dashboard import get_dashboard


class DashboardPageRouter(object):
    def __init__(
        self,
        template_renderer,
        default_locale,
        geo_dashboard_class,
        field_dashboard_class,
    ):
        self.template_renderer = template_renderer
        self.default_locale = default_locale
        self.geo_dashboard_class = geo_dashboard_class
        self.field_dashboard_class = field_dashboard_class

    @authentication_required()
    def geo_dashboard(self, locale=None, display_name=None, group_ids=None):
        locale = locale or self.default_locale
        dashboard_config = self.geo_dashboard_class(
            dimension_filters=request.args, group_ids=group_ids
        )
        return self.template_renderer.render_helper(
            'geo_dashboard.html', locale, {'dashboard': dashboard_config.to_dict()}
        )

    @authentication_required()
    def field_dashboard(self, locale=None, field_id=''):
        locale = locale or self.default_locale
        dashboard_config = self.field_dashboard_class(
            dimension_filters=request.args, field_ids=[field_id]
        )
        return self.template_renderer.render_helper(
            'field_dashboard.html', locale, {'dashboard': dashboard_config.to_dict()}
        )

    @authentication_required()
    def grid_dashboard(self, locale=None, name=None):
        locale = locale or self.default_locale
        if not name:
            raise BadRequest(description='Must supply a dashboard name')

        dashboard_entity = get_dashboard(name)
        if not dashboard_entity:
            # abort with not found error to render the not found page
            abort(NOT_FOUND)

        try:
            with AuthorizedOperation(
                'view_resource', 'dashboard', dashboard_entity.resource_id
            ):
                resource_uri = '/api2/dashboard/%s' % dashboard_entity.resource_id
                template_args = {
                    'dashboard': {
                        'activeDashboard': name,
                        'emptySpecification': EMPTY_SPECIFICATION,
                        'dashboardUri': resource_uri,
                    }
                }
                response_data = self.template_renderer.render_helper(
                    'grid_dashboard.html', locale, template_args, template_args
                )
                response = make_response(response_data)

                response.headers.add('Active-Dashboard', name)
                response.headers.add(
                    'Empty-Dashboard-Specification', EMPTY_SPECIFICATION
                )
                response.headers.add('Dashboard-Uri', resource_uri)

                return response
        except Unauthorized:
            # TODO(vedant). Perhaps we want to create a nicely formatted `not_found` page?
            # Intentionally returning a not-found would prevent malicious users from performing
            # discovery attacks on our website.
            return redirect('/unauthorized')

    def generate_blueprint(self):
        # pylint: disable=C0103
        dashboard = Blueprint('dashboard', __name__, template_folder='templates')

        # Grid Dashboard
        dashboard.add_url_rule(
            '/dashboard/field/<field_id>', 'field_dashboard', self.field_dashboard
        )

        # Field Dashboard
        dashboard.add_url_rule(
            '/<locale>/dashboard/field/<field_id>',
            'field_dashboard',
            self.field_dashboard,
        )
        dashboard.add_url_rule(
            '/<locale>/dashboard/field', 'field_dashboard', self.field_dashboard
        )

        dashboard.add_url_rule(
            '/dashboard/<name>', 'grid_dashboard', self.grid_dashboard
        )
        dashboard.add_url_rule(
            '/<locale>/dashboard/<name>', 'grid_dashboard', self.grid_dashboard
        )

        # Geo Dashboard
        dashboard.add_url_rule(
            '/dashboard/geo/<display_name>', 'geo_dashboard', self.geo_dashboard
        )
        dashboard.add_url_rule(
            '/dashboard/geo/<display_name>/<list:group_ids>',
            'geo_dashboard',
            self.geo_dashboard,
        )
        dashboard.add_url_rule(
            '/<locale>/dashboard/geo/<display_name>',
            'geo_dashboard',
            self.geo_dashboard,
        )
        dashboard.add_url_rule(
            '/<locale>/dashboard/geo/<display_name>/<list:group_ids>',
            'geo_dashboard',
            self.geo_dashboard,
        )
        # Necessary to add a top-level route, otherwise locale switcher breaks.
        dashboard.add_url_rule(
            '/<locale>/dashboard/geo', 'geo_dashboard', self.geo_dashboard
        )

        return dashboard
