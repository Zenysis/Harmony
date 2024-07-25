# mypy: disallow_untyped_defs=True
from typing import Optional

from pandas import DataFrame

from db.druid.datasource import SiteDruidDatasource
from web.server.query.data_quality.outliers_base import OutliersBase
from web.server.query.data_quality.outliers_util import build_outlier_df
from web.server.query.request import QueryRequest
from web.server.routes.views.query_policy import AuthorizedQueryClient


class OutliersBoxPlot(OutliersBase):
    '''Class to process the pandas dataframe returned from a druid query into
    the format needed for the Box Plot in the Outlier Analysis tab of Data
    Quality Lab
    '''

    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: SiteDruidDatasource,
        outlier_type: str,
    ):
        super().__init__(request, query_client, datasource)
        self.outlier_type = outlier_type

        self.aggregation_dimension: Optional[str] = (
            self.grouping_dimension_ids()[0] if self.grouping_dimension_ids() else None
        )

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

        grouped_outlier_df = outlier_df.groupby(
            [self.lowest_granularity_geo, self.aggregation_dimension]
        )

        outliers_series = grouped_outlier_df[outliers_key].sum().astype(int)
        value_counts_series = grouped_outlier_df[field_id].count()
        percentage_outliers_series = 100 * outliers_series / value_counts_series

        data = []
        for index, percentage_outliers in percentage_outliers_series.iteritems():
            lowest_granularity_geo_value, aggregation_dimension_value = index
            data.append(
                {
                    'dimensions': {
                        self.aggregation_dimension: aggregation_dimension_value,
                        self.lowest_granularity_geo: lowest_granularity_geo_value,
                    },
                    'metrics': {field_id: percentage_outliers},
                }
            )

        return {
            'data': data,
            'dimensions': [self.aggregation_dimension, self.lowest_granularity_geo],
        }
