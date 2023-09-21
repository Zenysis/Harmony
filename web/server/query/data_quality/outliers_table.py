# mypy: disallow_untyped_defs=True
from pandas import DataFrame

from db.druid.datasource import DruidDatasource
from web.server.routes.views.query_policy import AuthorizedQueryClient
from web.server.query.data_quality.outliers_base import OutliersBase
from web.server.query.data_quality.outliers_util import build_outlier_df
from web.server.query.request import QueryRequest


class OutliersTable(OutliersBase):
    '''Class to process the pandas dataframe returned from a druid query into
    the format needed for the Table in the Outlier Analysis tab of Data
    Quality Lab
    '''

    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: DruidDatasource,
        outlier_type: str,
    ):
        super().__init__(request, query_client, datasource)
        self.outlier_type = outlier_type

    def build_response(self, df: DataFrame) -> dict:
        if df.empty:
            return {'data': [], 'dimensions': []}

        field_id = self.request.fields[0].id

        if self.outlier_type == 'Moderate':
            outlier_df = build_outlier_df(df, field_id, True, False, False)
            outliers_key = 'moderate_outliers'
        elif self.outlier_type == 'Extreme':
            outlier_df = build_outlier_df(df, field_id, False, True, False)
            outliers_key = 'extreme_outliers'
        else:
            outlier_df = build_outlier_df(df, field_id, False, False, True)
            outliers_key = 'outliers'

        # Outliers always queries druid at the lowest granularity level so we
        # now group by whichever dimensions were in the orginal query.
        grouped_outlier_df = outlier_df.groupby(self.grouping_dimension_ids())

        outliers_series = grouped_outlier_df[outliers_key].sum().astype(int)
        value_counts_series = grouped_outlier_df[field_id].count()
        percentage_outliers_series = 100 * outliers_series / value_counts_series

        output_df = percentage_outliers_series.rename('percentage_outliers').to_frame()
        output_df['num_values'] = value_counts_series
        output_df['num_outliers'] = outliers_series
        output_df = output_df.reset_index()

        # Convert the dataframe rows into a list of dictionaries.
        data = []
        if not df.empty:
            data = output_df.to_dict('records')

        return {'data': data, 'dimensions': self.grouping_dimension_ids()}
