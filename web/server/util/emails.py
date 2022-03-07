# pylint: disable=R0903
from builtins import zip, object
from datetime import datetime
from enum import Enum
from past.utils import old_div
from flask import current_app

import global_config
from models.alchemy.user import User
from web.server.util.email_client import EmailMessage
from web.server.configuration.settings import get_configuration, PROJECT_MANAGER_ID_KEY
from web.server.util.email_translations import (
    INVITATION_EMAIL_TRANSLATIONS,
    PASSWORD_RESET_TRANSLATIONS,
    ALERT_EMAIL_TRANSLATIONS,
    ACCESS_GRANTED_EMAIL_TRANSLATIONS,
    NEW_DASHBOARD_EMAIL_TRANSLATIONS,
    SHARE_ANALYSIS_EMAIL_TRANSLATIONS,
    SHARE_DASHBOARD_EMAIL_TRANSLATIONS,
)
from web.server.util.html_email_builder import HTMLEmailBuilder

RESET_PASSWORD_BODY_EN = '''
Dear %s,

Please reset your password at this URL: %s

This URL will expire in %d days.
'''

RESET_PASSWORD_BODY_FR = '''
Cher %s,

Veuillez réinitialiser votre mot de passe à cette adresse URL: %s

Cette URL expirera dans %d jours.
'''

INVITE_USER_BODY_FR = '''
Cher %s,

Vous avez été invité a créer un compte %s.

Veuillez bien vous connecter à ce lien: %s
'''

INVITE_USER_BODY_EN = '''
Dear %s,

You have been invited to create a %s account.  Please sign up at this URL: %s
'''

NEW_DASHBOARD_EN = '''
Hello %s,

Here is a link to your new %s dashboard: %s
'''
ADD_TO_DASHBOARD_EN = '''
Hello,

You have been given %s access to the dashboard: %s
'''

NEW_ALERTS_BODY_EN = '''
Hello,

Based on indicator Alerts, there are new notifications to view.
'''

NEW_ALERTS_BODY_PT = '''
Olá,

Com base nos alertas do indicador, há novas notificações para exibição.
'''

SUPPORT_TEXT = 'Need help?'
SUPPORT_CONTACT = f'We\'re ready to assist, email us at {global_config.SUPPORT_EMAIL}'

ALERT_NOTIFICATION_TAG = 'alert_notification'
NEW_DAHSBOARD_CREATED_TAG = 'new_dashboard_created'
PASSWORD_RESET_TAG = 'password_reset'
PLATFORM_INVITATION_TAG = 'platform_invitation'
DASHBOARD_ACCESS_GRANTED_TAG = 'dashboard_access_granted'
SHARE_AQT_ANALYSIS_TAG = 'share_aqt_analysis'
SHARE_DASHBOARD_REPORT_TAG = 'share_dashboard_report'
SCHEDULED_DASHBOARD_REPORT_TAG = 'scheduled_dashboard_report'
DATA_UPLOAD_TAG = 'data_upload'

SHARE_DASHBOARD_PDF_BODY = '''
The attached dashboard PDF has been shared with you.
'''


class DashboardViewSources(Enum):
    DASHBOARD_PERMISSION_EMAIL = 'dashboard_permission_email'
    NEW_DASHBOARD_EMAIL = 'new_dashboard_email'
    DASHBOARD_SCHEDULED_REPORT_EMAIL = 'dashboard_scheduled_report_email'
    SHARED_DASHBOARD_EMAIL = 'shared_dashboard_email'


class EmailRenderer(object):
    def __init__(
        self,
        default_locale,
        deployment_abbreviated_name,
        deployment_full_name,
        deployment_base_url,
        full_platform_name,
    ):
        self.default_locale = default_locale
        self.deployment_abbreviated_name = deployment_abbreviated_name
        self.deployment_full_name = deployment_full_name
        self.deployment_base_url = deployment_base_url
        self.full_platform_name = full_platform_name

    def get_email_sender(self, sending_user):
        return f'{sending_user.first_name} {sending_user.last_name} <{sending_user.username}>'

    def create_password_reset_message(
        self, resetting_user, target_user, reset_password_link
    ):
        subject = 'Reset Password: %s' % self.deployment_full_name
        body_template = RESET_PASSWORD_BODY_EN

        if self.default_locale == 'fr':
            subject = 'Réinitialiser le mot de passe: %s' % self.deployment_full_name
            body_template = RESET_PASSWORD_BODY_FR
        full_name = '%s %s' % (target_user.first_name, target_user.last_name)
        expiration_days = old_div(
            current_app.config.get('USER_RESET_PASSWORD_EXPIRATION'), (24 * 3600)
        )
        body = body_template % (full_name, reset_password_link, expiration_days)

        html_builder = HTMLEmailBuilder(
            'web/server/templates/emails/password_reset_email.html'
        )
        html_builder.set_translations(
            PASSWORD_RESET_TRANSLATIONS,
            self.default_locale,
            first_name=target_user.first_name,
            platform_name=self.deployment_full_name,
            support_email=global_config.SUPPORT_EMAIL,
            expiration_days=expiration_days,
        )
        html = html_builder.generate_html(
            reset_link=reset_password_link,
            help_question_text=SUPPORT_TEXT,
            support_text=SUPPORT_CONTACT,
            support_email=global_config.SUPPORT_EMAIL,
            first_name=target_user.first_name,
        )

        cc_email = (
            resetting_user.username if hasattr(resetting_user, 'username') else None
        )
        msg = EmailMessage(
            subject=subject,
            body=body,
            to_addr=target_user.username,
            html=html,
            cc=[],
            bcc=[],
            tags=[self.deployment_abbreviated_name, PASSWORD_RESET_TAG],
        )

        if cc_email:
            msg.add_cc(cc_email)
        return msg

    def bcc_project_managers(self, email_msg):
        # pylint: disable=no-member
        # User has query object
        bcc_users = User.query.filter(
            User.id.in_(get_configuration(PROJECT_MANAGER_ID_KEY))
        ).all()
        for user in bcc_users:
            email_msg.add_bcc(user.username)

    def create_invitation_message(self, inviting_user, pending_user, invite_link):
        subject = f'Your {self.deployment_full_name} Invite'
        body_template = INVITE_USER_BODY_EN

        if self.default_locale == 'fr':
            subject = '''Votre invitation au Système d'Analyse des Données'''
            body_template = INVITE_USER_BODY_FR

        body = body_template % (
            pending_user.first_name,
            self.deployment_full_name,
            invite_link,
        )
        html_builder = HTMLEmailBuilder(
            'web/server/templates/emails/invitation_email.html'
        )
        html_builder.set_translations(
            INVITATION_EMAIL_TRANSLATIONS,
            self.default_locale,
            first_name=pending_user.first_name,
            platform_name=self.deployment_full_name,
            support_email=global_config.SUPPORT_EMAIL,
        )
        html = html_builder.generate_html(
            invite_link=invite_link, support_email=global_config.SUPPORT_EMAIL
        )
        msg = EmailMessage(
            subject=subject,
            body=body,
            to_addr=pending_user.username,
            html=html,
            cc=[],
            bcc=[],
            sender=self.get_email_sender(inviting_user),
            tags=[self.deployment_abbreviated_name, PLATFORM_INVITATION_TAG],
        )
        msg.add_cc(inviting_user.username)
        self.bcc_project_managers(msg)
        return msg

    def create_new_dashboard_message(
        self,
        dashboard_author,
        deployment_name,
        dashboard_link,
        dashboard_name,
        dashboard_slug,
    ):
        subject = 'Your New %s Dashboard' % deployment_name
        body_template = NEW_DASHBOARD_EN
        dashboard_link = (
            f'{dashboard_link}?source={DashboardViewSources.NEW_DASHBOARD_EMAIL.value}'
        )

        body = body_template % (
            dashboard_author.first_name,
            deployment_name,
            dashboard_link,
        )
        html_builder = HTMLEmailBuilder(
            'web/server/templates/emails/new_dashboard_email.html'
        )
        html_builder.set_translations(
            NEW_DASHBOARD_EMAIL_TRANSLATIONS,
            self.default_locale,
            first_name=dashboard_author.first_name,
            platform_name=self.deployment_full_name,
            support_email=global_config.SUPPORT_EMAIL,
            dashboard_name=dashboard_name,
        )
        html = html_builder.generate_html(
            first_name=dashboard_author.first_name,
            dashboard_link=dashboard_link,
            platform_name=self.deployment_full_name,
            help_question_text=SUPPORT_TEXT,
            support_text=SUPPORT_CONTACT,
            support_email=global_config.SUPPORT_EMAIL,
        )
        msg = EmailMessage(
            subject=subject,
            body=body,
            to_addr=dashboard_author.username,
            html=html,
            cc=[],
            bcc=[],
            tags=[
                self.deployment_abbreviated_name,
                NEW_DAHSBOARD_CREATED_TAG,
                dashboard_slug,
            ],
            sender=self.get_email_sender(dashboard_author),
        )
        return msg

    # pylint: disable=R0201
    def create_share_analysis_email(
        self, subject, to_addr, reply_to, body, attachments, query_url, image=None
    ):

        html_builder = HTMLEmailBuilder('web/server/templates/emails/share_email.html')

        body_message = body.split('\n')

        html_builder.set_translations(
            SHARE_ANALYSIS_EMAIL_TRANSLATIONS, support_email=global_config.SUPPORT_EMAIL
        )
        html = html_builder.generate_html(
            body_message=body_message,
            shared_link=query_url,
            embedded_image=image,
            support_email=global_config.SUPPORT_EMAIL,
        )
        query_slug = query_url.split('/')[-1]
        msg = EmailMessage(
            subject=subject,
            body=body,
            to_addr=to_addr,
            html=html,
            cc=[],
            bcc=[reply_to],
            sender=reply_to,
            attachments=attachments,
            tags=[self.deployment_abbreviated_name, SHARE_AQT_ANALYSIS_TAG, query_slug],
        )
        return msg

    def create_add_dashboard_user_message(
        self,
        to_addr,
        new_roles,
        dashboard_url,
        dashboard_name,
        dashboard_owner,
        dashboard_slug,
    ):
        subject = 'Granted Access to Dashboard'
        permissions = ', '.join(new_roles.get(to_addr)).replace('dashboard_', '')
        source = DashboardViewSources.DASHBOARD_PERMISSION_EMAIL.value
        dashboard_url = f'{dashboard_url}?source={source}'
        body = ADD_TO_DASHBOARD_EN % (permissions, dashboard_url)

        html_builder = HTMLEmailBuilder(
            'web/server/templates/emails/access_granted_email.html'
        )
        html_builder.set_translations(
            ACCESS_GRANTED_EMAIL_TRANSLATIONS,
            self.default_locale,
            granted_permissions=permissions,
            platform_name=self.deployment_full_name,
            support_email=global_config.SUPPORT_EMAIL,
            dashboard_name=dashboard_name,
            dashboard_owner=f'{dashboard_owner.first_name} {dashboard_owner.last_name}',
        )
        html = html_builder.generate_html(
            granted_permissions=permissions,
            dashboard_link=dashboard_url,
            platform_name=self.deployment_full_name,
            help_question_text=SUPPORT_TEXT,
            support_text=SUPPORT_CONTACT,
            support_email=global_config.SUPPORT_EMAIL,
        )
        msg = EmailMessage(
            subject=subject,
            body=body,
            to_addr=to_addr,
            html=html,
            cc=[],
            bcc=[],
            tags=[
                self.deployment_abbreviated_name,
                DASHBOARD_ACCESS_GRANTED_TAG,
                dashboard_slug,
            ],
            sender=self.get_email_sender(dashboard_owner),
        )
        return msg

    @classmethod
    def get_date_str(cls):
        '''Get more human readable date.
        '''
        return datetime.today().strftime('%B %d')

    def create_alert_notification_message(
        self, new_notifs_list, existing_notifs_list, recipients, link
    ):
        '''Creates email message for newly generated alert notifications for a list
        of recipients
        '''
        # We want to use the same subject per day so it is part of the same email
        # thread
        date_str = EmailRenderer.get_date_str()
        subject = 'New Alerts for {date} from {deploy_name}'.format(
            date=date_str, deploy_name=self.full_platform_name
        )
        body = NEW_ALERTS_BODY_EN

        if self.default_locale == 'pt':
            subject = 'Novos Alertas para {date} do {deploy_name}'.format(
                date=date_str, deploy_name=self.full_platform_name
            )
            body = NEW_ALERTS_BODY_PT

        sender = global_config.NOREPLY_EMAIL

        html_builder = HTMLEmailBuilder(
            'web/server/templates/emails/alert_notifications.html'
        )
        html_builder.set_translations(
            ALERT_EMAIL_TRANSLATIONS,
            self.default_locale,
            platform_name=self.full_platform_name,
            support_email=global_config.SUPPORT_EMAIL,
        )
        html_str = html_builder.generate_html(
            alerts_link=link,
            new_notifications=new_notifs_list,
            existing_notifications=existing_notifs_list,
            platform_name=self.full_platform_name,
            support_email=global_config.SUPPORT_EMAIL,
        )

        return EmailMessage(
            subject=subject,
            body=body,
            to_addr=sender,
            html=html_str,
            cc=[],
            bcc=recipients,
            tags=[self.deployment_abbreviated_name, ALERT_NOTIFICATION_TAG],
        )

    def create_data_upload_alert_message(
        self, filenames, destinations, category, datestamp, uploading_user
    ):
        # Add default notifies until we are sure that ALL deployments have
        # configured project managers.
        cc = global_config.DATA_UPLOAD_DEFAULT_NOTIFY
        to_addr = cc[0]

        base_url = self.deployment_base_url
        urls = ['%s/%s' % (base_url, path) for path in destinations]
        links = [
            '<a href="%s">%s</a>' % (url, name) for url, name in zip(urls, filenames)
        ]
        subject = '%s Data Upload - %s - %s' % (
            self.deployment_abbreviated_name,
            category,
            datestamp,
        )
        body = 'New files for "%s":\n\n%s' % (category, '\n'.join(links))
        email_msg = EmailMessage(
            subject=subject,
            body='',
            to_addr=to_addr,
            html=body,
            cc=cc,
            bcc=[],
            sender=self.get_email_sender(uploading_user),
            tags=[self.deployment_abbreviated_name, DATA_UPLOAD_TAG],
        )
        self.bcc_project_managers(email_msg)

        return email_msg

    def create_share_dashboard_pdf_message(
        self,
        recipients,
        pdf_attachment_list,
        body,
        subject,
        dashboard_url,
        sender,
        image,
        slug,
        **kwargs,
    ):
        html_builder = HTMLEmailBuilder('web/server/templates/emails/share_email.html')
        body_message = body.split('\n')
        is_scheduled_report = kwargs.get('is_scheduled_report')
        use_email_thread = kwargs.get('use_email_thread')

        html_builder.set_translations(
            SHARE_DASHBOARD_EMAIL_TRANSLATIONS, support_email=global_config.SUPPORT_EMAIL
        )
        source = (
            DashboardViewSources.DASHBOARD_SCHEDULED_REPORT_EMAIL.value
            if is_scheduled_report
            else DashboardViewSources.SHARED_DASHBOARD_EMAIL.value
        )
        dashboard_url = f'{dashboard_url}?source={source}'
        html = html_builder.generate_html(
            body_message=body_message,
            shared_link=dashboard_url,
            embedded_image=image,
            support_email=global_config.SUPPORT_EMAIL,
        )

        email_tag = (
            SCHEDULED_DASHBOARD_REPORT_TAG
            if is_scheduled_report
            else SHARE_DASHBOARD_REPORT_TAG
        )

        return EmailMessage(
            subject=subject,
            body=body,
            to_addr=sender,
            cc=recipients if use_email_thread else [],
            bcc=recipients if not use_email_thread else [],
            html=html,
            sender=sender,
            attachments=pdf_attachment_list,
            tags=[self.deployment_abbreviated_name, email_tag, slug],
        )
