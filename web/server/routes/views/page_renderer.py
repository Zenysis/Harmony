from datetime import timedelta

import requests
from flask import request, url_for
from flask_jwt_extended import create_access_token

from config import settings
from log import LOG
from models.alchemy.dashboard import Dashboard
from web.server.data.data_access import Transaction

# Make the URLBOX API URL configurable in case a reverse proxy is necessary.
URLBOX_API_URL = settings.getenv("URLBOX_API_URL", "https://api.urlbox.io")

# Override the JWT token expiration time set in Flask config
# to enable the dashboard pdf renderer to authenticate
JWT_TOKEN_EXPIRATION_TIME = 120

# supported request params for PDF rendering, these can be
# dynamically added to a request
SUPPORTED_RENDERING_PARAMS = [
    "delay",
    "fail_on_4xx",
    "url",
    "fail_on_5xx",
    "cookie",
    "fail_if_selector_present",
    "force",
    "max_height",
    "wait_to_leave",
    "max_section_height",
    "wait_timeout",
    "detect_full_height",
    "allow_infinite",
    "width",
    "media",
    "height",
    "pdf_page_size",
    "pdf_fit_to_page",
    "skip_scroll",
    "scroll_increment",
    "scroll_delay",
    "pdf_orientation",
    "full_page",
]


def get_dashboard_downloadable_url(
    locale, name, dashboard_url, output_format, session_hash
):
    if not dashboard_url:
        dashboard_url = url_for(
            "dashboard.grid_dashboard", locale=locale, name=name, _external=True
        )
    if "#h=" in dashboard_url:
        links = dashboard_url.split("#h=")
        dashboard_url = links[0]
        session_hash = links[1]
    hash_suffix = f"#h={session_hash}" if session_hash else ""
    dash_url = (
        f"{dashboard_url}?screenshot=1&pdf=1{hash_suffix}"
        if output_format == "pdf"
        else f"{dashboard_url}?screenshot=1{hash_suffix}"
    )
    return dash_url


def grid_dashboard_urlbox_renderer(
    output_format,
    name,
    locale=None,
    is_thumbnail=False,
    dashboard_url=None,
    auth_user_email=settings.RENDERBOT_EMAIL,
    session_hash="",
    request_args=None,
):
    """Send a request to the urlbox.io to generate a PDF or image."""
    dash_url = get_dashboard_downloadable_url(
        locale, name, dashboard_url, output_format, session_hash
    )
    if is_thumbnail:
        dash_url += "&thumbnail=1"
    api_key = settings.URLBOX_API_KEY
    req_url = f"{URLBOX_API_URL}/v1/{api_key}/{output_format}"
    with Transaction() as transaction:
        resource_id = (
            transaction.find_all_by_fields(Dashboard, {"slug": name}).one().resource_id
        )
    token = create_access_token(
        identity=auth_user_email,
        expires_delta=timedelta(seconds=JWT_TOKEN_EXPIRATION_TIME),
        user_claims={
            "needs": [
                ["view_resource", resource_id, "dashboard"],
            ],
            "query_needs": ["*"],
        },
    )

    params = {
        "allow_infinite": "true",
        "cookie": f"accessKey={token}",
        "fail_if_selector_missing": "true",
        "fail_on_5xx": "true",
        "force": "true",
        "ttl": 86400,
        "url": dash_url,
        "wait_for": "#dashboard-load-success",
        "wait_timeout": 120000,
        "timeout": 60000,
    }

    if output_format == "pdf":
        params.update(
            {
                "media": "screen",
                "pdf_page_size": "A4",
                'js': (
                    "window.addEventListener('resize',() => "
                    "{let svgs = document.querySelectorAll('.visualization > "
                    "div > svg');svgs.forEach((svg) => {svg.setAttribute('height', "
                    "'1px');});});"
                ),
                "css": "svg:not(:root) { overflow: visible !important;}",
                "delay": 10000,
            }
        )
    elif output_format == "jpg":
        params.update({"quality": 100, "full_page": True, "width": 1280})

    # add dynamically added params and might override set params
    for _param in SUPPORTED_RENDERING_PARAMS:
        param_value = (
            request_args if request_args is not None else request.args.get(_param)
        )
        if param_value:
            params[_param] = param_value

    try:
        res = requests.get(req_url, params=params, stream=True, timeout=300)
        if res.status_code != 200:
            error = (
                f"Urlbox failed to generate {output_format} for {dash_url},"
                f"request url: {res.url} with status code: {res.status_code} "
                f"and response: {res.content}"
            )
            LOG.error(error)
    except ConnectionError:
        return None
    return res


def grid_dashboard_to_pdf(
    locale=None,
    name=None,
    dashboard_url=None,
    auth_user_email=settings.RENDERBOT_EMAIL,
    session_hash="",
    request_args=None,
):
    return grid_dashboard_urlbox_renderer(
        "pdf",
        name,
        locale=locale,
        dashboard_url=dashboard_url,
        auth_user_email=auth_user_email,
        session_hash=session_hash,
        request_args=request_args,
    )


def grid_dashboard_to_thumbnail(locale=None, name=None, dashboard_url=None):
    return grid_dashboard_urlbox_renderer(
        "png", name, locale=locale, is_thumbnail=True, dashboard_url=dashboard_url
    )


def grid_dashboard_to_image(
    locale=None,
    name=None,
    dashboard_url=None,
    auth_user_email=settings.RENDERBOT_EMAIL,
    session_hash="",
):
    return grid_dashboard_urlbox_renderer(
        "jpg",
        name,
        locale=locale,
        dashboard_url=dashboard_url,
        auth_user_email=auth_user_email,
        session_hash=session_hash,
    )
