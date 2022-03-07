# Experimental caching query client that is used in development to speed up server
# reload times.
import json
import pathlib
import tempfile

from db.druid.query_client import DruidQueryClient_
from util.file.compression.lz4 import LZ4Reader, LZ4Writer


def initialize_cache(cache_path):
    '''Deserialize the cached query results stored at the specified path.'''
    cache = {}
    if not cache_path.exists():
        return cache

    with LZ4Reader(str(cache_path)) as input_file:
        for line in input_file:
            if '\t' not in line:
                continue
            (key, value) = line.split('\t')
            cache[key] = json.loads(value)
    return cache


def build_cache_path(datasource, datasource_version):
    '''Build the cache filename for this datasource.

    Setup the temporary directory structure where cached data is stored and clean up
    previously cached datasources for this site.
    '''
    cache_path = pathlib.Path(
        tempfile.gettempdir(), 'zenysis-static-data', datasource.site
    )

    # Create the directory structure for storing the cached data.
    cache_path.mkdir(parents=True, exist_ok=True)

    # Cache files will be stored in LZ4 format for fast compression.
    # Include the datasource version in the name so we can invalidate the cache if the
    # datasource is built multiple times in one day.
    filename = f'{datasource.name}.{datasource_version}.txt.lz4'

    # Remove all cache files for this site that are not from this datasource.
    for cache_file in cache_path.glob('*.txt.lz4'):
        if cache_file.name != filename:
            cache_file.unlink()
    return cache_path / filename


class StaticDataQueryClient(DruidQueryClient_):
    '''Simple caching query client for reducing startup time of the web server.

    NOTE(stephen): This query client should *not* be used as the normal query client for
    servicing client requests. It is not optimized for that case. It is primarily
    optimized for reading the static data values that we query druid for on server
    initialization.
    '''

    def __init__(self, druid_configuration, datasource, druid_metadata):
        super().__init__(druid_configuration)
        self.cache_path = build_cache_path(
            datasource, druid_metadata.get_datasource_version(datasource.name)
        )

        # Read the cached values and build a simple dictionary mapping query key to
        # result.
        self.cache = initialize_cache(self.cache_path)
        self.cache_dirty = False
        self.closed = False

    def run_raw_query(self, query_dict):
        # If the cache has been written, do not let users continue to use the client.
        # This helps limit the usage of this client to tightly controlled uses.
        assert (
            not self.closed
        ), 'Attempting to use StaticDataQueryClient after cache has been closed'

        cache_key = json.dumps(query_dict)
        if cache_key not in self.cache:
            self.cache[cache_key] = super().run_raw_query(query_dict)
            self.cache_dirty = True
        return self.cache[cache_key]

    def write_cache(self):
        self.closed = True
        if not self.cache_dirty:
            return

        with LZ4Writer(str(self.cache_path)) as output_file:
            for key, value in self.cache.items():
                serialized_value = json.dumps(value)
                line = f'{key}\t{serialized_value}\n'
                output_file.write(line)
