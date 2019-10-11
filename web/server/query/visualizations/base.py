from builtins import object
from abc import ABCMeta, abstractmethod
from datetime import datetime
from flask import current_app

import numpy as np
import pandas as pd

from config.system import STANDARD_DATA_DATE_FORMAT
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import build_filter_from_dict, build_time_interval
from web.server.query.visualizations.util import clean_df_for_json_export
from future.utils import with_metaclass


def _get_dates_from_request(request):
    start_date = datetime.strptime(
        request['startDate'], STANDARD_DATA_DATE_FORMAT
    ).date()
    end_date = datetime.strptime(request['endDate'], STANDARD_DATA_DATE_FORMAT).date()
    return (start_date, end_date)


# Base visualization that handles parsing of common request fields
class BaseVisualization(with_metaclass(ABCMeta, object)):
    def __init__(self, request, query_client):
        # $ConfigImportHack
        # HACK(vedant) - Because we want to completely break the dependence on the
        # configuration import hack, we need to reference values via a dynamic import
        self.dimension_slices = current_app.zen_config.aggregation.DIMENSION_SLICES
        self.get_calculation_for_fields = (
            current_app.zen_config.aggregation_rules.get_calculation_for_fields
        )
        self.get_granularity_for_interval = (
            current_app.zen_config.aggregation_rules.get_granularity_for_interval
        )
        self.datasource = current_app.druid_context.current_datasource

        # HACK(stephen):
        # Support legacy behavior where only a single dimension is
        # requested by the frontend. If this happens, we need to
        # grab all the dimensions to group by from the config
        # TODO(stephen): Have frontend specify exact dimensions
        # TODO(stephen): Dimension IDs would be awesome to have in the
        # DB so that we can use TopN and Timeseries more
        dimensions = request['dimensions']
        if len(dimensions) == 1:
            dimension = dimensions[0]
            dimensions = list(self.dimension_slices.get(dimension, [dimension]))
        # END HACK(stephen)

        self.query_client = query_client

        self._dimensions = dimensions
        self._fields = request['fields']
        self._calculation = self.get_calculation_for_fields(self._fields)
        self._calculation.set_strict_null_fields(self._fields)

        (start_date, end_date) = _get_dates_from_request(request)
        self._granularity = self.get_granularity_for_interval(
            request['granularity'], start_date, end_date
        )
        self._interval = build_time_interval(start_date, end_date)

        # Query filter is optional
        self._query_filter = None
        requested_filter = request.get('queryFilter', {})
        if requested_filter:
            self._query_filter = build_filter_from_dict(requested_filter)

        self._value_groups = request.get('valueGroups', {})
        self._validate_value_groups(self._value_groups)

        # The list of numeric fields to build results for. Defaults to all
        # requested fields + all computed fields
        self._numeric_fields = []
        for field in self._fields + list(self._value_groups.keys()):
            # TODO(stephen): Would love this to be an ordered set. It is
            # a list for now since we want to preserve requested field order.
            if field not in self._numeric_fields:
                self._numeric_fields.append(field)

        # TODO(stephen): Do something with result filter. It is an optimization
        # for dashboards that allows results to be fully filtered and reduced
        # before hitting the frontend.
        self._result_filter = request.get('resultFilter')

    @property
    def dimensions(self):
        return self._dimensions

    @property
    def calculation(self):
        return self._calculation

    @property
    def numeric_fields(self):
        return self._numeric_fields

    @property
    def value_groups(self):
        return self._value_groups

    @property
    def granularity(self):
        return self._granularity

    @property
    def interval(self):
        return self._interval

    @property
    def query_filter(self):
        return self._query_filter

    # TODO(stephen): Allow client to specify complex calculations to apply
    @staticmethod
    def _validate_value_groups(value_groups):
        return True or value_groups

    def _build_query(self):
        return GroupByQueryBuilder(
            datasource=self.datasource.name,
            granularity=self.granularity,
            grouping_fields=self.dimensions,
            intervals=[self.interval],
            calculation=self.calculation,
            dimension_filter=self.query_filter,
        )

    def _run_query(self):
        '''Run the built query and return the results in a dataframe.'''
        query = self._build_query()
        result = self.query_client.run_query(query)
        df = result.export_pandas(True)

        # Stupid pydruid doesn't return a DataFrame if the result is empty
        # TODO(stephen): Handle empty results more cleanly. Potentially
        # show error messages
        if df is None:
            df = pd.DataFrame()

        if not df.empty:
            # TODO(stephen): Figure out how to optimize these groups and if they
            # can be computed within a single DB aggregation instead of
            # inside the dataframe
            if self._value_groups:
                for k, v in list(self._value_groups.items()):
                    formula = '%s = %s' % (k, v)
                    df.eval(formula, inplace=True)

            # Replace all NA/NaN values with np.nan. String columns can
            # potentially store None as a value which can affect index creation
            # and screw up joins. It's easier if everything that is None / NaN
            # is np.nan.
            df.fillna(np.nan, inplace=True)

        return df

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
