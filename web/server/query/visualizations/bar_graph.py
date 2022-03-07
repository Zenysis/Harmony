from typing import TypedDict, Dict, List, Union
from web.server.query.visualizations.base import QueryBase


class BarGraphDataPoint(TypedDict):
    dimensions: Dict[str, Union[str, None]]
    metrics: Dict[str, Union[float, None]]


class BarGraphResponse(TypedDict):
    data: List[BarGraphDataPoint]
    dimensions: List[str]


class BarGraphVisualization(QueryBase):
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

    def build_response(self, df) -> BarGraphResponse:
        '''Output records for each bar grouping.
        '''
        output: List[BarGraphDataPoint] = []
        dimensions = self.grouping_order()
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
