from flask import Blueprint, redirect, current_app, url_for
from flask_user import current_user
from flask_user.views import _get_safe_next_param
from web.server.routes.views.authentication import authentication_required


class UserAuthenticationRouter:
    OVERVIEW_URL = 'index.overview'

    def __init__(self, template_renderer, default_locale):
        self.template_renderer = template_renderer
        self.default_locale = default_locale

    def _authenticated_redirect_or_render(
        self, template_name, locale=None, redirect_url=None
    ):
        locale = locale or self.default_locale

        # Immediately redirect already logged in users
        if current_user.is_authenticated:
            return redirect(redirect_url or url_for(self.OVERVIEW_URL))

        return self.template_renderer.render_helper(template_name, locale)

    def login(self, locale=None):
        locale = locale or self.default_locale

        user_manager = current_app.user_manager
        next_endpoint = _get_safe_next_param('next', user_manager.after_login_endpoint)

        return self._authenticated_redirect_or_render(
            'login.html', locale, redirect_url=next_endpoint
        )

    def register(self, locale=None):
        return self._authenticated_redirect_or_render('register.html', locale)

    def forgot_password(self, locale=None):
        return self._authenticated_redirect_or_render('forgot_password.html', locale)

    def reset_password(self, locale=None):
        return self._authenticated_redirect_or_render('reset_password.html', locale)

    @authentication_required()
    def unauthorized(self, locale=None):
        locale = locale or self.default_locale
        return self.template_renderer.render_helper(
            'unauthorized.html',
            locale,
        )

    def generate_blueprint(self):
        index = Blueprint('auth', __name__, template_folder='templates')

        # Login Page
        index.add_url_rule('/login', 'login', self.login)
        index.add_url_rule('/<locale>/login', 'login', self.login)

        # Forgot Password Page
        index.add_url_rule(
            '/user/forgot-password', 'forgot_password', self.forgot_password
        )
        index.add_url_rule(
            '/<locale>/user/forgot-password', 'forgot_password', self.forgot_password
        )

        # Register Page
        index.add_url_rule('/zen/register', 'register', self.register)
        index.add_url_rule('/<locale>/zen/register', 'register', self.register)

        # Reset Password Page
        index.add_url_rule(
            '/user/reset-password', 'reset_password', self.reset_password
        )
        index.add_url_rule(
            '/<locale>/user/reset-password', 'reset_password', self.reset_password
        )

        # Unauthorized Page
        index.add_url_rule('/unauthorized', 'unauthorized', self.unauthorized)
        index.add_url_rule('/<locale>/unauthorized', 'unauthorized', self.unauthorized)

        return index
