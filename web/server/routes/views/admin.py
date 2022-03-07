# mypy: disallow_untyped_defs=True
from flask import current_app, url_for, g
from flask_user import current_user
from flask_user.signals import user_forgot_password
from werkzeug.exceptions import BadGateway

from log import LOG
from models.alchemy.user import User
from web.server.errors import ItemNotFound, NotificationError
from web.server.data.data_access import Transaction


def send_reset_password(email: str) -> None:
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG

    with Transaction() as transaction:
        user_manager = current_app.user_manager
        user = transaction.find_one_by_fields(
            User, case_sensitive=True, search_fields={'username': email}
        )

        if not user:
            logger.warning('User does not exist with email: \'%s\'', email)
            raise ItemNotFound('user', {'username': email})

        # Generate reset password token
        token = user_manager.generate_token(int(user.get_id()))
        reset_password_link = url_for(
            'user.reset_password', token=token, _external=True
        )

        # Create reset password email message
        email_message = current_app.email_renderer.create_password_reset_message(
            current_user, user, reset_password_link
        )
        logger.info('Sending reset-password email to: \'%s\'', user.username)
        try:
            # Send password reset email
            current_app.notification_service.send_email(email_message)
        except NotificationError:
            error = 'Failed to send reset-password email to: \'%s\'' % user.username
            logger.error(
                'Failed to send reset-password email to: \'%s\'', user.username
            )
            raise BadGateway(error)

        # Store token to db
        user.reset_password_token = token
        user = transaction.add_or_update(user, flush=True)

    # Send forgot_password signal to flask_user to trigger any hooks
    # pylint: disable=W0212
    user_forgot_password.send(current_app._get_current_object(), user=user)
    logger.info(
        'Successfully sent reset password email for user with email: \'%s\'',
        user.username,
    )
