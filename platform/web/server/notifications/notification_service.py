from copy import copy
from web.server.environment import IS_PRODUCTION
from web.server.tasks.notifications import SendEmailTask, SendSMSTask


class NotificationService:
    '''Notification service class'''

    def __init__(self, sms_client_kwargs, email_client_kwargs):
        self.sms_client_kwargs = sms_client_kwargs
        self.email_client_kwargs = copy(email_client_kwargs)

    def _run_task(self, task, *args, **kwargs):
        # we want to make dev lives easier and don't require they to run celery
        # to be able to send emails
        apply_func = getattr(task, 'apply_async' if IS_PRODUCTION else 'apply')
        apply_func(args, kwargs)

    def send_email(self, message):
        '''Sends an email asynchronously'''
        self._run_task(SendEmailTask, self.email_client_kwargs, message.to_json())

    def send_sms(self, phone_number, message_body):
        '''Send an sms asynchronously'''
        self._run_task(
            SendSMSTask,
            self.sms_client_kwargs,
            phone_number=phone_number,
            message_body=message_body,
        )
