import platform

import requests
from flask import Blueprint, Response, current_app, stream_with_context

from web.server.environment import IS_PRODUCTION
from web.server.security.access_keys import KeyManager


class PageRendererRouter:
    def grid_dashboard_to_pdf(self, locale=None, name=None):
        return self.grid_dashboard_renderer(
            {
                'pdf': {'landscape': True},
                'scrollPage': True,
                'viewport': {'isLandscape': True},
            },
            'application/pdf',
            locale,
            name,
        )

    def grid_dashboard_to_thumbnail(self, locale=None, name=None):
        return self.grid_dashboard_renderer(
            {
                'output': 'screenshot',
                'waitFor': '.dashboard-item',
                'screenshot': {'fullPage': False},
            },
            'image/png',
            locale,
            name,
        )

    def grid_dashboard_renderer(
        self, render_opts, content_type, locale=None, name=None
    ):
        '''Send a request to the render server running locally on port 9000.
        The render server will load this dashboard using a one-time access key.

        render_opts: A dictionary of options to pass to the renderer
                    (puppeteer). See https://github.com/anthonylau/url-to-pdf-api
        '''
        locale = locale or current_app.zen_config.ui.DEFAULT_LOCALE

        if IS_PRODUCTION:
            # In production, a user-defined docker network bridge will resolve
            # this hostname.
            dash_host = 'web'
        else:
            # The render server accesses the web host. Normally this is done via
            # localhost, but Docker Mac requires a special docker hostname because
            # '--network host' is not supported.
            dash_host = (
                'host.docker.internal' if platform.system() == 'Darwin' else 'localhost'
            )

        dash_url = 'http://%s:5000/%s/dashboard/%s?screenshot=1' % (
            dash_host,
            locale,
            name,
        )

        if IS_PRODUCTION:
            req_url = 'http://web-renderer:9000/api/render'
        else:
            req_url = 'http://localhost:9000/api/render'

        key = KeyManager.generate_temporary_key()
        postdata = {
            'url': dash_url,
            'cookies': [{'name': 'accessKey', 'value': key, 'domain': dash_host}],
        }
        postdata.update(render_opts)

        req = requests.post(req_url, json=postdata, stream=True)

        headers = {'Content-Type': content_type}
        return Response(
            stream_with_context(req.iter_content(chunk_size=2048)), headers=headers
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

        return render_page
