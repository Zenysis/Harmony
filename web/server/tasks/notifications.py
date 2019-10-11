import related
from celery.task.base import Task

from log import LOG
from web.server.configuration.instance import load_instance_configuration_from_file
from util.credentials.vault.provisioning import CredentialProvider, TWILIO_SECRETS_FILE
from web.server.util.email_client import EmailMessage, MailgunClient
from web.server.notifications.sms_client import TwilioClient
from web.server.errors.errors import NotificationError

TWILIO_SECRETS_CONFIGURATION = {
    'authToken': '{file_name}:authToken'.format(file_name=TWILIO_SECRETS_FILE),
    'accountSid': '{file_name}:accountSid'.format(file_name=TWILIO_SECRETS_FILE),
    'phoneNumber': '{file_name}:phoneNumber'.format(file_name=TWILIO_SECRETS_FILE),
}

MAILGUN_SECRETS_CONFIGURATION = {
    'apiKey': '{file_name}:apiKey'.format(file_name=TWILIO_SECRETS_FILE),
    'senderDomain': '{file_name}:senderDomain'.format(file_name=TWILIO_SECRETS_FILE),
    'senderEmailAddress': '{file_name}:senderEmailAddress'.format(
        file_name=TWILIO_SECRETS_FILE
    ),
}


class SendEmailTask(Task):
    name = 'send_email_task'
    _email_client = None

    @property
    def email_client(self):
        if not self._email_client:
            instance_configuration = load_instance_configuration_from_file()
            with CredentialProvider(
                MAILGUN_SECRETS_CONFIGURATION,
                deployment_name=instance_configuration.get('deployment_name'),
                environment=instance_configuration.get('environment'),
                secret_id=instance_configuration.get('secret_id'),
            ) as provider:
                self._email_client = MailgunClient(
                    provider.get('senderEmailAddress'),
                    provider.get('apiKey'),
                    provider.get('senderDomain'),
                )
        return self._email_client

    # pylint: disable=W0221
    # Suppressing this because I added an argument for message causing the signature to differ
    # from that of method I am overriding
    def run(self, json_msg, *args, **kwargs):
        msg = related.from_json(json_msg, EmailMessage)
        try:
            self.email_client.send(mail_msg=msg)
        except NotificationError:
            LOG.error('Failed to send email to %s in the background', msg.to_addr)


class SendSMSTask(Task):
    name = 'send_sms_task'
    _sms_client = None

    @property
    def sms_client(self):
        if not self._sms_client:
            instance_configuration = load_instance_configuration_from_file()
            with CredentialProvider(
                TWILIO_SECRETS_CONFIGURATION,
                deployment_name=instance_configuration.get('deployment_name'),
                environment=instance_configuration.get('environment'),
                secret_id=instance_configuration.get('secret_id'),
            ) as provider:
                self._sms_client = TwilioClient(
                    provider.get('accountSid'),
                    provider.get('authToken'),
                    provider.get('phoneNumber'),
                )
        return self._sms_client

    def run(self, *args, **kwargs):
        try:
            phone_number = kwargs.get('phone_number')
            message_body = kwargs.get('message_body')
            self.sms_client.send(phone_number, message_body)
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
