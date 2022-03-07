import base64
from flask import current_app, g
from werkzeug.exceptions import BadGateway

from flask_potion import Resource, fields
from flask_potion.routes import Route
from flask_potion.schema import FieldSet

from log import LOG
from models.alchemy.feed import FeedUpdateTypeEnum
from web.server.api.model_schemas import SHARE_ANALYSIS_EMAIL_SCHEMA
from web.server.errors import NotificationError
from web.server.routes.views.feed import add_share_notification

SHARE_ANALYSIS_MESSAGE = 'Analysis shared successfully'
SHARE_ANALYSIS_PREVIEW_MESSAGE = 'A preview email was sent to {recipient}'


class ShareAnalysisResource(Resource):
    class Meta:
        name = 'share'
        title = 'Share Analysis API'
        description = 'The API for sharing analysis'

    # pylint: disable=no-member
    # pylint: disable=R0201
    @Route.POST(
        '/email',
        title='Share analysis by email',
        description='Shares an analysis by email',
        schema=FieldSet(SHARE_ANALYSIS_EMAIL_SCHEMA),
        response_schema=fields.Any(),
    )
    def share_by_email(self, **kwargs):
        shared_image_name = 'share_analysis.png'
        logger = g.request_logger if hasattr(g, 'request_logger') else LOG

        attachments = []
        file_count = 1
        for attachment in kwargs['attachments']:
            file_name = attachment['filename']
            attachments.append(
                ("attachment", (f'{file_count}__{file_name}', attachment['content']))
            )
            file_count += 1

        base64_image_str = kwargs.get('image_url')
        if base64_image_str:
            base64_image_str = base64_image_str.replace('data:image/png;base64,', '')
            attachments.append(
                (
                    "inline",
                    (
                        shared_image_name,
                        base64.decodebytes(base64_image_str.encode('utf-8')),
                    ),
                )
            )
        else:
            shared_image_name = ''
        recipients = kwargs['recipients']
        for recipient in recipients:
            msg = current_app.email_renderer.create_share_analysis_email(
                subject=kwargs['subject'],
                to_addr=recipient,
                reply_to=kwargs['sender'],
                body=kwargs['message'],
                attachments=attachments,
                query_url=kwargs['query_url'],
                image=shared_image_name,
            )
            try:
                current_app.notification_service.send_email(msg)
                add_share_notification(
                    FeedUpdateTypeEnum.ANALYSIS_SHARED.value,
                    g.identity.id,
                    recipient,
                    {'query_url': kwargs['query_url']},
                )
            except NotificationError:
                error = 'Failed to send share analysis email to: \'%s\'' % recipient
                logger.error(error)
                raise BadGateway(error)

        message = (
            SHARE_ANALYSIS_PREVIEW_MESSAGE.format(
                recipient=','.join(kwargs['recipients'])
            )
            if kwargs.get('is_preview', False)
            else SHARE_ANALYSIS_MESSAGE
        )
        return {'message': message}


RESOURCE_TYPES = [ShareAnalysisResource]
