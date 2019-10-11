# pylint: disable=R0204

from builtins import object
from datetime import datetime

import pandas as pd

from pydruid.query import QueryBuilder as DruidQueryBuilder
from pydruid.utils.filters import Dimension, Filter
from pydruid.utils.aggregators import count, doublesum

from config.aggregation_rules import get_granularity_for_interval
from config.database import DATASOURCE
from config.system import STANDARD_DATA_DATE_FORMAT

# Import query tools.
from db.druid.query_client import DruidQueryClient
from db.druid.util import unpack_time_interval

TODAY_DATE_STR = datetime.strftime(datetime.now(), STANDARD_DATA_DATE_FORMAT)
START_DATE_STR = '2014-01-01'
DEFAULT_DATE_COLUMN = 'timestamp'
DEFAULT_FIELD = 'field'
DEFAULT_FILTER = Dimension('nation') == ''

QUERY = DruidQueryBuilder()


class PydruidQuery(object):
    ''' Class to query all data from the Zen druid db.
    Returned dataframe dimensions are; rows: time dimension, columns: indicators.
    Example usage (query all indicators summed at the national level):
        >> import os
        >> os.environ['ZEN_ENV'] = 'et'
        >> from pydruid_query import PydruidQuery
        >> conn = PydruidQuery()
        >> result_df = conn.fetch_data(include_count=True)'''

    def __init__(self, query_client=None):
        ''' Class to query pydruid and return the data as a pandas dataframe.
        Pivoted to contain '''
        self.datasource = DATASOURCE.name
        self.granularity = 'month'
        self.intervals = '%s/%s' % (START_DATE_STR, TODAY_DATE_STR)
        self.dimensions = []
        self.field_dimension = DEFAULT_FIELD
        self.filter = DEFAULT_FILTER
        self.agg_alias = 'sum'
        self.aggregations = {self.agg_alias: doublesum('sum'), 'count': count('count')}
        self.query_client = query_client or DruidQueryClient

    def fetch_data(self, include_count=False, enable_warning=True):
        ''' Setup the query, return the data as a pandas dataframe, the dataframe is pivoted to
        format the rows as the date and columns as the indicators.
        Optional inputs:
            include_count=False: If True then return a two level column index containing both the
                                 values and the count infomation. Indexed with 'sum' or 'count'.
            ignore_warning=False: By default this method will not fetch data when more than one
                                  grouping dimensions are set with only the defualt filter.'''
        # Block the query if there are too many grouping dimensions without any filter set.
        if (
            enable_warning
            and len(self.dimensions) > 1
            and self.filter == DEFAULT_FILTER
        ):
            print(
                'Warning! You are grouping by multiple dimensions without a filter.\n'
                'This opperation may cause a query overload and is not permitted.\n'
                'Selected grouping dimensions = %s\n'
                'Selected filter = %s' % (self.dimensions, self.filter)
            )
            return pd.DataFrame()

        # Note: The function get_granularity_for_interval() will return buckets corresponding to
        # Ethiopian months when quering the Ethiopian database.
        dimensions = self.dimensions + [self.field_dimension]
        query_group = QUERY.groupby(
            {
                'datasource': self.datasource,
                'intervals': self.intervals,
                'granularity': get_granularity_for_interval(
                    self.granularity, *unpack_time_interval(self.intervals)
                ),
                'dimensions': dimensions,
                'filter': self.filter,
                'aggregations': self.aggregations,
            }
        )
        # Run query.
        query_result = self.query_client.run_pydruid_query(query_group)
        # Return a pandas dataframe.
        result_df = query_result.export_pandas()
        # If the dataframe is empty then return.
        if result_df is None:
            return pd.DataFrame()
        # Create Real_Date column and set as a datetime variable type.
        result_df['Real_Date'] = pd.to_datetime(result_df[DEFAULT_DATE_COLUMN])
        # If include_count create a two level column index with ['sum'] and ['count'].
        if include_count:
            values = [self.agg_alias, 'count']
        else:
            # If the values var remains a list then a multilevel index dataframe will be returned.
            values = self.agg_alias

        columns = self.dimensions + [DEFAULT_FIELD]
        result_df_pivot = result_df.pivot_table(
            index='Real_Date', columns=columns, values=values
        )
        return result_df_pivot

    def set_datasource(self, datasource):
        ''' Set the datasrouce name.'''
        self.datasource = datasource

    def set_granularity(self, granularity):
        ''' Granularity in time. Day, Month, Year.'''
        self.granularity = granularity

    def set_intervals(self, start_date, end_date):
        ''' The date range. Inputs: start date and end date formated as YYYY-MM-DD.'''
        self.intervals = '%s/%s' % (start_date, end_date)

    def set_dimensions(self, dimensions):
        ''' Set the dimensions to groupby: ['field', 'RegionName', 'ZoneName', 'WoredaName'].'''
        self.dimensions = dimensions

    def set_field_filter(self, field_selections):
        ''' Given a list of indicators to select create a filter object using the 'in' type.
        https://pypkg.com/pypi/pydruid/f/pydruid/utils/filters.py'''
        # HACK(stephen): This isn't very robust.
        self.field_dimension = {
            'type': 'listFiltered',
            'delegate': 'field',
            'values': field_selections,
        }
        self.filter &= Filter(
            type='in', dimension=DEFAULT_FIELD, values=field_selections
        )

    def set_dimension_filter(self, dimension_selections, negate=False):
        ''' Given a dict of dimensions and selection values create a filter object
            using the 'in' type.
        Example:
                geo_selections = {'nation': [''],
                                  'RegionName': ['Tigray', 'Amhara'],
                                  'WoredaName': ['Kafta Humera']
                                  }.
        Input: negate=False. If True then do not include the specified dimensions.
            Loop through the arguments and combine the in-filters with an and-filter.
            This is equivalent to Filter(type='and', fields=[filter_1, filter_2]).'''
        for dim, vals in dimension_selections.items():
            if negate:
                self.filter &= ~Filter(type='in', dimension=dim, values=vals)
            else:
                self.filter &= Filter(type='in', dimension=dim, values=vals)

    def clear_filters(self):
        ''' Reset the filter to filter = (Dimension('nation') == '').'''
        self.filter = DEFAULT_FILTER

    def set_aggregations(self, alias, aggregations):
        ''' Provide a dictionary of aggregations and the alias used.
            For example, sum: doublesum(sum)'''
        self.aggregations = aggregations
        self.agg_alias = alias
