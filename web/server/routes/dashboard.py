from http.client import NOT_FOUND

from flask import Blueprint, current_app, redirect, make_response, abort
from flask_login import current_user
from werkzeug.exceptions import BadRequest

from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import is_authorized
from web.server.routes.views.dashboard import get_dashboard


class DashboardPageRouter:
    def __init__(self, template_renderer, default_locale):
        self.template_renderer = template_renderer
        self.default_locale = default_locale

    @authentication_required()
    def grid_dashboard(self, locale=None, name=None):
        locale = locale or self.default_locale
        if not name:
            raise BadRequest(description='Must supply a dashboard name')

        dashboard_entity = get_dashboard(name)
        if not dashboard_entity:
            # abort with not found error to render the not found page
            abort(NOT_FOUND)

        can_view_dashboard = is_authorized(
            'view_resource', 'dashboard', dashboard_entity.resource_id
        )

        if not can_view_dashboard:
            # If the user is authenticated, they should be shown the unauthorized page
            # since they do not have *authorization* permission to view this dashboard.
            if current_user.is_authenticated:
                return redirect('/unauthorized')

            # If the user is not authenticated, redirect to the login page.
            # NOTE(stephen): This check is needed because when public access is enabled,
            # the `authentication_required` decorator will allow the request to continue
            # to this authorization stage. When public access is *disabled*, then the
            # `authentication_required` decorator will already handle the redirect to
            # the login page.
            return current_app.user_manager.unauthenticated_view_function()

        resource_uri = '/api2/dashboard/%s' % dashboard_entity.resource_id
        template_args = {
            'dashboard': {
                'activeDashboard': name,
                'dashboardUri': resource_uri,
                'dashboardAuthor': dashboard_entity.author.username,
                'isOfficial': dashboard_entity.is_official,
            }
        }

        response_data = self.template_renderer.render_helper(
            'grid_dashboard.html',
            locale,
            template_args,
            template_args,
        )
        response = make_response(response_data)

        response.headers.add('Active-Dashboard', name)
        response.headers.add('Dashboard-Uri', resource_uri)

        return response

    def generate_blueprint(self):
        # pylint: disable=C0103
        dashboard = Blueprint('dashboard', __name__, template_folder='templates')

        dashboard.add_url_rule(
            '/dashboard/<name>', 'grid_dashboard', self.grid_dashboard
        )
        dashboard.add_url_rule(
            '/<locale>/dashboard/<name>', 'grid_dashboard', self.grid_dashboard
        )

        return dashboard
