# -*- coding: utf-8 -*-
from urllib.parse import urljoin

from web.python_client.core import ApiService, LOCALHOST_URI
from web.python_client.dashboard_service.model import Dashboard, DashboardMeta

MAXIMUM_PAGE_SIZE = 1000


class DashboardService(ApiService):
    def __init__(self, session, host=None):
        host = host or LOCALHOST_URI
        super(DashboardService, self).__init__(session, host)
        self._dashboard_uri = urljoin(self.base_uri, 'api2/dashboard')

    def list_all_dashboards(self):
        page_string = '?per_page={page_size}'.format(page_size=MAXIMUM_PAGE_SIZE)
        full_uri = self._dashboard_uri + page_string
        return [
            DashboardMeta(dashboard_dict)
            for dashboard_dict in self.get(full_uri).json()
        ]

    def get_dashboard(self, uri):
        dashboard_dict = self.get(uri).json()
        return Dashboard(dashboard_dict)

    def get_dashboard_by_slug(self, slug):
        filter_string = '?where={{"slug":"{slug}"}}'.format(slug=slug)
        full_uri = self._dashboard_uri + filter_string
        dashboards = self.get(full_uri).json()

        if len(dashboards) > 0:
            full_uri = urljoin(self.base_uri, dashboards[0]['$uri'])
            full_dashboard = self.get(full_uri).json()
            return Dashboard(full_dashboard)
        else:
            raise ValueError('No dashboard with slug \'%s\' exists.' % slug)

    def update_dashboard(self, dashboard):
        if not isinstance(dashboard, Dashboard):
            raise TypeError('\'dashboard\' must be of type Dashboard.')

        destination_uri = self.get_destination_uri(dashboard.uri)

        return Dashboard(self.patch(destination_uri, json=dashboard.serialize()).json())

    def create_dashboard(self, dashboard):
        if not isinstance(dashboard, Dashboard):
            raise TypeError('\'dashboard\' must be of type Dashboard.')
        return Dashboard(
            self.post(self._dashboard_uri, json=dashboard.serialize()).json()
        )
