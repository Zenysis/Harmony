from flask import request

from web.server.query.visualizations.bar_graph import BarGraph
from web.server.query.visualizations.base import BaseVisualization
from web.server.query.visualizations.util import (
    build_key_column,
    clean_df_for_json_export,
)


def _calculate_totals(line_graph_request, query_client):
    # Copy the query request and set the time granularity to "all" since we want to
    # calculate total values.
    new_request = {**line_graph_request, 'granularity': 'all'}

    # Run a new query and build a new dataframe.
    viz = LineGraph(new_request, query_client)
    df = clean_df_for_json_export(viz.get_df())

    # NOTE(stephen): Remove any invalid keys. This in theory should not be possible but
    # previously there were bugs related to it so keeping it in to be safe.
    df.dropna(subset=['key'], inplace=True)
    # Make the key the index so we can easily convert the result to a dict mapping
    # unique `key` to a values dict.
    df.set_index('key', inplace=True)
    return df[viz.numeric_fields].to_dict('index')


class LineGraph(BaseVisualization):
    '''Line graph visualization endpoint.

    Extra request param:
      labelDimensions: list of dimensions to use to label the line.
    '''

    def __init__(self, request, query_client):
        super(LineGraph, self).__init__(request, query_client)
        # The user should specify which dimensions will be used as the label
        # for the output values. Default to the requested dimensions if not
        # specified.
        self._label_dimensions = request.get('labelDimensions') or self.dimensions
        self._request = request

    def build_df(self, df):
        if df.empty:
            return df

        # TODO(stephen): If no dimensions are grouped on, there should only be
        # one row returned. Validate this.
        if not self.dimensions:
            df['key'] = 'Nation'
            return df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the label dimensions.
        label_df = build_key_column(df, 'key', self.dimensions, self._label_dimensions)
        return df.join(label_df, on=self.dimensions)

    # Output data is stored as a list of SingleBars, with a bar being
    # built for each output field requested
    def build_response(self, df):
        data = []
        totals = []
        if not df.empty:
            columns = ['key', 'timestamp'] + self.numeric_fields
            data = df[columns].to_dict('records')
            totals = _calculate_totals(self._request, self.query_client)

        return {
            'data': data,
            'fields': self.numeric_fields,
            'dates': sorted(df['timestamp'].unique()),
            'totals': totals,
        }
