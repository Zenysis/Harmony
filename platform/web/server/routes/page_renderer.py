from flask import Blueprint, Response, stream_with_context
from flask_user import current_user

from models.alchemy.dashboard import Dashboard
from web.server.data.data_access import Transaction
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.page_renderer import (
    grid_dashboard_to_pdf,
    grid_dashboard_to_thumbnail,
    grid_dashboard_to_image,
)
from web.server.security.permissions import is_public_dashboard_user

FULL_DASHBOARD_CONTENT = 'application/pdf'
THUMBNAIL_CONTENT = 'image/png'
JPEG_CONTENT = 'image/jpeg'


def response_wrapper(render_response, content_type):
    # Check for 500 status code and return our own Response object because
    # the Response object below doesn't catch internal server errors.
    # So far we do this only to catch the TimeoutError.
    if not render_response or render_response.status_code == 500:
        response = Response()
        response.status_code = 500
        return response

    headers = {'Content-Type': content_type}
    return Response(
        stream_with_context(render_response.iter_content(chunk_size=2048)),
        headers=headers,
    )


def get_resource_id_from_name(name):
    with Transaction() as transaction:
        dashboard = transaction.find_all_by_fields(Dashboard, {'slug': name})
        return dashboard.first().resource_id


class PageRendererRouter:
    def grid_dashboard_to_pdf(self, locale=None, name=None, session_hash=''):
        resource_id = get_resource_id_from_name(name)
        with AuthorizedOperation('view_resource', 'dashboard', resource_id):
            response = (
                grid_dashboard_to_pdf(
                    locale,
                    name,
                    session_hash=session_hash,
                )
                if is_public_dashboard_user()
                else grid_dashboard_to_pdf(
                    locale,
                    name,
                    auth_user_email=current_user.username,
                    session_hash=session_hash,
                )
            )
            return response_wrapper(
                response,
                FULL_DASHBOARD_CONTENT,
            )

    def grid_dashboard_to_thumbnail(self, locale=None, name=None):
        return response_wrapper(
            grid_dashboard_to_thumbnail(locale, name), THUMBNAIL_CONTENT
        )

    def grid_dashboard_to_image(self, locale=None, name=None, session_hash=''):
        resource_id = get_resource_id_from_name(name)
        with AuthorizedOperation('view_resource', 'dashboard', resource_id):
            return response_wrapper(
                grid_dashboard_to_image(
                    locale,
                    name,
                    auth_user_email=current_user.username,
                    session_hash=session_hash,
                ),
                JPEG_CONTENT,
            )

    def generate_blueprint(self):
        render_page = Blueprint('render_page', __name__, template_folder='templates')

        render_page.add_url_rule(
            '/dashboard/<name>/pdf', 'grid_dashboard_to_pdf', self.grid_dashboard_to_pdf
        )
        render_page.add_url_rule(
            '/<locale>/dashboard/<name>/pdf',
            'grid_dashboard_to_pdf',
            self.grid_dashboard_to_pdf,
        )

        render_page.add_url_rule(
            '/dashboard/<name>/png/thumbnail',
            'grid_dashboard_to_thumbnail',
            self.grid_dashboard_to_thumbnail,
        )
        render_page.add_url_rule(
            '/<locale>/dashboard/<name>/png/thumbnail',
            'grid_dashboard_to_thumbnail',
            self.grid_dashboard_to_thumbnail,
        )

        render_page.add_url_rule(
            '/dashboard/<name>/jpeg',
            'grid_dashboard_to_image',
            self.grid_dashboard_to_image,
        )
        render_page.add_url_rule(
            '/<locale>/dashboard/<name>/jpeg',
            'grid_dashboard_to_image',
            self.grid_dashboard_to_image,
        )

        render_page.add_url_rule(
            '/dashboard/<name>/<session_hash>/jpeg',
            'grid_dashboard_to_image_w_hash',
            self.grid_dashboard_to_image,
        )
        render_page.add_url_rule(
            '/<locale>/dashboard/<name>/<session_hash>/jpeg',
            'grid_dashboard_to_image_w_hash',
            self.grid_dashboard_to_image,
        )

        render_page.add_url_rule(
            '/dashboard/<name>/<session_hash>/pdf',
            'grid_dashboard_to_pdf_with_hash',
            self.grid_dashboard_to_pdf,
        )
        render_page.add_url_rule(
            '/<locale>/dashboard/<name>/<session_hash>/pdf',
            'grid_dashboard_to_pdf_with_hash',
            self.grid_dashboard_to_pdf,
        )

        return render_page
