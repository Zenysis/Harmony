from web.server.query.data_quality.data_quality_util import (
    modify_request_for_data_quality_reporting,
)
from web.server.query.visualizations.base import QueryBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.util import build_key_column


class ReportingCompletenessLineGraph(QueryBase):
    ''' Class to query druid and process the results into the format needed for
    the DQL reporting completeness line graph.
    '''

    def __init__(self, request, *args, **kwargs):
        # Need to convert the request into a DataQuality friendly format.
        super().__init__(
            modify_request_for_data_quality_reporting(request), *args, **kwargs
        )

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        dimensions = self.grouping_dimension_ids()
        # TODO(stephen): If no dimensions are grouped on, there should only be
        # one row returned. Validate this.
        if not dimensions:
            raw_df['key'] = 'Nation'
            return raw_df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the label dimensions.
        label_df = build_key_column(raw_df, 'key', dimensions, [dimensions[-1]])
        return raw_df.join(label_df, on=dimensions)

    def build_response(self, df):
        field_id = self.request.fields[0].id
        data = []
        dates = []
        totals = {}

        if not df.empty:
            dimensions = df[self.grouping_dimension_ids()].to_dict('records')
            columns = ['key', TIMESTAMP_COLUMN, field_id]
            data = df[columns].to_dict('records')
            dates = sorted(df[TIMESTAMP_COLUMN].unique())
            totals = df[['key', field_id]].groupby('key').sum().to_dict('index')

            # Merge the dimensions into the datapoints.
            for i, data_point in enumerate(data):
                data_point['dimensions'] = dimensions[i] if dimensions else {}
        return {'data': data, 'fields': [field_id], 'dates': dates, 'totals': totals}
