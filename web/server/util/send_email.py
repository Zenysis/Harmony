from flask import current_app
import requests

from log import LOG
from web.server.environment import IS_TEST, IS_PRODUCTION, SEND_EMAILS


def send_email(toaddr, subject, body):
    if IS_TEST:
        LOG.info(f'Not actually sending email: {toaddr}\n{subject}\n{body}')
        return

    if not IS_PRODUCTION and not SEND_EMAILS:
        LOG.info(
            f'Not actually sending email. Set SEND_EMAILS=1 to send emails in dev mode: {toaddr}\n{subject}\n{body}'
        )
        return

    request_url = 'https://api.mailgun.net/v3/{0}/messages'.format(
        current_app.config.get('MAILGUN_NAME')
    )
    requests.post(
        request_url,
        auth=('api', current_app.config.get('MAILGUN_API_KEY')),
        data={
            'from': current_app.config.get('MAILGUN_SENDER'),
            'to': toaddr,
            'subject': subject,
            'text': body,
        },
    )
