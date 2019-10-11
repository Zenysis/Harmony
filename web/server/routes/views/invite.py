from flask import current_app, g, url_for
from flask_user import current_user
from werkzeug.exceptions import BadGateway

from log import LOG
from web.server.errors import NotificationError


def send_invite_emails(pending_users):
    '''Send an invite email to every pending user in the list'''
    user_manager = current_app.user_manager
    db_adapter = user_manager.db_adapter
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG

    for user in pending_users:
        logger.info('Sending email invite to: \'%s\'', user.username)
        # generate invite token
        token = user_manager.generate_token(int(user.id))
        invite_link = url_for('user.register', token=token, _external=True)

        email_msg = current_app.email_renderer.create_invitation_message(
            current_user, user, invite_link
        )
        try:
            # send invite email
            current_app.notification_service.send_email(email_msg)
        except NotificationError:
            error = 'Failed to send invitation email to: \'%s\'' % user.username
            logger.error('Failed to send invitation email to: \'%s\'', user.username)
            raise BadGateway(error)

        # store token to db
        db_adapter.update_object(user, reset_password_token=token)
    db_adapter.commit()
