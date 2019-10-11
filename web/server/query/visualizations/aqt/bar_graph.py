from web.server.query.visualizations.aqt.aqt_base import AQTBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.bar_graph import build_backend_sort_order
from web.server.query.visualizations.util import build_key_column


class BarGraphVisualization(AQTBase):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for the legacy bar graph visualization.
    '''

    def __init__(self, request, query_client, datasource, backend_sort_map):
        super().__init__(request, query_client, datasource)
        self.backend_sort_map = backend_sort_map

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        dimensions = self.grouping_order()
        if not dimensions:
            raw_df['key'] = 'Nation'
            return raw_df

        label_df = build_key_column(raw_df, 'key', dimensions, [dimensions[-1]])
        return raw_df.join(label_df, on=dimensions)

    def build_response(self, df):
        '''Output records for each bar grouping.
        '''
        data = []
        totals = {}
        numeric_fields = []
        if not df.empty:
            numeric_fields = [field.id for field in self.request.fields]
            columns = ['key'] + numeric_fields
            data = df[columns].to_dict('records')
            totals = df[numeric_fields].sum().to_dict()

            if not self.has_time_grouping():
                (sort_id, sort_order) = build_backend_sort_order(
                    df, self.grouping_dimension_ids(), self.backend_sort_map
                )
                if sort_order:
                    for row in data:
                        row[sort_id] = sort_order[row['key']]

        return {'data': data, 'fields': numeric_fields, 'totals': totals}
