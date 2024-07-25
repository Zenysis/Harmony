from datetime import timedelta
from typing import Optional
from flask import make_response, jsonify, current_app
from flask_jwt_extended import create_access_token
from werkzeug.wrappers import Response


def create_user_access_token(
    username: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    if expires_delta is None:
        expires_delta = current_app.config['JWT_TOKEN_WEB_COOKIE_EXPIRATION']

    return create_access_token(
        identity=username,
        user_claims={
            'needs': ['*'],
            'query_needs': ['*'],
        },
        expires_delta=expires_delta,
    )


def login_user(
    msg: str,
    username: str,
    remember_me: bool = False,
    expires: Optional[timedelta] = None,
) -> Response:
    if expires is None:
        expires = current_app.config['JWT_TOKEN_WEB_COOKIE_EXPIRATION']

    access_token = create_user_access_token(username, expires)
    return create_auth_response(msg, access_token, remember_me, expires)


def create_auth_response(
    msg: str,
    access_token: str,
    remember_me: bool = False,
    expires: Optional[timedelta] = None,
) -> Response:
    if expires is None:
        expires = current_app.config['JWT_TOKEN_WEB_COOKIE_EXPIRATION']

    response = make_response(jsonify({"msg": msg}), 200)

    max_age = int(expires.total_seconds()) if remember_me else None

    response.set_cookie(
        'accessKey',
        access_token,
        max_age=max_age,
        httponly=True,
    )

    return response
