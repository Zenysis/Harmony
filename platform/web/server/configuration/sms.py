'''
SMS Configurations for twilio
'''
from os import getenv

DEFAULT_ACCOUNT_SID = 'account-sid'
DEFAULT_AUTH_TOKEN = 'auth-token'
DEFAULT_PHONE_NUMBER = 'phone-number'


class SMSConfig:
    ACCOUNT_SID = getenv('TWILIO_ACCOUNT_SID', DEFAULT_ACCOUNT_SID)
    AUTH_TOKEN = getenv('TWILIO_AUTH_TOKEN', DEFAULT_AUTH_TOKEN)
    TWILIO_PHONE_NUMBER = getenv('TWILIO_PHONE_NUMBER', DEFAULT_PHONE_NUMBER)
