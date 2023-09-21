from pandas.core.dtypes.cast import maybe_box_native

from web.server.query.visualizations.base import QueryBase


class TableVisualization(QueryBase):
    '''Class to process the pandas dataframe returned from a druid query into the format needed
    for the table and scorecard visualization.
    '''

    def build_response(self, df):
        '''Output data stored as a list of rows.'''
        output_dimensions = self.grouping_order()
        columns = [*output_dimensions]
        numeric_fields = []
        for field in self.request.fields:
            numeric_fields.append(field.id)
            columns.append(field.id)

        if not df.empty:
            df = df[columns]
            columns = df.columns.tolist()
            rows = (
                dict(zip(columns, row)) for row in df.itertuples(index=False, name=None)
            )
            data = (
                dict((k, maybe_box_native(v)) for k, v in row.items()) for row in rows
            )
        else:
            data = []

        return {'data': data, 'dimensions': output_dimensions, 'fields': numeric_fields}
