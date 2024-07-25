from functools import partialmethod
import http.client
import json

from urllib.parse import urljoin

import requests
from werkzeug import exceptions

# NOTE: Really used for Alerts
API_VERSION = '2020-07-20'

# NOTE: http added or else urljoin does not work well
LOCALHOST_URI = 'http://127.0.0.1:5000'

DEFAULT_PAGE_SIZE = 100

PASSWORD_HEADER = 'X-Password'
TOTAL_COUNT_HEADER = 'X-Total-Count'
USERNAME_HEADER = 'X-Username'


class AuthenticatedSession:
    def __init__(self, username, password, host=None):
        self.base_uri = host or LOCALHOST_URI
        self.session = requests.Session()

        # NOTE: This fallback to the old endpoint should be removed
        # when all deployments have updated their web servers.
        urls = ['/authentication/login', '/api/login']
        for url in urls:
            r = self.session.post(
                urljoin(self.base_uri, url),
                json={'username': username, 'password': password},
            )
            # If the response is anything other than 'not found' (404), exit the loop.
            if r.status_code != 404:
                break

        if r.status_code == 405:
            # NOTE: for backwards compatibility, should be removed
            # when all deployments migrate to JWT
            self.session.headers.update(
                {'X-Username': username, 'X-Password': password}
            )
            return

        r.raise_for_status()
        self.session.headers.update(
            {
                'Authorization': f'Bearer {r.json()["access_token"]}',
            }
        )

    def __enter__(self):
        return self.session

    def __exit__(self, exception_type, exception_value, traceback):
        self.session.close()
        self.session.__exit__(exception_type, exception_value, traceback)


def fields_dict_to_string(fields):
    '''Convert dict into json string for use in URI.'''
    return json.dumps(fields, separators=(',', ':'))


def get_fields_suffix(fields, conjunction='&'):
    '''Get fields in URI form.'''
    if not fields:
        return ''
    return f'{conjunction}where={fields_dict_to_string(fields)}'


class ApiService:
    CODE_TO_EXCEPTION_MAP = {
        http.client.BAD_REQUEST: exceptions.BadRequest,
        http.client.UNAUTHORIZED: exceptions.Unauthorized,
        http.client.FORBIDDEN: exceptions.Forbidden,
        http.client.NOT_FOUND: exceptions.NotFound,
        http.client.CONFLICT: exceptions.Conflict,
        http.client.INTERNAL_SERVER_ERROR: exceptions.InternalServerError,
        http.client.NOT_IMPLEMENTED: exceptions.NotImplemented,
        http.client.SERVICE_UNAVAILABLE: exceptions.ServiceUnavailable,
        http.client.METHOD_NOT_ALLOWED: exceptions.MethodNotAllowed,
    }

    def __init__(self, session, host=LOCALHOST_URI):
        self._session = session
        self.base_uri = host

    def get_total_items(self, url, field_str):
        '''Returns the total number of items there are at a given url. Handles
        pagination, filtering.
        TODO: Implement sorting.
        '''
        uri = f'{url}?per_page=1{field_str}'
        return int(self.get(uri).headers[TOTAL_COUNT_HEADER])

    def get_all_items(self, url, page_size=DEFAULT_PAGE_SIZE, fields=None):
        '''Returns all items in json dict at a given URL. `page_size` can be
        changed depending on how large full items are.

        :param fields: dict of fields
        '''
        fields_suffix = get_fields_suffix(fields)
        total_items = self.get_total_items(url, fields_suffix)

        items_received_list = []
        current_page = 1
        while len(items_received_list) < total_items:
            uri = f'{url}?page={current_page}&per_page={page_size}{fields_suffix}'
            response = self.get(uri)
            items_received_list += response.json()
            current_page += 1

        return items_received_list

    def delete(self, url, **kwargs):
        return self._request('delete', url, **kwargs)

    def get_destination_uri(self, relative_path):
        return urljoin(str(self.base_uri), str(relative_path))

    def _request(self, method, url, headers=None, **kwargs):
        url = urljoin(self.base_uri, url)

        if not headers:
            headers = {}

        response = self._session.request(
            method, url, headers=headers, allow_redirects=False, **kwargs
        )

        if response.status_code >= 400 and response.status_code < 600:
            errors = None
            if response.headers.get('Content-Type') == 'application/json':
                errors = response.json()
            if errors is None:
                errors = response.text

            ApiService._raise_error(response.status_code, errors, response)

        return response

    get = partialmethod(_request, 'get')
    post = partialmethod(_request, 'post')
    patch = partialmethod(_request, 'patch')
    put = partialmethod(_request, 'put')

    @classmethod
    def _raise_error(cls, status_code, errors=None, response=None):
        exception_class = ApiService.CODE_TO_EXCEPTION_MAP.get(
            status_code, exceptions.HTTPException
        )
        raise exception_class(errors, response)

    def check_if_api_version_matches(self):
        '''Validate current branch's API version against server's.'''
        try:
            uri = self.get_destination_uri('/api2/metadata/server_version')
            server_ver = self.get(uri).json()
            return server_ver == API_VERSION
        except exceptions.NotFound:
            return False
