from web.server.query.visualizations.base import BaseVisualization


class Table(BaseVisualization):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for the table and scorecard visualization.
    '''

    def build_response(self, df):
        '''Output data stored as a list of rows.
        '''
        # If the granularity set is not "all", then we should include the
        # timestamp column so the table can display it.
        columns = []
        if self.granularity != 'all':
            columns.append('timestamp')
        columns.extend(self.dimensions + self.numeric_fields)

        # Convert the dataframe rows into a list of dictionaries.
        data = []
        if not df.empty:
            data = df[columns].to_dict('records')

        return {
            'data': data,
            'dimensions': self.dimensions,
            'fields': self.numeric_fields,
        }
