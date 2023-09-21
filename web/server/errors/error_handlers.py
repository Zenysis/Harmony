import hashlib
import sys
import traceback

from http.client import INTERNAL_SERVER_ERROR, NOT_FOUND
from werkzeug.exceptions import HTTPException

from flask import g, jsonify, request, current_app
from flask_user import current_user

from config import settings
from log import LOG
from web.server.util.util import generic_error


def get_error_fingerprint(err_str):
    m = hashlib.sha256()
    m.update(err_str.encode('utf-8'))
    return m.hexdigest()[:8]


def log_error(error):
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG
    logger.error(
        'An uncaught exception was thrown. '
        'Logging it here for debugging purposes. '
        'Exception details were: \'%s\'',
        error,
    )


def get_locale_from_path(path):
    paths = path.strip().split('/')
    locale = current_app.zen_config.ui.DEFAULT_LOCALE
    if (
        len(paths) > 2
        and paths[1]
        and paths[1] in current_app.zen_config.ui.ENABLE_LOCALES
    ):
        locale = paths[1]
    return locale


# pylint:disable=W0612


def register_for_error_events(app):
    @app.errorhandler(INTERNAL_SERVER_ERROR)
    def log_internal_server_error(error):
        err_str = ''.join(
            traceback.format_exception(Exception, error, error.__traceback__)
        )
        uid = get_error_fingerprint(err_str)
        log_error(f'{err_str} [uid {uid}]')
        return jsonify(generic_error(uid=uid)), INTERNAL_SERVER_ERROR

    @app.errorhandler(Exception)
    def log_uncaught_exception(error):
        err_str = ''.join(
            traceback.format_exception(Exception, error, error.__traceback__)
        )
        uid = get_error_fingerprint(err_str)
        log_error(f'{err_str} [uid {uid}]')

        if isinstance(error, HTTPException):
            return error, error.code
        return jsonify(generic_error(uid=uid)), INTERNAL_SERVER_ERROR

    @app.errorhandler(NOT_FOUND)
    def handle(error):
        log_error(
            ''.join(traceback.format_exception(Exception, error, error.__traceback__))
        )
        path = str(request.path)

        # if thrown by the api
        if path.startswith('/api/') or path.startswith('/api2/'):
            return error, error.code

        # show webpage if thrown by the frontend application
        locale = get_locale_from_path(path)
        return (
            app.template_renderer.render_helper(
                'notfound.html',
                locale,
            ),
            error.code,
        )
