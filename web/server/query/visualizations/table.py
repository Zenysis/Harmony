from web.server.query.visualizations.base import QueryBase


class TableVisualization(QueryBase):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for the table and scorecard visualization.
    '''

    def build_response(self, df):
        '''Output data stored as a list of rows.
        '''
        output_dimensions = self.grouping_order()
        columns = [*output_dimensions]
        numeric_fields = []
        for field in self.request.fields:
            numeric_fields.append(field.id)
            columns.append(field.id)

        # Convert the dataframe rows into a list of dictionaries.
        data = []
        if not df.empty:
            data = df[columns].to_dict('records')

        return {'data': data, 'dimensions': output_dimensions, 'fields': numeric_fields}
