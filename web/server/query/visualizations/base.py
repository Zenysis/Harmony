# mypy: disallow_untyped_defs=True
from abc import ABC, abstractmethod
from http.client import INTERNAL_SERVER_ERROR
from typing import List, Optional, Union

import numpy as np
import pandas as pd
from werkzeug.exceptions import abort

from pydruid.utils.dimensions import DimensionSpec

from data.query.models import GroupingGranularity
from data.query.models.calculation import SyntheticCalculation
from log import LOG
from web.server.query.visualizations.util import clean_df_for_json_export
from web.server.query.visualizations.request import QueryRequest
from web.server.routes.views.query_policy import AuthorizedQueryClient
from db.druid.datasource import DruidDatasource
from db.druid.errors import DruidQueryError
from db.druid.query_builder import GroupByQueryBuilder


TIMESTAMP_COLUMN = 'timestamp'


def detect_alternate_granularity(
    dimensions: List[Union[str, DimensionSpec]]
) -> Optional[str]:
    '''Detect if the user has specified their granularity as a DimensionSpec. If so,
    return the dimension name that was used for the granularity.

    This is designed to operate on top of the list of dimensions that were passed to the
    GroupByQueryBuilder. We choose to use this list instead of the values in the
    QueryRequest because the request `groups` might have been transformed right
    before querying (see `parse_groups_for_query`).
    '''
    # pylint: disable=protected-access
    dimension_spec = None
    for dimension in dimensions:
        if not isinstance(dimension, DimensionSpec):
            continue

        # If this dimension spec does not operate on the special time column, then it is
        # not an alternate granularity.
        if dimension._dimension != '__time':
            continue

        # If we have already found a dimension spec that represents a granularity, then
        # we cannot continue. There can be only one alternate granularity.
        if dimension_spec:
            return None

        dimension_spec = dimension

    # If no dimension spec was found, there is no alternate granularity.
    if not dimension_spec:
        return None

    return dimension_spec._output_name


class QueryBase(ABC):
    '''An absract class that is used to run druid queries. This class runs a
    druid query and gets the result as a pandas dataframe. The processing of
    that dataframe into a suitable response format is left up to the inheriting
    class in the build_response abstract method.'''

    def __init__(
        self,
        request: QueryRequest,
        query_client: AuthorizedQueryClient,
        datasource: DruidDatasource,
        fill_intermediate_dates: bool = True,
    ):
        self.request = request
        self.query_client = query_client
        self.datasource = datasource
        self.fill_intermediate_dates = fill_intermediate_dates

    def _run_query(self) -> pd.DataFrame:
        '''Run the built query and return the results in a dataframe.'''
        df = None

        if self.request.filter and not self.request.filter.is_valid():
            LOG.info(
                'Encountered invalid filter, returning empty dataframe: %s',
                self.request.filter,
            )
            return pd.DataFrame()

        # Cowardly refuse to issue a query if no fields have been selected since
        # druid won't be able to return results.
        if self.request.fields:
            query = self.build_query()
            result = self.query_client.run_query(query)
            df = result.export_pandas(self.fill_intermediate_dates)

        # pydruid doesn't return a DataFrame if the result is empty
        # TODO(stephen): Handle empty results more cleanly. Potentially show
        # error messages
        if df is None:
            return pd.DataFrame()

        if not df.empty:
            # Replace all NA/NaN values with np.nan. String columns can
            # potentially store None as a value which can affect index creation
            # and screw up joins. It's easier if everything that is None / NaN
            # is np.nan.
            df.fillna(np.nan, inplace=True)

            # HACK(stephen): Clean up timestamp column to be mildly presentable
            # without needing frontend changes.
            if TIMESTAMP_COLUMN in df:
                df[TIMESTAMP_COLUMN] = df[TIMESTAMP_COLUMN].str.replace(
                    'T00:00:00.000Z', ''
                )

            # If the final query uses the `all` granularity, try to see if there was an
            # alternate granularity specified instead as a DimensionSpec. If there was,
            # we should replace the timestamp column with the values from this
            # granularity extraction.
            if query.granularity == 'all':
                alternate_granularity = detect_alternate_granularity(query.dimensions)
                if alternate_granularity:
                    df[TIMESTAMP_COLUMN] = df.pop(alternate_granularity)

            # Apply any synthetic calculations that must be computed post-query.
            # NOTE(stephen): There is no guarantee that synthetic calculations will be
            # computed in a specific order, so right now synthetic calculations cannot
            # rely on the result of a different synthetic calculation to compute its own
            # result (like Calc B relies on Calc A but Calc B is called first).
            grouping_dimension_ids = self.grouping_dimension_ids()
            for field in self.request.fields:
                calculation = field.calculation
                if isinstance(calculation, SyntheticCalculation):
                    df[field.id] = calculation.calculate_result(
                        df, grouping_dimension_ids, field.id
                    )

        return df

    def build_query(self) -> GroupByQueryBuilder:
        '''Convert the request into a Druid query.'''
        return self.request.to_druid_query(self.datasource.name)

    def get_df(self) -> pd.DataFrame:
        '''Return a pandas dataframe built from the query response.'''
        raw_df = self._run_query()
        return self.build_df(raw_df)

    def get_response(
        self,
    ) -> object:
        '''Return the formatted query response to send to the frontend.'''
        try:
            df = clean_df_for_json_export(self.get_df())
            return self.build_response(df)
        # TODO(sophie): Add a more nuanced druid query error handler that can give more
        # detailed/helpful information to the frontend.
        except DruidQueryError:
            abort(INTERNAL_SERVER_ERROR, 'Druid query error')

    def build_df(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        # pylint: disable=no-self-use
        '''Process the raw query response dataframe.'''
        return raw_df

    @abstractmethod
    def build_response(self, df: pd.DataFrame) -> object:
        '''Build the query response result from the result dataframe.'''
        pass

    def has_time_grouping(self) -> bool:
        '''Test if the query request includes a time grouping column. If so, the
        ${TIMESTAMP_COLUMN} will include the time values to include in the results.
        '''
        # If the user's query is not "all", then there will be separate events returned
        # for each time bucket within the granularity. Likewise, if the user has
        # selected a granularity extraction, there will be separate time buckets
        # matching the extraction pattern.
        return any(
            isinstance(group, GroupingGranularity) for group in self.request.groups
        )

    def grouping_dimension_ids(self) -> List[str]:
        return [group.dimension for group in self.request.grouping_dimensions()]

    def grouping_order(self) -> List[str]:
        '''Build the ordered list of dimension IDs the request groups on. Include
        the timestamp column if the user is grouping on a Granularity.
        '''
        return [
            TIMESTAMP_COLUMN
            if isinstance(group, GroupingGranularity)
            else group.dimension
            for group in self.request.groups
        ]
