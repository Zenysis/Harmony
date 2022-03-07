# -*- coding: utf-8 -*-
from urllib.parse import urljoin

from web.python_client.core import ApiService, LOCALHOST_URI
from web.python_client.authorization_service.model import QueryPolicy

MAXIMUM_PAGE_SIZE = 1000


class AuthorizationService(ApiService):
    def __init__(self, session, host=LOCALHOST_URI):
        super(AuthorizationService, self).__init__(session, host)
        self._authorization_uri = urljoin(self.base_uri, 'api/authorization')
        self._query_policy_uri = urljoin(self.base_uri, 'api2/query_policy')

    def list_all_query_policies(self):
        page_string = '?per_page={page_size}'.format(page_size=MAXIMUM_PAGE_SIZE)
        full_uri = self._query_policy_uri + page_string
        print(full_uri)
        return [
            QueryPolicy(query_policy_dict)
            for query_policy_dict in self.get(full_uri).json()
        ]

    def update_query_policy(self, query_policy):
        if not isinstance(query_policy, QueryPolicy):
            raise TypeError('\'query_policy\' must be of type QueryPolicy.')

        destination_uri = self.get_destination_uri(query_policy.uri)

        return QueryPolicy(
            self.patch(destination_uri, json=query_policy.serialize()).json()
        )

    def create_query_policy(self, query_policy):
        if not isinstance(query_policy, QueryPolicy):
            raise TypeError('\'query_policy\' must be of type QueryPolicy.')
        return QueryPolicy(
            self.post(self._query_policy_uri, json=query_policy.serialize()).json()
        )
