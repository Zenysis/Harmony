from builtins import object
from abc import ABCMeta, abstractmethod

import numpy as np
import pandas as pd

from data.wip.models import Granularity
from web.server.query.visualizations.util import clean_df_for_json_export
from future.utils import with_metaclass

TIMESTAMP_COLUMN = 'timestamp'


class AQTBase(with_metaclass(ABCMeta, object)):
    def __init__(self, request, query_client, datasource, fill_intermediate_dates=True):
        self.request = request
        self.query_client = query_client
        self.datasource = datasource
        self.fill_intermediate_dates = fill_intermediate_dates

    def _run_query(self):
        '''Run the built query and return the results in a dataframe.'''
        df = None

        # Cowardly refuse to issue a query if no fields have been selected since
        # druid won't be able to return results.
        if self.request.fields:
            query = self.build_query()
            result = self.query_client.run_query(query)
            df = result.export_pandas(self.fill_intermediate_dates)

        # Stupid pydruid doesn't return a DataFrame if the result is empty
        # TODO(stephen): Handle empty results more cleanly. Potentially
        # show error messages
        if df is None:
            df = pd.DataFrame()

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

            granularity_extraction = self.request.granularity_extraction()
            if granularity_extraction:
                df[TIMESTAMP_COLUMN] = df[granularity_extraction.id]
                df.drop(columns=[granularity_extraction.id], inplace=True)

        return df

    def build_query(self):
        '''Convert the request into a Druid query.'''
        return self.request.to_druid_query(self.datasource.name)

    def get_df(self):
        '''Return a pandas dataframe built from the query response.'''
        raw_df = self._run_query()
        return self.build_df(raw_df)

    def get_response(self):
        '''Return the formatted query response to send to the frontend.'''
        df = clean_df_for_json_export(self.get_df())
        return self.build_response(df)

    def build_df(self, raw_df):  # pylint: disable=no-self-use
        '''Process the raw query response dataframe.'''
        return raw_df

    @abstractmethod
    def build_response(self, df):
        '''Build the query response result from the result dataframe.'''
        pass

    def has_time_grouping(self):
        '''Test if the query request includes a time grouping column. If so, the
        ${TIMESTAMP_COLUMN} will include the time values to include in the results.
        '''
        # If the user's query is not "all", then there will be separate events returned
        # for each time bucket within the granularity. Likewise, if the user has
        # selected a granularity extraction, there will be separate time buckets
        # matching the extraction pattern.
        return self.request.granularity_extraction() or self.request.granularity()

    def grouping_dimension_ids(self):
        return [group.dimension.id for group in self.request.grouping_dimensions()]

    def grouping_order(self):
        '''Build the ordered list of dimension IDs the request groups on. Include
        the timestamp column if the user is grouping on a Granularity.
        '''
        return [
            TIMESTAMP_COLUMN if isinstance(group, Granularity) else group.dimension.id
            for group in self.request.groups
        ]
