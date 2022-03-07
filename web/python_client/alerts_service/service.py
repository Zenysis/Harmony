from urllib.parse import urljoin

from related import to_dict, to_model

from data.query.models import Field
from web.python_client.core import ApiService, LOCALHOST_URI
from web.python_client.alerts_service.model import AlertDefinition, AlertNotification


# NOTE(abby): Updates to alerts require the pipeline code to be able to work with different
# versions of the database. This is because the pipeline runs on master and database migrations
# take time to get to staging and prod. Therefore, this function replicates a database upgrade
# and acts as a transform layer to allow the pipeline code to expect the desired version of alert
# definitions.
def maybe_upgrade_data(alert_definitions):
    return maybe_populate_title(alert_definitions)


# TODO(abby): remove this after populating titles fully lands
def maybe_populate_title(alert_definitions):
    # Alert definitions may still not have a title, populate it with a default title.
    # Migration: 2be1fb67c14f, populate_alert_title
    converted_alert_definitions = []
    for alert_definition in alert_definitions:
        if alert_definition['title'] is None:
            check_titles = []
            for check in alert_definition['checks']:
                # All check types are currently threshold, so take the first field
                field_name = to_model(Field, alert_definition['fields'][0]).field_name()
                check_titles.append(
                    f'{field_name} {check["operation"]} {check["threshold"]}'
                )
            alert_definition['title'] = '; '.join(check_titles)

        converted_alert_definitions.append(alert_definition)
    return converted_alert_definitions


# TODO(abby): remove this after compared val fully lands
def maybe_remove_compared_val(existing_notifications, alert_notifications):
    # If db has already been upgraded, then return alert notifications unchanged. Use the
    # existing records in the database to determine if the db has been upgraded.
    if len(existing_notifications) == 0 or 'comparedVal' in existing_notifications[0]:
        return alert_notifications

    # Alert notifications table does not have compared_val, remove it so the notifications
    # can be added or updated. This is replicating a downgrade function.
    # Migration: fa4b961b5ecd, alerts_add_compared_val
    for alert_notification in alert_notifications:
        alert_notification.pop('comparedVal')
    return alert_notifications


# TODO(toshi): Let's move a lot of these into built in functions
class AlertDefinitionService(ApiService):
    def __init__(self, session, host=None):
        host = host if host else LOCALHOST_URI
        super(AlertDefinitionService, self).__init__(session, host)
        # TODO(toshi): Even though DB table names do not change frequently, we
        # should probably import the api name from a common location
        self._uri = urljoin(self.base_uri, 'api2/alert_definitions')

    # We could make this into a built in function
    def get_all_by_fields(self, fields=None):
        '''Fetches all alert definitions.'''
        # TODO(toshi): self._uri might be redundant
        response_list = maybe_upgrade_data(self.get_all_items(self._uri, fields=fields))
        return [to_model(AlertDefinition, item) for item in response_list]

    def get_alert_definition_by_id(self, alert_id):
        '''Get a single alert definition by its id.'''
        complete_uri = '{base_uri}/{id}'.format(base_uri=self._uri, id=alert_id)
        alert_def = maybe_upgrade_data([self.get(complete_uri).json()])[0]
        return to_model(AlertDefinition, alert_def)


class AlertNotificationService(ApiService):
    def __init__(self, session, host=None):
        host = host if host else LOCALHOST_URI
        super(AlertNotificationService, self).__init__(session, host)
        # TODO(toshi): Even though DB table names do not change frequently, we
        # should probably import the api name from a common location
        self._uri = urljoin(self.base_uri, 'api2/alert_notifications')

    def get_all_by_fields(self, fields=None):
        '''Fetches all alert notifications.'''
        # TODO(toshi): self._uri might be redundant
        response_list = self.get_all_items(self._uri, fields=fields)
        return [to_model(AlertNotification, item) for item in response_list]

    def add_all(self, items):
        '''Add all alert notifications.'''
        json_obj = [to_dict(item) for item in items]

        json_obj = maybe_remove_compared_val(self.get_all_items(self._uri), json_obj)

        # NOTE(toshi): We have to remove $uri
        # pylint: disable=W0106
        [item.pop('$uri') for item in json_obj]

        bulk_url = '%s%s' % (self._uri, '/bulk')
        return self.post(bulk_url, json=json_obj)

    # TODO(toshi): Rename this, bad name
    def update(self, alert_notif):
        '''Modify alert' '''
        notif_json = to_dict(alert_notif)

        notif_json = maybe_remove_compared_val(
            self.get_all_items(self._uri), [notif_json]
        )[0]

        # NOTE(toshi): $uri isn't part of schema
        notif_json.pop('$uri')

        url = '%s%s' % (self.base_uri, alert_notif.uri)
        return self.patch(url, json=notif_json)

    def update_all(self, items):
        '''Modify alert' '''
        json_obj = [to_dict(item) for item in items]

        json_obj = maybe_remove_compared_val(self.get_all_items(self._uri), json_obj)

        bulk_url = '%s%s' % (self._uri, '/bulk')
        return self.patch(bulk_url, json=json_obj)
