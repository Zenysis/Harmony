from web.server.query.visualizations.base import BaseVisualization

DEFAULT_DATE_COLUMN = 'date'
DEFAULT_FIELD = 'field'
DEFAULT_VAL = 'val'
# Default time column from query return:
QUERY_DATE_COLUMN = 'timestamp'


class BoxPlot(BaseVisualization):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for the box plot visualization.
    The dataframe will have dates as the row index and a multicolumn index for the other dimensions.
    Example: {'data': [{'RegionName': r1, 'WoredaName': w1, 'date': d1, 'val': v1}, ...]}'''

    def build_df(self, raw_df):
        ''' Pivot the dataframe to contain a multi-column index and have the rows as the dates.'''
        if raw_df.empty:
            return raw_df

        # Rename 'timestamp' from to druid query to 'date'.
        df = raw_df.rename(columns={QUERY_DATE_COLUMN: DEFAULT_DATE_COLUMN})
        return df.pivot_table(
            index=DEFAULT_DATE_COLUMN,
            columns=self.dimensions,
            values=self.numeric_fields,
        )

    def build_response(self, df):
        ''' Format dataframe to a list of collections needed for the box plot visualization.
        Example: {'data': [{'RegionName': r1, 'WoredaName': w1, 'date': d1, 'val': v1}, ...]}'''
        # field is the top level.
        data = []
        if not df.empty:
            df = (
                df.T.stack()
                .reset_index()
                .rename(columns={0: DEFAULT_VAL, 'level_0': DEFAULT_FIELD})
            )
            df[DEFAULT_DATE_COLUMN] = df[DEFAULT_DATE_COLUMN].str.slice(0, 10)
            data = df.to_dict(orient='records')

        groupable_keys = [DEFAULT_DATE_COLUMN, DEFAULT_FIELD]
        groupable_keys.extend(self.dimensions)

        # Generate a list of dictionaries.
        return {'data': data, 'groupableKeys': groupable_keys}
