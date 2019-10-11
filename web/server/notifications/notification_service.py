from builtins import object
from abc import ABCMeta, abstractmethod
from future.utils import with_metaclass


class NotificationService(with_metaclass(ABCMeta, object)):
    def __init__(self, email_client, sms_client):
        self.email_client = email_client
        self.sms_client = sms_client

    @abstractmethod
    def send_email(self, message):
        pass

    @abstractmethod
    def send_sms(self, phone_number, message_body):
        pass


class SynchronousNotificationService(NotificationService):
    '''Synchronous Notification service class
    '''

    def send_email(self, message):
        '''Sends an email message using the specified email client

        Parameters
        ----------
        message : EmailMessage
            The instance of EmailMessage.
        '''
        self.email_client.send(message)

    def send_sms(self, phone_number, message_body):
        self.sms_client.send(phone_number, message_body)


class AsynchronousNotificationService(NotificationService):
    def __init__(self, email_client, sms_client, celery_worker):
        self.celery_worker = celery_worker
        super(AsynchronousNotificationService, self).__init__(email_client, sms_client)

    '''Asynchronous Notification service class
    '''

    def send_email(self, message):
        '''Sends an email asynchronously
        '''
        self.celery_worker.send_task('send_email_task', args=[message.to_json()])

    def send_sms(self, phone_number, message_body):
        ''' Send an sms asynchronously'''
        self.celery_worker.send_task(
            'send_sms_task',
            kwargs={'phone_number': phone_number, 'message_body': message_body},
        )
