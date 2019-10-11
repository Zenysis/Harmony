from flask import Blueprint, Response, request as incoming_request
import requests

# pylint: disable-msg=C0103
webpack_dev_proxy = Blueprint('webpack_proxy', __name__)


def _proxy_request(url):
    # Pass the request headers through to webpack-dev-server so that we can take
    # advantage of asset caching.
    proxy_request = requests.get(url, headers=incoming_request.headers)

    # Ignore Connection: keep-alive since we want the connection to close.
    proxy_request.headers.pop('Connection')
    return Response(
        proxy_request.content,
        status=proxy_request.status_code,
        headers=list(proxy_request.headers.items()),
    )


@webpack_dev_proxy.route('/build/<path:asset>')
def route_to_webpack_build(asset):
    # Built files will live in webpack-dev-server's virtual `build/` directory.
    return _proxy_request('http://localhost:8080/build/%s' % asset)


@webpack_dev_proxy.route('/static/<path:asset>')
def route_to_webpack_static_asset(asset):
    # Static assets will not be copied into webpack-dev-server's virtual
    # directories but will exist in the same path on the filesystem.
    return _proxy_request('http://localhost:8080/%s' % asset)
