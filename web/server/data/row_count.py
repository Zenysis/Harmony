from builtins import object
from collections import defaultdict

COUNT_QUERY = {
    'queryType': 'timeseries',
    'granularity': 'all',
    'dataSource': '',
    'aggregations': [{'type': 'count', 'name': 'count'}],
    'intervals': ['1900-01-01/2100-01-01'],
}


class RowCountLookup(object):
    def __init__(self, druid_query_client, datasource):
        self.row_count_cache = defaultdict(int)
        self.datasource = datasource
        self.druid_query_client = druid_query_client

    def get_row_count(self, query_filter=None, cache_key=None):
        if cache_key not in self.row_count_cache:
            query = dict(COUNT_QUERY)
            query['dataSource'] = self.datasource.name
            if query_filter:
                query['filter'] = query_filter.build_filter()

            result = self.druid_query_client.run_raw_query(query)
            if len(result) != 1:
                return 0

            output = int(result[0]['result']['count'])
            if not cache_key:
                return output
            self.row_count_cache[cache_key] = output
        return self.row_count_cache[cache_key]
