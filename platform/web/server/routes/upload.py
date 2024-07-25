from builtins import str
import os

from flask import current_app, g, send_file

# pylint: disable=E0611
# werkzeug does contain the secure_filename function.
from werkzeug import secure_filename
from web.server.configuration.flask import DATA_UPLOAD_FOLDER


def serve_upload(datestamp, path):
    filename = secure_filename(path)
    # Go up from web/server 'app root' to /uploads directory, and then to the
    # file itself.
    destination = os.path.join(
        current_app.root_path,
        '../..',
        DATA_UPLOAD_FOLDER,
        str(int(datestamp)),
        filename,
    )
    g.request_logger.info('Attempting to fetch file: %s', destination)
    if not os.path.isfile(destination):
        return 'Not found'
    return send_file(destination)
