import related
import requests
from celery.task.base import Task

from log import LOG
from util.credentials.provider import CredentialProvider
from web.server.configuration.instance import load_instance_configuration_from_file
from web.server.util.email_client import EmailMessage, MailgunClient
from web.server.notifications.sms_client import TwilioClient
from web.server.errors.errors import NotificationError
from web.server.environment import IS_PRODUCTION

class SendEmailTask(Task):
    name = 'send_email_task'
    _email_client = None

    @property
    def email_client(self):
        if not self._email_client:
            instance_configuration = load_instance_configuration_from_file()
            with CredentialProvider(instance_configuration) as provider:
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
            with CredentialProvider(instance_configuration) as provider:
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


class SendDashboardReportTask(Task):
    '''SendDashboardReportTask celery task that emails recipients a dashboard report'''

    name = 'send_dashboard_report_task'

    def run(self, *args, **kwargs):
        recipients = kwargs.get('recipients')
        subject = kwargs.get('subject')
        message = kwargs.get('message')
        should_attach_pdf = kwargs.get('should_attach_pdf')
        should_embed_image = kwargs.get('should_embed_image')
        dashboard_resource_id = kwargs.get('dashboard_resource_id')
        sender = kwargs.get('sender')
        dashboard_url = kwargs.get('dashboard_url')
        use_single_email_thread = kwargs.get('use_single_email_thread', False)
        use_recipient_query_policy = kwargs.get('use_recipient_query_policy', True)
        user_group_recipients = kwargs.get('user_group_recipients', [])
        if user_group_recipients:
            recipients.extend(user_group_recipients)
            # remove duplicates
            recipients = list(set(recipients))

        dash_host = 'localhost'
        if IS_PRODUCTION:
            # In production, a user-defined docker network bridge will resolve
            # this hostname.
            dash_host = 'web'

        api_url = 'http://%s:5000/api2/dashboard/%d/share_via_email' % (
            dash_host,
            dashboard_resource_id,
        )

        # NOTE(open source): any implementer of alerts with our opensource offering will need
        # to determin the best way forward here. Creating pipeline user/temporary access token
        # for the AuthenticatedSession.
        username, password = '', ''
        session = requests.Session()
        res = session.post(
            api_url,
            json={
                'recipients': recipients,
                'subject': subject,
                'message': message,
                'shouldAttachPdf': should_attach_pdf,
                'shouldEmbedImage': should_embed_image,
                'sender': sender,
                'dashboardUrl': dashboard_url,
                'isScheduledReport': True,
                'useSingleEmailThread': use_single_email_thread,
                'useRecipientQueryPolicy': use_recipient_query_policy,
            },
            headers={'X-Username': username, 'X-Password': password},
        )
        if res.status_code != 200:
            msg = (
                'Failed to send pdf dashboard report email to:'
                f'{recipients} with status code: {res.status_code} via {api_url}'
                f' \n: response body: {res.text}'
            )
            LOG.error(msg)
        else:
            msg = f'Successfully sent pdf dashboard report emails to: {recipients}'
            LOG.info(msg)
