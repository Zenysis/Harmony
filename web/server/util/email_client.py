'''Email client module
'''
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from functools import wraps
import smtplib
import ssl
from typing import Optional, Union

import related

from log import LOG
from web.server.environment import IS_TEST
from web.server.errors import NotificationError


@related.immutable
class EmailMessage:
    '''Mailgun message'''

    subject = related.StringField()
    body = related.StringField()
    html = related.StringField()
    to_addr = related.StringField()
    # pylint: disable=invalid-name
    cc = related.SetField(str, required=False)
    bcc = related.SetField(str, required=False)
    attachments = related.SequenceField(tuple, required=False)

    tags = related.SequenceField(str, required=False)
    sender = related.StringField(required=False)

    def add_cc(self, mail_addr):
        self.cc.add(mail_addr)

    def add_bcc(self, mail_addr):
        self.bcc.add(mail_addr)

    def to_json(self):
        return related.to_json(self)


def disable_for_tests(func):
    # NOTE: this is because we don't want to send real email when testing.
    # TODO: think about adding a simple SMTP server to the e2e testing environment.
    @wraps(func)
    def inner(*args, **kwargs):
        if not IS_TEST:
            return func(*args, **kwargs)

        LOG.info(
            'Skipping %s with arguments %s %s while in test mode', func, args, kwargs
        )
        return None

    return inner


class EmailClient:
    '''An email client that uses SMTP protocol to send emails'''

    client: Union[None, smtplib.SMTP, smtplib.SMTP_SSL] = None

    @disable_for_tests
    def __init__(
        self,
        email_host: str,
        email_host_user: str,
        email_port: int,
        email_credential_id: Optional[int] = None,
        email_host_password: Optional[str] = None,
        email_use_encryption: Optional[str] = None,
        email_tag_header_name: Optional[str] = None,
    ) -> None:
        self.email_tag_header_name = email_tag_header_name
        self.email_host_user = email_host_user

        context = ssl.create_default_context()
        if email_use_encryption == 'ssl':
            self.client = smtplib.SMTP_SSL(email_host, email_port, context=context)
        else:
            self.client = smtplib.SMTP(email_host, email_port)
            if email_use_encryption == 'tls':
                self.client.starttls(context=context)

        assert email_host_user
        assert email_host_password
        self.client.login(email_host_user, email_host_password)

    @disable_for_tests
    def send(self, mail_msg: EmailMessage):
        if not self.client:
            raise RuntimeError('Attempt to `send` without `client`')

        msg = MIMEMultipart("alternative")
        sender = mail_msg.sender if mail_msg.sender else self.email_host_user
        msg['From'] = sender
        msg['To'] = mail_msg.to_addr
        msg['Subject'] = mail_msg.subject

        to_addr = [mail_msg.to_addr]
        if mail_msg.cc:
            msg['Cc'] = ','.join(mail_msg.cc)
            to_addr.extend(list(mail_msg.cc))

        if mail_msg.bcc:
            msg['Bcc'] = ','.join(mail_msg.bcc)
            to_addr.extend(list(mail_msg.bcc))

        body = MIMEText(mail_msg.body, 'plain')
        if mail_msg.html:
            body = MIMEText(mail_msg.html, 'html')

        msg.attach(body)
        if mail_msg.attachments:
            for _, (name, attachment) in mail_msg.attachments:
                self.attach_file(msg, name, attachment)

        if self.email_tag_header_name:
            for tag in mail_msg.tags:
                msg.add_header(self.email_tag_header_name, tag)
        try:
            self.client.sendmail(self.email_host_user, to_addr, msg.as_string())
        except smtplib.SMTPException as ex:
            raise NotificationError(str(ex), 500) from ex

    def attach_file(self, msg: MIMEMultipart, name: str, attachment: str):
        mime_base = MIMEBase("application", "octet-stream")
        mime_base.set_payload(base64.decodebytes(attachment.encode()))
        encoders.encode_base64(mime_base)
        mime_base.add_header(
            'Content-Disposition',
            f'attachment; filename={name}',
        )
        mime_base.add_header('Content-ID', name)
        msg.attach(mime_base)

    @disable_for_tests
    def __del__(self):
        if self.client:
            self.client.quit()
