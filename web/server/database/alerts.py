from builtins import str
from slugify import slugify
from uuid import uuid4

from flask_user import current_user
from models.alchemy.permission import ResourceTypeEnum
from web.server.potion.managers import AuthorizationResourceManager
from web.server.util.util import get_user_string
from web.server.routes.views.users import add_user_role


def compute_authorization_label(alert_definition):
    user_string = get_user_string(
        alert_definition.user or current_user, include_ip=False
    )
    text_label = (
        'Alert on {indicator} by {time_bucket} and {granularity}. ' 'Created by {user}'
    ).format(
        indicator=alert_definition.field_id,
        time_bucket=alert_definition.time_granularity,
        granularity=alert_definition.dimension_name,
        user=user_string,
    )
    return text_label


def make_author_alert_administrator(transaction, authorization_item, user=None):
    user = user or current_user
    add_user_role(
        user or current_user,
        'alert_admin',
        ResourceTypeEnum.ALERT.name,
        authorization_item.name,
        session=transaction._session,
        commit=False,
    )


class AlertDefinitionManager(AuthorizationResourceManager):
    def before_create(self, transaction, alert_definition, authorization_item):
        alert_definition.user_id = current_user.id
        make_author_alert_administrator(transaction, authorization_item)

    def create_authorization_model(self, alert_definition, authorization_item):
        # Only update the `name` which we'll keep as a UUID4 since the user
        # doesn't really come up with a name for this item.
        authorization_item.name = slugify(str(uuid4()), separator='_')
        self.update_authorization_model(alert_definition, {}, authorization_item)

    def update_authorization_model(self, alert_definition, changes, authorization_item):
        authorization_item.label = compute_authorization_label(alert_definition)
        authorization_item.resource_type_id = ResourceTypeEnum.ALERT.value
