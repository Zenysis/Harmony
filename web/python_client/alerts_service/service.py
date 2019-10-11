from future import standard_library

standard_library.install_aliases()
from urllib.parse import urljoin

from related import to_dict, to_model

from web.python_client.core import ApiService, LOCALHOST_URI
from web.python_client.alerts_service.model import AlertDefinition, AlertNotification

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
        '''Fetches all alert definitions.
        '''
        # TODO(toshi): self._uri might be redundant
        response_list = self.get_all_items(self._uri, fields=fields)
        return [to_model(AlertDefinition, item) for item in response_list]

    def get_alert_definition_by_id(self, alert_id):
        '''Get a single alert definition by its id.
        '''
        complete_uri = '{base_uri}/{id}'.format(base_uri=self._uri, id=alert_id)
        response = self.get(complete_uri)
        return to_model(AlertDefinition, response.json())


class AlertNotificationService(ApiService):
    def __init__(self, session, host=None):
        host = host if host else LOCALHOST_URI
        super(AlertNotificationService, self).__init__(session, host)
        # TODO(toshi): Even though DB table names do not change frequently, we
        # should probably import the api name from a common location
        self._uri = urljoin(self.base_uri, 'api2/alert_notifications')

    def get_all_by_fields(self, fields=None):
        '''Fetches all alert notifications.
        '''
        # TODO(toshi): self._uri might be redundant
        response_list = self.get_all_items(self._uri, fields=fields)
        return [to_model(AlertNotification, item) for item in response_list]

    def add_all(self, items):
        '''Add all alert notifications.
        '''
        json_obj = [to_dict(item) for item in items]

        # NOTE(toshi): We have to remove $uri
        # pylint: disable=W0106
        [item.pop('$uri') for item in json_obj]

        bulk_url = '%s%s' % (self._uri, '/bulk')
        return self.post(bulk_url, json=json_obj)

    # TODO(toshi): Rename this, bad name
    def update(self, alert_notif):
        '''Modify alert'
        '''
        notif_json = to_dict(alert_notif)
        # NOTE(toshi): $uri isn't part of schema
        notif_json.pop('$uri')

        url = '%s%s' % (self.base_uri, alert_notif.uri)
        return self.patch(url, json=notif_json)

    def update_all(self, items):
        '''Modify alert'
        '''
        json_obj = [to_dict(item) for item in items]

        bulk_url = '%s%s' % (self._uri, '/bulk')
        return self.patch(bulk_url, json=json_obj)
