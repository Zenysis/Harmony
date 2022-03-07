from typing import Any, Dict, Optional
import sys
import json
from pylib.base.term_color import TermColor
from urllib.parse import urlparse
import requests

from scripts.cli_util.list_deployments import (
    is_deployment_name_valid,
    get_url_from_deployment,
)
from scripts.db.postgres.dev.create_default_zenysis_admin_user import deduce_user_data
from util.credentials.passphrase import AUTOMATION_WEB_ACCOUNT_ID, get_credentials

AUTOMATION_ACCOUNT = {'username': 'automation@zenysis.com', 'password': None}
DEFAULT_PASSWORD = 'zenysis'


def _json_from_response(response: requests.Response) -> Optional[Any]:
    try:
        return response.json()
    except json.decoder.JSONDecodeError:
        return None


def _get_deployment_base_url(deployment_name: Optional[str] = None) -> Optional[str]:
    '''Gets the deployment's URL. It will exit the CLI if no deployment name
    is provided, or if the deployment name is invalid.
    '''
    if not deployment_name:
        print(TermColor.ColorStr('No deployment name was provided', 'RED'))
        return None

    if deployment_name and not is_deployment_name_valid(
        deployment_name, print_help=True
    ):
        return None

    return get_url_from_deployment(deployment_name)


class ZenAPI:
    '''A minimal wrapper for the Zenysis API to execute HTTP requests against
    a running server. It can be used to connect to a local server or to a remote
    server given a deployment name (e.g. mz-staging, pk-web-prod, etc.).

    This class also handles any simple validation such as checking that the
    server is running, that login credentials are correct, and that a valid
    deployment name was passed.

    NOTE(pablo): This class is intended for usage within a CLI because it relies
    on `sys.exit(1)` to exit early if there is any invalid input. Do not use
    this class inside actual production code.

    Args:
        raise_exceptions (bool, optional): whether or not to raise exceptions, instead
            of exiting the entire process. This is False by default. Currently,
            the only exception raised is requests.exceptions.ConnectionError
        localhost (bool, optional): whether or not to connect to your local
            server
        deployment_name (str, optional): the deployment to connect to if we're
            not connecting to your local server
        local_username (str, optional): the username to use for authentication
            with your local server. It will default to your email if none is
            provided.
        local_password (str, optional): the password to use for authentication
            with your local server. It will default to 'zenysis' if none is
            provided
    '''

    def __init__(
        self,
        raise_exceptions: bool = False,
        localhost: bool = False,
        deployment_name: Optional[str] = None,
        local_username: Optional[str] = None,
        local_password: Optional[str] = None,
    ):
        self.raise_exceptions = raise_exceptions
        self.base_url = (
            'http://localhost:5000'
            if localhost
            else _get_deployment_base_url(deployment_name)
        )
        if self.base_url is None:
            # fail immediately if the bas_url was never set due to an invalid
            # deployment name
            if raise_exceptions:
                raise ValueError('Invalid deployment name')
            sys.exit(1)

        self.session = requests.Session()
        self.is_local = localhost
        self.deployment_name = deployment_name
        self.local_username = local_username
        self.local_password = local_password

        self._is_server_running()
        self.login()

    def get_username(self) -> str:
        if self.is_local:
            return self.local_username or deduce_user_data()[2]
        username = AUTOMATION_ACCOUNT['username']
        assert isinstance(username, str)
        return username

    def _get_password(self) -> str:
        if self.is_local:
            return self.local_password or DEFAULT_PASSWORD

        if AUTOMATION_ACCOUNT['password']:
            password = AUTOMATION_ACCOUNT['password']
            assert isinstance(password, str)
            return password

        _, plaintext_password = get_credentials(AUTOMATION_WEB_ACCOUNT_ID)
        AUTOMATION_ACCOUNT['password'] = plaintext_password
        return plaintext_password

    def _is_server_running(self) -> bool:
        '''Check if the local server is running.

        Args:
            print_help (bool, optional): prints helpful error message to stdout
                if the server is not running.

        Returns:
            bool: True if the 'api/health' endpoint can be hit, otherwise
            we quit the CLI and print an error message
        '''
        try:
            response = requests.get(f'{self.base_url}/api/health')
            json_response = _json_from_response(response)
            if (
                json_response
                and 'success' in json_response
                and json_response['success']
            ):
                return True
        except requests.exceptions.ConnectionError:
            pass

        if self.is_local:
            msg = 'Your local server is not running.'
        else:
            msg = (
                f'The {self.deployment_name} server at {self.base_url} is not running.'
            )

        if self.raise_exceptions:
            raise requests.exceptions.ConnectionError(msg)
        print(TermColor.ColorStr(msg, 'RED'))
        sys.exit(1)

    def login(self) -> bool:
        login_page_response = self.session.get(f'{self.base_url}/login')
        login_page_response.raise_for_status()
        page_text = login_page_response.text

        # Extract the CSRF token since it is needed for the login request.
        csrf_token_start = (
            page_text.index('value="', page_text.index('id="csrf_token"')) + 7
        )
        csrf_token_end = page_text.index('"', csrf_token_start)
        csrf_token = page_text[csrf_token_start:csrf_token_end]

        login_data = {
            'next': '/overview',
            'remember_me': 'n',
            'csrf_token': csrf_token,
            'username': self.get_username(),
            'password': self._get_password(),
        }

        login_response = self.session.post(f'{self.base_url}/login', data=login_data)
        login_response.raise_for_status()

        base_url = urlparse(self.base_url)
        redirected_url = urlparse(login_response.url)
        if redirected_url.netloc != base_url.netloc:
            # try logging in again at the redirected url
            self.base_url = f'{redirected_url.scheme}://{redirected_url.netloc}'
            return self.login()

        login_succeeded = login_response.url.endswith('/overview')
        if not login_succeeded:
            msg = 'Login failed! Redirected url: %s' % login_response.url
            print(TermColor.ColorStr(msg, 'RED'))
            if self.raise_exceptions:
                raise requests.exceptions.ConnectionError(msg)
            sys.exit(1)

        return True

    def get(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None, stream=False
    ) -> Dict[str, Any]:
        '''Sends an HTTP GET request to the given endpoint, with the
        given params.

        Args:
            endpoint (str): the endpoint to hit. This requires a leading slash.
                i.e. 'api2/dashboard' is expected instead of '/api2/dashboard'
            params (dict, optional): a dict of params to pass to the request
            stream (bool): whether to send back the raw response as a stream or
                return the json response

        Returns:
            JSON response from the server as a dict or the stream response
        '''
        param_str = ''
        if params:
            param_strs = [
                '%s=%s' % (key, json.dumps(val)) for key, val in params.items()
            ]
            param_str = '?' + '&'.join(param_strs)

        response = self.session.get(
            f'{self.base_url}{endpoint}{param_str}', stream=stream
        )
        response.raise_for_status()
        if stream:
            return response
        return _json_from_response(response)

    def post(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        '''Sends an HTTP POST request to the given endpoint, with the given
        params.

        Args:
            endpoint (str): the endpoint to hit. This requires a leading slash.
                i.e. '/api2/dashboard' is expected instead of 'api2/dashboard'
            params (dict, optional): a dict of params to pass to the request

        Returns:
            JSON response from the server
        '''
        response = self.session.post(f'{self.base_url}{endpoint}', json=params)
        response.raise_for_status()
        return _json_from_response(response)

    def patch(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        '''Sends an HTTP PATCH request to the given endpoint, with the given
        params.

        Args:
            endpoint (str): the endpoint to hit. This requires a leading slash.
                i.e. '/api2/dashboard' is expected instead of 'api2/dashboard'
            params (dict, optional): a dict of params to pass to the request

        Returns:
            JSON response from the server
        '''
        response = self.session.patch(f'{self.base_url}{endpoint}', json=params)
        response.raise_for_status()
        return _json_from_response(response)

    def delete(self, endpoint: str) -> bool:
        '''Sends an HTTP DELETE request to the given endpoint.

        Args:
            endpoint (str): the endpoint to hit. This requires a leading slash.
        '''
        response = self.session.delete(f'{self.base_url}{endpoint}')
        response.raise_for_status()
        return _json_from_response(response)
