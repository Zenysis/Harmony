'''Email client module
'''
from builtins import object
from abc import ABCMeta, abstractmethod
import requests
import related

from web.server.errors import NotificationError
from future.utils import with_metaclass


@related.immutable
class EmailMessage(object):
    '''Mailgun message
    '''

    subject = related.StringField()
    body = related.StringField()
    html = related.StringField()
    to_addr = related.StringField()
    cc = related.SetField(str, required=False)
    bcc = related.SetField(str, required=False)
    attachments = related.SetField(tuple, required=False)

    tag = related.StringField(required=False)
    sender = related.StringField(required=False)

    def add_cc(self, mail_addr):
        self.cc.add(mail_addr)

    def add_bcc(self, mail_addr):
        self.bcc.add(mail_addr)

    def to_json(self):
        return related.to_json(self)


class EmailClient(with_metaclass(ABCMeta, object)):
    '''Abstract class that represents an email client.
    '''

    @abstractmethod
    def send(self, mail_msg):
        pass


class MailgunClient(EmailClient):
    '''Mailgun email client
    '''

    def __init__(self, sender, api_key, api_url):
        self.sender = sender
        self.api_url = api_url
        self.api_key = api_key

    def send(self, mail_msg):
        '''Sends an email message

        Parameters
        ----------
        message : EmailMessage
            The instance of EmailMessage.

        Raises
        ---------
        NotificationError
            - If there is a failure when sending a message
        '''

        data = {
            'from': mail_msg.sender if mail_msg.sender else self.sender,
            'to': mail_msg.to_addr,
            'subject': mail_msg.subject,
            'text': mail_msg.body,
        }
        if mail_msg.cc:
            data['cc'] = mail_msg.cc
        if mail_msg.bcc:
            data['bcc'] = mail_msg.bcc
        if mail_msg.html:
            data['html'] = mail_msg.html
        if mail_msg.tag:
            # Add tag to allow unsubscribing from emails with this tag
            data['o:tag'] = mail_msg.tag

        request_params = {
            'url': self.api_url,
            'auth': ('api', self.api_key),
            'data': data,
        }
        if mail_msg.attachments:
            request_params.update({'files': list(mail_msg.attachments)})

        r = requests.post(**request_params)
        if r.status_code == 200:
            return

        errors = {
            400: 'Bad Request - Often missing a required parameter',
            401: 'Unauthorized - No valid API key provided',
            402: 'Request Failed - Parameters were valid but request failed',
            404: 'Not Found - The requested item does not exist',
            413: 'Request Entity Too Large - Attachment size is too big',
            500: 'Server Errors - something is wrong on Mailgun\'s end',
        }
        default_error = (
            'Mailgun client failed to send message to: %s' % mail_msg.to_addr
        )
        raise NotificationError(
            message=errors.get(r.status_code, default_error), status_code=r.status_code
        )
