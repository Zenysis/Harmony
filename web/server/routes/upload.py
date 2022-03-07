from builtins import str
import os
import time
from datetime import datetime

from flask import current_app, g, send_file
from flask_user import current_user

# pylint: disable=E0611
# werkzeug does contain the secure_filename function.
from werkzeug import secure_filename
from web.server.configuration.flask import DATA_UPLOAD_FOLDER


def handle_data_upload(category, uploads):
    datestamp = datetime.now().strftime('%Y%m%d')
    filenames = []
    destinations = []
    for upload in uploads:
        filename = secure_filename(
            '%s__%d__%s' % (category, int(time.time()), upload.filename)
        )
        destination_folder = os.path.join(DATA_UPLOAD_FOLDER, datestamp)
        destination = os.path.join(destination_folder, filename)
        g.request_logger.info('Accepting incoming file: %s', filename)
        g.request_logger.info('Saving it to: %s', destination)
        if not os.path.exists(destination_folder):
            os.makedirs(destination_folder)
        upload.save(destination)

        filenames.append(filename)
        destinations.append(destination)

    data_upload_message = current_app.email_renderer.create_data_upload_alert_message(
        filenames, destinations, category, datestamp, current_user
    )
    current_app.notification_service.send_email(data_upload_message)

    return True


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
