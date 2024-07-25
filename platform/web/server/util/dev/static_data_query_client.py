# Experimental caching query client that is used in development to speed up server
# reload times.
import json

from flask import current_app

from db.druid.query_client import DruidQueryClient_


class DataQueryCache:
    """
    Wrapper around flask-cache backend to use datasource-related key prefix
    """

    def __init__(self, backend, datasource, datasource_version):
        self._backend = backend
        self._key_prefix = f'{datasource.name}.{datasource_version}'

    def _prepend_key(self, key):
        return f'{self._key_prefix}-{key}'

    def get(self, key):
        return self._backend.get(self._prepend_key(key))

    def set(self, key, *args, **kwargs):
        return self._backend.set(self._prepend_key(key), *args, **kwargs)


class StaticDataQueryClient(DruidQueryClient_):
    '''Simple caching query client for reducing startup time of the web server.

    NOTE: This query client should *not* be used as the normal query client for
    servicing client requests. It is not optimized for that case. It is primarily
    optimized for reading the static data values that we query druid for on server
    initialization.
    '''

    def __init__(self, druid_configuration, datasource, druid_metadata):
        super().__init__(druid_configuration)
        self.cache = DataQueryCache(
            current_app.caches['fs'],
            datasource,
            druid_metadata.get_datasource_version(datasource.name),
        )

    def run_raw_query(self, query_dict, *args, **kwargs):
        cache_key = json.dumps(query_dict, sort_keys=True)
        value = self.cache.get(cache_key)
        if value is None:
            value = list(super().run_raw_query(query_dict, *args, **kwargs))
            self.cache.set(cache_key, value, timeout=0)
        return value
