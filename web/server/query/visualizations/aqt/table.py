from web.server.query.visualizations.aqt.aqt_base import AQTBase, TIMESTAMP_COLUMN


class TableVisualization(AQTBase):
    ''' Class to process the pandas dataframe returned from a druid query into the format needed
    for the table and scorecard visualization.
    '''

    def build_response(self, df):
        '''Output data stored as a list of rows.
        '''
        # If the granularity set is not "all", then we should include the
        # timestamp column so the table can display it.
        output_dimensions = list(self.grouping_dimension_ids())
        columns = []
        columns.extend(output_dimensions)
        if self.has_time_grouping():
            columns.append(TIMESTAMP_COLUMN)
            output_dimensions.append(TIMESTAMP_COLUMN)

        numeric_fields = []
        for field in self.request.fields:
            numeric_fields.append(field.id)
            columns.append(field.id)

        # Convert the dataframe rows into a list of dictionaries.
        data = []
        if not df.empty:
            data = df[columns].to_dict('records')

        return {'data': data, 'dimensions': output_dimensions, 'fields': numeric_fields}
