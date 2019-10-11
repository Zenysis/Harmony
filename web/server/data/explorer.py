from builtins import object
from log import LOG


class GeoExplorerCache(object):
    '''Prefetch specific values from postgres so they can be referenced without
    querying'''

    def __init__(self, explorer_datasource=None):
        self.explorer_datasource = explorer_datasource
        self.location_hierarchy = None
        self.metrics = None
        self.properties = None
        self._populate_cache()

    def _populate_cache(self):
        if not self.explorer_datasource:
            LOG.info('Skipping explorer cache population. No datasource exists')
            return

        LOG.debug('Building explorer cache')
        self.location_hierarchy = self.explorer_datasource.get_location_hierarchy()
        self.metrics = self.explorer_datasource.get_metric_groups()
        self.properties = self.explorer_datasource.get_property_groups()
        LOG.debug('Finished populating explorer cache')
