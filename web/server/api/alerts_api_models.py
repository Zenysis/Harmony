# pylint: disable=C0103
# pylint: disable=C0413
from http.client import NO_CONTENT, UNAUTHORIZED

from flask import current_app

# NOTE(abby): There's a name conflict with a table column named fields.
from flask_potion import fields as potion_fields
from flask_potion.instances import Instances
from flask_potion.routes import Route
from flask_potion.signals import before_update
from werkzeug.exceptions import MethodNotAllowed

from data.alerts.alerts_query import get_latest_notifications
from models.alchemy.alerts import AlertDefinition, AlertNotification
from web.server.api.api_models import PrincipalResource
from web.server.api.model_schemas import USERNAME_SCHEMA
from web.server.data.data_access import Transaction
from web.server.database.alerts import (
    AlertDefinitionManager,
    get_permitted_alert_fields,
    is_field_permitted_for_user,
)
from web.server.security.permissions import principals, SuperUserPermission
from web.server.potion.filters import UserFilter
from web.server.routes.views.authorization import (
    AuthorizedOperation,
    authorization_required,
)
from web.server.routes.views.alerts import (
    bulk_transfer_alert_def_ownership,
    filter_notifications_by_dimension,
)

from web.server.api.alerts_api_schemas import (
    ALERT_DEFINITION,
    CHECKS,
    COMPARED_VAL,
    DIMENSION_INFO,
    DIMENSION_NAME,
    FIELD_NAMES,
    FIELD_PROPERTIES,
    GENERATION_DATE,
    PATCH_NOTIFICATION_SCHEMA,
    QUERY_INTERVAL,
    REPORTED_VAL,
    TITLE,
    convert_attribute_names,
    TIME_GRANULARITY,
)


def filter_definitions_by_source(query):
    '''Filters a query for alert definitions based on fields a user is permitted
    to see.
    '''
    if (
        SuperUserPermission().can()
        or 'source' not in current_app.zen_config.filters.AUTHORIZABLE_DIMENSIONS
    ):
        return query

    with Transaction() as transaction:
        allow_all_fields, permitted_fields = get_permitted_alert_fields(transaction)
        if allow_all_fields:
            return query

        # A user must have permission to view all fields in an alert definition.
        ids_to_exclude = set()
        for row in query:
            if any(field['id'] not in permitted_fields for field in row.fields):
                ids_to_exclude.add(row.id)
        return query.filter(~AlertDefinition.id.in_(ids_to_exclude))


class AlertDefinitionResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `AlertDefinition`
    class.
    '''

    class Meta:
        manager = principals(AlertDefinitionManager)
        model = AlertDefinition
        excluded_fields = ('id',)

        # Allow querying by user
        filters = {'user': {'eq': UserFilter, None: UserFilter}}
        id_attribute = 'authorization_resource_id'
        target_model_authorization_attribute = 'authorization_resource_id'

    class Schema:
        checks = potion_fields.Any()
        dimensionName = potion_fields.String(attribute='dimension_name', nullable=True)
        filters = potion_fields.List(potion_fields.Any())
        fields = potion_fields.List(potion_fields.Object(properties=FIELD_PROPERTIES))
        timeGranularity = potion_fields.String(attribute='time_granularity')
        userId = potion_fields.Integer(attribute='user_id')
        title = potion_fields.String()
        user = potion_fields.ItemUri(
            'web.server.api.user_api_models.UserResource', attribute='user_id'
        )
        resourceURI = potion_fields.ItemUri(
            'web.server.api.permission_api_models.BackendResource',
            attribute='authorization_resource_id',
        )

    # pylint: disable=E1101
    @Route.GET(
        '',
        rel='instances',
        title='Get alert definitions that a user can view',
        schema=Instances(),
        response_schema=Instances(),
    )
    def get_definitions(self, page, per_page, where, sort):
        '''Replaces default GET, adds field filtering based on user permissions'''
        queryable_instances = self.manager.instances(where, sort)
        if not queryable_instances:
            return []
        filtered_instances = filter_definitions_by_source(queryable_instances)
        return filtered_instances.paginate(page=page, per_page=per_page)

    # TODO(toshi): We need to start using constants for needs and resources ugh
    # pylint: disable=E1101
    @Route.POST(
        '',
        rel='create',
        title='Create a definition if user has access to datasource',
        schema=potion_fields.Inline('self'),
        response_schema=potion_fields.Inline('self'),
    )
    @authorization_required('create_resource', 'alert')
    # pylint: disable=R0201
    def check_source_and_create(self, entity):
        # Shortcircuit in the event that the user is a site-admin
        if SuperUserPermission().can():
            return self.manager.create(entity)

        if any(
            not is_field_permitted_for_user(field['id'].rsplit('__', 1)[0])
            for field in entity['fields']
        ):
            return None, UNAUTHORIZED

        return self.manager.create(entity)

    # TODO(toshi): Add permission checks to default PATCH method. Currently,
    # alert definitions are not displayed to users who cannot view them so this
    # is not an immediate problem.

    # pylint: disable=E1101
    @Route.POST(
        '/transfer/username',
        title='Transfer Bulk Ownership',
        description=(
            'Transfers the ownership of all alert definitions from one user to '
            'another'
        ),
        schema=potion_fields.Object(
            {'sourceUser': USERNAME_SCHEMA, 'targetUser': USERNAME_SCHEMA}
        ),
    )
    @authorization_required('update_users', 'alert')
    # pylint: disable=R0201
    def transfer_bulk_ownership_by_username(self, request):
        source_username = request['sourceUser']
        target_username = request['targetUser']
        bulk_transfer_alert_def_ownership(source_username, target_username)
        return None, NO_CONTENT

    @Route.GET(
        '/latest_notifications',
        response_schema=potion_fields.Array(
            potion_fields.Inline(
                'web.server.api.alerts_api_models.AlertNotificationResource'
            )
        ),
    )
    def latest_associated_notifications(self):
        '''Get the latest associated notifications with accessible alerts.
        Layers of permissions in order - Does user have access to:
        - alert definition
        - fields specificed in definition
        - dimension in generated notification

        NOTE(toshi): The reason fetching notifications is in the AlertDefinition
        class is because we can take advantage of using flask principal to take
        care of individual item access. Further, since multiple notifications
        are linked to a single definition, it reduces the total number of checks
        if we had left this for the notification endpoint to take care of.
        '''
        # Which definitions
        queryable_definitions = self.manager.instances()
        if not queryable_definitions:
            return []
        # Which sources
        filtered_definitions = filter_definitions_by_source(queryable_definitions)
        definition_ids = [definition.id for definition in filtered_definitions]
        associated_notifications = get_latest_notifications(
            definition_id_lst=definition_ids
        )
        # Which dimensions
        filtered_notifications = filter_notifications_by_dimension(
            associated_notifications
        )
        return filtered_notifications.all()


class AlertNotificationResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `AlertNotification`
    class.
    '''

    class Meta:
        model = AlertNotification

        # Queryable fields for Alert Notifications
        filters = {
            'dimensionVal': True,
            'alertDefinition': True,
            'generationDate': True,
        }

        permissions = {'view_resource': 'view_resource:alertDefinition'}

    class Schema:
        # NOTE(toshi): This is really referring to the authorization id, may
        # want to change this in the future
        alertDefinition = ALERT_DEFINITION
        dimensionName = DIMENSION_NAME
        dimensionInfo = DIMENSION_INFO
        fieldNames = FIELD_NAMES
        generationDate = GENERATION_DATE
        reportedVal = REPORTED_VAL
        comparedVal = COMPARED_VAL
        queryInterval = QUERY_INTERVAL
        timeGranularity = TIME_GRANULARITY
        checks = CHECKS
        title = TITLE

    # NOTE: The default GET endpoint should be avoided and probably should be
    # blocked because it doesn't check against query policies. Use
    # alert_definitions/latest_notifications instead.

    # pylint: disable=E1101
    @Route.GET(
        '/all_filtered',
        title='Get All Alert Notifications (Filtered for Cyclone Idai Hack)',
        schema=Instances(),
        response_schema=potion_fields.Array(potion_fields.Inline('self')),
    )
    # pylint: disable=R0201
    def all_filtered(self, page, per_page, where, sort):
        '''Get the latest day of notifications.
        NOTE: THIS IS CURRENTLY NOT BEING USED.
        '''
        queryable_instances = self.manager.instances(where=where, sort=sort)
        filtered_instances = self.filter_notifications_by_query_need(
            queryable_instances
        )
        return filtered_instances.paginate(page=page, per_page=per_page).items

    # pylint: disable=R0201
    def filter_notifications_by_query_need(self, notifications_query):
        '''Filters based on query needs - dimensions and fields'''
        # NOTE(toshi): This should be deprecated and replaced with
        # filter_notifications_by_dimension.

        if SuperUserPermission().can():
            # Shortcircuit in the event that the user is a site-admin
            return notifications_query

        dimension_values_lookup = current_app.druid_context.dimension_values_lookup

        dimension_value_map = dimension_values_lookup.get_dimension_value_map()
        converted_dimension_map = (
            dimension_values_lookup.generate_alternate_dimension_value_map(
                dimension_value_map
            )
        )
        ids_to_exclude = []

        for notification in notifications_query:
            # TODO(abby): Figure out how this would work when dimension_name is null, which is
            # not yet allowed by the front end.
            dimension_values = converted_dimension_map[
                notification.alert_definition.dimension_name
            ]
            if notification.dimension_val not in dimension_values:
                ids_to_exclude.append(notification.id)

        dimension_filtered_query = notifications_query.filter(
            ~AlertNotification.id.in_(ids_to_exclude)
        )

        # Filter for allowed fields using created definitions
        return filter_definitions_by_source(
            dimension_filtered_query.join(AlertDefinition)
        )

    # pylint: disable=E1101
    @Route.POST(
        '/bulk',
        rel="createInstances",
        schema=potion_fields.List(potion_fields.Inline('self')),
        response_schema=potion_fields.List(potion_fields.Inline('self')),
    )
    def create_bulk(self, entities):
        # Check Authorization Before creating
        with AuthorizedOperation('create_resource', 'alert'):
            output = []
            for entity in entities:
                output.append(self.manager.create(entity))
            return output

    @Route.PATCH(
        '/bulk',
        rel="editInstances",
        schema=potion_fields.List(PATCH_NOTIFICATION_SCHEMA),
        # schema=potion_fields.List(potion_fields.Inline('self')),
        response_schema=potion_fields.List(potion_fields.Inline('self')),
    )
    def update_bulk(self, entities):
        # Check Authorization Before creating
        with AuthorizedOperation('edit_resource', 'alert'):
            output = []
            for entity_dict in entities:
                entity_obj = self.read_uri(entity_dict['$uri'])
                converted_entity_dict = convert_attribute_names(self, entity_dict)
                # NOTE(toshi): $uri gets converted to id but that isn't defined
                converted_entity_dict.pop('id')

                output.append(
                    self.manager.update(entity_obj, converted_entity_dict, commit=False)
                )

            self.manager.commit()
            return output


@before_update.connect_via(AlertNotificationResource)
# pylint: disable=W0613
def reject_alert_definition_mutation(sender, item, changes):
    if item.alert_definition and 'alert_definition' in changes:
        raise MethodNotAllowed()


RESOURCE_TYPES = [AlertDefinitionResource, AlertNotificationResource]
