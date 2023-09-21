# mypy: disallow_untyped_defs=True
from abc import abstractmethod
from typing import List

from flask import current_app
from pandas import DataFrame

from db.druid.datasource import DruidDatasource
from db.druid.query_builder import GroupByQueryBuilder
from web.server.routes.views.query_policy import AuthorizedQueryClient
from web.server.query.request import QueryRequest
from web.server.query.visualizations.base import QueryBase
from web.server.query.visualizations.util import build_key_column

GEO_FIELD_ORDERING = current_app.zen_config.aggregation.GEO_FIELD_ORDERING


class OutliersBase(QueryBase):
    '''Base class for outlier analysis queries in DQL.'''

    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: DruidDatasource,
    ):
        # Disable intermediate date filling because it is not needed for Outliers
        # score computation.
        super().__init__(request, query_client, datasource, False)

        self.lowest_granularity_geo = GEO_FIELD_ORDERING[-1]
        self.query_dimension_names: List[str] = []

    def build_query(self) -> GroupByQueryBuilder:
        query = self.request.to_druid_query(self.datasource.name)

        # We want to look for outliers at the report level so we add all
        # geography dimensions to the group by
        for geo_dimension in GEO_FIELD_ORDERING:
            if not geo_dimension in query.dimensions:
                query.dimensions = [*query.dimensions, geo_dimension]

        self.query_dimension_names = query.dimensions
        return query

    def build_df(self, raw_df: DataFrame) -> DataFrame:
        if raw_df.empty:
            return raw_df

        non_null_dimensions = [
            dimension
            for dimension in self.query_dimension_names
            if not raw_df[dimension].isnull().values.all()
        ]

        if self.query_dimension_names and len(non_null_dimensions) > 0:
            # Ensure that each dimension value has a unique key by including
            # values from higher up the hierarchy if neccessary.
            label_df = build_key_column(
                raw_df, 'key', non_null_dimensions, non_null_dimensions
            )

            return raw_df.join(label_df, on=non_null_dimensions)

        return raw_df

    @abstractmethod
    def build_response(self, df: DataFrame) -> dict:
        pass
