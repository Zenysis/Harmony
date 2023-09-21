# mypy: disallow_untyped_defs=True
import pandas as pd

from db.druid.datasource import SiteDruidDatasource
from web.server.query.data_quality.outliers_util import (
    EXTREME_LOWER_BOUND,
    EXTREME_UPPER_BOUND,
    OUTLIER_LOWER_BOUND,
    OUTLIER_UPPER_BOUND,
    build_outlier_df,
)
from web.server.query.request import QueryRequest
from web.server.query.visualizations.base import QueryBase
from web.server.query.visualizations.util import build_key_column
from web.server.routes.views.query_policy import AuthorizedQueryClient


class OutliersLineGraph(QueryBase):
    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: SiteDruidDatasource,
        outlier_type: str,
    ) -> None:
        super().__init__(request, query_client, datasource, False)
        self.outlier_type = outlier_type

    def build_df(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        if raw_df.empty:
            return raw_df

        dimensions = self.grouping_dimension_ids()
        # TODO: If no dimensions are grouped on, there should only be
        # one row returned. Validate this.
        if not dimensions:
            raw_df['key'] = 'Nation'
            return raw_df

        # Add a 'key' column so that the grouped dimensions can be represented
        # in a single string to display on the frontend. The key is based off
        # the label dimensions.
        label_df = build_key_column(raw_df, 'key', dimensions, [dimensions[-1]])
        return raw_df.join(label_df, on=dimensions)

    def build_response(self, df: pd.DataFrame) -> dict:
        numeric_fields = [field.id for field in self.request.fields]
        data = []
        dates = []

        field_id = self.request.fields[0].id
        df["mean"] = df[field_id].mean()

        if self.outlier_type == 'Moderate':
            outlier_df = build_outlier_df(df, field_id, True, False, False)
            outlier_columns = [
                EXTREME_LOWER_BOUND,
                EXTREME_UPPER_BOUND,
                OUTLIER_LOWER_BOUND,
                OUTLIER_UPPER_BOUND,
            ]
        elif self.outlier_type == 'Extreme':
            outlier_df = build_outlier_df(df, field_id, False, True, False)
            outlier_columns = [EXTREME_LOWER_BOUND, EXTREME_UPPER_BOUND]
        else:
            outlier_df = build_outlier_df(df, field_id, False, False, True)
            outlier_columns = [OUTLIER_LOWER_BOUND, OUTLIER_UPPER_BOUND]

        df = df.join(outlier_df[outlier_columns])

        if not df.empty:
            # TODO: Currently we return the outlier boundaries as we
            # we would for a normal line graph line. We manually separate these
            # and plot them as goal lines in the front end. We should instead
            # include them as separate constants in the response.
            columns = ['key', 'timestamp', 'mean'] + numeric_fields + outlier_columns
            data = df[columns].to_dict('records')
            dates = sorted(df['timestamp'].unique())

            # Merge the dimensions into the datapoints.
            dimensions = df[self.grouping_dimension_ids()].to_dict('records') + ['mean']
            for i, data_point in enumerate(data):
                data_point['dimensions'] = dimensions[i] if dimensions else {}

        # Totals is empty as there is no case where we need to sort the
        # lines for the outliers line graph.
        return {'data': data, 'dates': dates, 'totals': {}}
