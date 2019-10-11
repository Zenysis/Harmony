from data.wip.models import Granularity
from web.server.query.visualizations.aqt.aqt_base import AQTBase, TIMESTAMP_COLUMN
from web.server.query.visualizations.aqt.request import AQTQueryRequest
from web.server.query.visualizations.util import (
    build_key_column,
    clean_df_for_json_export,
)


def calculate_totals(line_graph_viz):
    # Remove any granularity groupings from the query request and leave only
    # Dimensions behind.
    groups = [
        group
        for group in line_graph_viz.request.groups
        if not isinstance(group, Granularity)
    ]

    # Create a new request with only the dimension groupings.
    request = AQTQueryRequest(
        fields=line_graph_viz.request.fields,
        groups=groups,
        filter=line_graph_viz.request.filter,
    )

    # Run a new query and create a new dataframe.
    raw_df = LineGraphVisualization(
        request, line_graph_viz.query_client, line_graph_viz.datasource
    ).get_df()
    df = clean_df_for_json_export(raw_df)

    # NOTE(stephen): Remove any invalid keys. This in theory should not be possible but
    # previously there were bugs related to it so keeping it in to be safe.
    df.dropna(subset=['key'], inplace=True)
    # Make the key the index so we can easily convert the result to a dict mapping
    # unique `key` to a values dict.
    df.set_index('key', inplace=True)

    numeric_fields = [field.id for field in line_graph_viz.request.fields]
    return df[numeric_fields].to_dict('index')


class LineGraphVisualization(AQTBase):
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
            raw_df['key'] = 'Nation'
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
        totals = []
        if not df.empty:
            columns = ['key', TIMESTAMP_COLUMN] + numeric_fields
            data = df[columns].to_dict('records')
            dates = sorted(df[TIMESTAMP_COLUMN].unique())
            totals = calculate_totals(self)

        return {
            'data': data,
            'fields': numeric_fields,
            'dates': dates,
            'totals': totals,
        }
