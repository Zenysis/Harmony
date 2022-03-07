from abc import ABC, abstractmethod
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from web.server.errors import NotificationError


class SMSClient(ABC):
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
            raise NotificationError(status_code=400, message=e.msg) from e
