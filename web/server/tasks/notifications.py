import related
from log import LOG
from web.server.errors.errors import NotificationError
from web.server.notifications.sms_client import TwilioClient
from web.server.util.email_client import EmailMessage, EmailClient
from web.server.workers import celery_app


@celery_app.register_task
class SendEmailTask(celery_app.Task): # type: ignore[name-defined]
    name = 'send_email_task'
    ignore_result = True

    # pylint: disable=W0221
    # Suppressing this because I added an argument for message causing the signature to differ
    # from that of method I am overriding
    def run(self, email_client_kwargs, json_msg, *args, **kwargs):
        msg = related.from_json(json_msg, EmailMessage)
        EmailClient(**email_client_kwargs).send(mail_msg=msg)


@celery_app.register_task
class SendSMSTask(celery_app.Task): # type: ignore[name-defined]
    name = 'send_sms_task'
    ignore_result = True

    # pylint: disable=W0221
    # Suppressing this because I added an argument for message causing the signature to differ
    # from that of method I am overriding
    def run(self, sms_client_kwargs, *args, **kwargs):
        try:
            sms_client = TwilioClient(**sms_client_kwargs)
            phone_number = kwargs.get('phone_number')
            message_body = kwargs.get('message_body')
            sms_client.send(phone_number, message_body)
            LOG.info('Successfully sent sms to phone number: %s', phone_number)
        except NotificationError as e:
            LOG.error(
                (
                    'Failed to send sms to phone number:'
                    '%s in the background with message: %s and status code: %s'
                ),
                phone_number,
                e.message,
                e.status_code,
            )
