#!/usr/bin/env python
import requests

from requests.packages.urllib3.exceptions import InsecureRequestWarning

from log import LOG

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

PATH = '%s.json?paging=false&fields=%s'


class DataSetGenerator:
    def __init__(self, dhis_options, path=PATH):
        self.base_url = dhis_options.url_pattern % (dhis_options.hostpath, path)
        self.auth = (dhis_options.username, dhis_options.password)

    def _get_json_resource(self, resource, fields):
        # Query a resource for the fields specified and return a json response
        url = self.base_url % (resource, ','.join(fields))
        LOG.info('Pulling data for URL: %s', url)
        response = requests.get(url, verify=False, auth=self.auth)
        if not response.ok:
            LOG.error(
                'Error pulling data for URL: %s\tResponse: %s', url, response.text
            )
            return None

        response_data = response.json()
        if resource not in response_data:
            LOG.error('Somehow resource we requested is not included in response data')
            LOG.error('Resource: %s\tResponse data: %s', resource, response_data)
            return None
        return response_data[resource]

    def get_resources(self, resource_map):
        # resource_map is {endpoint_0: [field_0, ...]}
        # For every key (endpoint), value (fields) pair in the resource_map
        # query the dhis2 api for the endpoint requesting the specified fields
        # return {endpoint_0: json_response_0, ...}
        resources = {}
        for resource, fields in resource_map.items():
            resource_data = self._get_json_resource(resource, fields)
            # This should fail when a resource doesn't exist.
            resources[resource] = resource_data
        return resources
