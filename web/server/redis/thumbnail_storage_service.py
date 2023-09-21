import base64
import time

from flask import current_app

from web.server.routes.page_renderer import PageRendererRouter

EXPIRATION_SEC = 1209600  # Update thumbnail image every 2 weeks.
PENDING_STATE_TIMEOUT = 600


# Render dashboard image and encode into base64 string. Then decode to utf-8
# format to send to client.
def fetch_base64_image(img_name):
    page_renderer = PageRendererRouter()
    response = page_renderer.grid_dashboard_to_thumbnail(name=img_name)
    return base64.b64encode(response.get_data()).decode()


def get_thumbnail_storage_name(name):
    return f'thumbnail_{name}'


# Retrieves value from redis and renders new image if key doesn't exist.
def retrieve_item(key):
    cache = current_app.cache
    storage_key = get_thumbnail_storage_name(key)
    while (value := cache.get(storage_key)) == 'PENDING':
        time.sleep(1)

    if value:
        return value

    cache.set(storage_key, "PENDING", timeout=PENDING_STATE_TIMEOUT)
    new_base64_img = fetch_base64_image(key)
    if new_base64_img:
        cache.set(storage_key, new_base64_img, timeout=EXPIRATION_SEC)
        return new_base64_img
    return ""
