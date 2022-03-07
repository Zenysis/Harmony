from data.query.models import GroupingGranularity
from web.server.query.visualizations.base import QueryBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.request import QueryRequest
from web.server.query.visualizations.util import (
    build_key_column,
    clean_df_for_json_export,
)


def calculate_totals(line_graph_viz, original_df):
    # Remove any granularity groupings from the query request and leave only
    # Dimensions behind.
    groups = [
        group
        for group in line_graph_viz.request.groups
        if not isinstance(group, GroupingGranularity)
    ]

    # Create a new request with only the dimension groupings.
    request = QueryRequest(
        fields=line_graph_viz.request.fields,
        groups=groups,
        filter=line_graph_viz.request.filter,
    )

    # Run a new query and create a new dataframe.
    raw_df = LineGraphVisualization(
        request, line_graph_viz.query_client, line_graph_viz.datasource
    ).get_df()
    df = clean_df_for_json_export(raw_df)

    # If no results are returned, we likely are dealing with a LAST_VALUE type indicator
    # where querying it when grouping by time works, but querying it while grouping by
    # "all" results in no data (since the final time bucket is empty). If this happens,
    # use the last datapoints from the original line graph dataframe to create the
    # totals.
    if df.empty:
        df_slice = original_df[
            original_df[TIMESTAMP_COLUMN] == original_df[TIMESTAMP_COLUMN].max()
        ]
        # Swap out the empty dataframe reference for this slice of the final values in
        # the line graph dataframe.
        df = df_slice.reset_index(drop=True).copy()

    # NOTE(stephen): Remove any invalid keys. This in theory should not be possible but
    # previously there were bugs related to it so keeping it in to be safe.
    df.dropna(subset=['key'], inplace=True)
    # Make the key the index so we can easily convert the result to a dict mapping
    # unique `key` to a values dict.
    df.set_index('key', inplace=True)

    numeric_fields = [field.id for field in line_graph_viz.request.fields]
    return df[numeric_fields].to_dict('index')


class LineGraphVisualization(QueryBase):
    ''' Class to process the pandas dataframe returned from a druid query into
    the format needed for the line graph and bump chart visualizations.
    '''

    def build_df(self, raw_df):
        if raw_df.empty:
            return raw_df

        dimensions = self.grouping_dimension_ids()
        # TODO(stephen): If no dimensions are grouped on, there should only be
        # one row returned. Validate this.
        if not dimensions:
            raw_df['key'] = ''
            return raw_df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the label dimensions.
        label_df = build_key_column(raw_df, 'key', dimensions, [dimensions[-1]])
        return raw_df.join(label_df, on=dimensions)

    def build_response(self, df):
        numeric_fields = [field.id for field in self.request.fields]
        data = []
        dates = []
        totals = {}

        if not df.empty:
            dimensions = df[self.grouping_dimension_ids()].to_dict('records')
            columns = ['key', TIMESTAMP_COLUMN] + numeric_fields
            data = df[columns].to_dict('records')
            dates = sorted(df[TIMESTAMP_COLUMN].unique())
            totals = calculate_totals(self, df)

            # Merge the dimensions into the datapoints.
            for i, data_point in enumerate(data):
                data_point['dimensions'] = dimensions[i] if dimensions else {}

        return {'data': data, 'dates': dates, 'totals': totals}
