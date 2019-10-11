from builtins import object
from abc import ABCMeta, abstractmethod
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from web.server.errors import NotificationError
from future.utils import with_metaclass


class SMSClient(with_metaclass(ABCMeta, object)):
    ''' Abstract sms client class'''

    @abstractmethod
    def send(self, phone_number, message_body):
        pass


class TwilioClient(SMSClient):
    def __init__(self, account_sid, auth_token, twilio_phone_number):
        self.twilio_phone_number = twilio_phone_number
        self.client = Client(account_sid, auth_token)

    def send(self, phone_number, message_body):
        try:
            message_response = self.client.messages.create(
                from_=self.twilio_phone_number, to=phone_number, body=message_body
            )
            return message_response
        except TwilioRestException as e:
            raise NotificationError(status_code=400, message=e.msg)
