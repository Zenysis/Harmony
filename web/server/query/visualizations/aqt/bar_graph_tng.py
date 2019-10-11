from data.wip.models import Granularity, GroupingDimension
from web.server.query.visualizations.aqt.aqt_base import AQTBase, TIMESTAMP_COLUMN


class BarGraphTNGVisualization(AQTBase):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for the new bar graph visualization.
    '''

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        dimensions = self.grouping_dimension_ids()
        if not dimensions:
            raw_df['key'] = 'All'
            return raw_df

        return raw_df

    def build_response(self, df):
        '''Output records for each bar grouping.
        '''
        output = []
        dimensions = self.grouping_dimension_ids()
        if self.has_time_grouping():
            dimensions += [TIMESTAMP_COLUMN]

        if not df.empty:
            metric_fields = [field.id for field in self.request.fields]
            metric_data = df[metric_fields].to_dict('records')
            dimension_data = df[dimensions].to_dict('records')
            for i, metrics in enumerate(metric_data):
                output.append(
                    {
                        'dimensions': dimension_data[i] if dimension_data else {},
                        'metrics': metrics,
                    }
                )

        return {'data': output, 'dimensions': dimensions}
