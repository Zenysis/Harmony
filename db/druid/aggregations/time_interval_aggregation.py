import math

from datetime import date, timedelta
from abc import ABCMeta, abstractmethod

from pydruid.utils.aggregators import filtered as filtered_aggregator
from pydruid.utils.filters import Filter

from db.druid.aggregations.query_dependent_aggregation import QueryDependentAggregation
from db.druid.util import build_filter_from_aggregation, unpack_time_interval

GRANULARITY_ORDER = ['day', 'week', 'month', 'quarter', 'year', 'all']


# Aggregate only during a specified time interval. This calculation must
# be constructed at query time since it is dependent on the time intervals
# being queried
class TimeIntervalAggregation(QueryDependentAggregation):
    def __init__(self, base_aggregation, filter_creator):
        assert isinstance(filter_creator, IntervalCreator), (
            'Incompatible interval creator passed in. ' 'Function: %s' % filter_creator
        )

        self._filter_creator = filter_creator
        self.initial_filter = build_filter_from_aggregation(base_aggregation)
        super(TimeIntervalAggregation, self).__init__(base_aggregation)

    # Build a filtered aggregation around the computed time intervals
    def build_full_aggregation(self, dimensions, granularity, intervals):
        intervals_filter = self._filter_creator.get_interval_filter(
            granularity, intervals
        )

        # An interval filter might not be built for every query type. If
        # no interval filter is created, just return the original aggregation
        if not intervals_filter:
            return self.base_aggregation

        aggregation = self.base_aggregation
        # If the base aggregation is a filtered aggregation, AND its
        # filter with the new intervals filter. Drop the original filter
        # from the aggregation so that only the new filter is attached.
        if self.initial_filter:
            intervals_filter &= self.initial_filter
            aggregation = self.base_aggregation['aggregator']

        return filtered_aggregator(filter=intervals_filter, agg=aggregation)


# Simple interface defining how a filtered time interval should be created
# for a given query
class IntervalCreator(metaclass=ABCMeta):
    @abstractmethod
    def get_interval_filter(self, granularity, intervals):
        pass


# Stock indicators require information about the current query to properly
# be calculated. This class uses the current query's granularity and intervals
# to create the list of time intervals a stock indicator can be calculated
# during.
class StockIntervalCreator(IntervalCreator, metaclass=ABCMeta):
    def __init__(self, stock_granularity, bucket_index):
        self.stock_granularity = stock_granularity
        self.bucket_index = bucket_index

    def get_interval_filter(self, granularity, intervals):
        # TODO(david, stephen): Rewrite this entire function and
        # build_interval_buckets. We basically have two cases:
        # 1) query granularity <= stock granularity => no intervals needed
        # 2) query granularity > stock granularity => we split the intervals
        # into sub-intervals determined by the query granularity and then we
        # want to select the last value within those intervals

        query_intervals = []

        if granularity == 'all':
            query_intervals = intervals

            # If the 'all' granularity is selected and multiple time intervals
            # are given, we expand the query range to include the earliest and
            # latest dates searched. This is because only a single value is
            # returned for an aggregation with the 'all' granularity, so
            # multiple intervals would cause invalid aggregation.
            if len(intervals) > 1:
                start = intervals[0].split('/')[0]
                end = intervals[-1].split('/')[1]
                query_intervals = ['%s/%s' % (start, end)]
        elif isinstance(granularity, dict):
            # If the granularity passed in is an arbitrary granularity, use its
            # intervals directly.
            assert granularity.get('type') == 'arbitrary', (
                'Malformed granularity provided: %s' % granularity
            )
            query_intervals = granularity['intervals']
        elif (
            GRANULARITY_ORDER.index(granularity)
            <= GRANULARITY_ORDER.index(self.stock_granularity)
        ) or not intervals:
            # If we are querying at the same granularity level or lower then the
            # stock interval granularity, we don't need to return a filter.
            return None
        else:
            # Otherwise, convert the string granularity (i.e. 'month',
            # 'quarter') into a query interval list.
            query_buckets = set()
            for interval in intervals:
                query_buckets.update(self.build_interval_buckets(granularity, interval))
            query_intervals = sorted(query_buckets)

        buckets = []
        for interval in query_intervals:
            bucket_intervals = self.build_interval_buckets(
                self.stock_granularity, interval
            )
            buckets.append(bucket_intervals[self.bucket_index])

        filter_intervals = [
            self.build_interval_buckets(self.stock_granularity, interval)[
                self.bucket_index
            ]
            for interval in query_intervals
        ]

        return Filter(type='interval', dimension='__time', intervals=filter_intervals)

    @abstractmethod
    def build_interval_buckets(self, granularity, interval):
        '''Return a list of time intervals by splitting the input interval into
        buckets based on the provided granularity.
        '''
        pass


# Gregorian stock interval creator that uses month 1 as the start of the fiscal
# year (Q1 is January, Month 1 is January). This is the most common stock
# interval creator.
class GregorianStockIntervalCreator(StockIntervalCreator):
    # Mapping from month (index - 1) to the corresponding start month for the
    # given bucket.
    MONTH_MAPPING = {
        'month': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'quarter': [1, 1, 1, 4, 4, 4, 7, 7, 7, 10, 10, 10],
        'year': [1] * 12,
    }

    # Size of granularity in number of months.
    BUCKET_SIZE = {'month': 1, 'quarter': 3, 'year': 12}

    def build_interval_buckets(self, granularity, interval):
        output = []
        (start_date, raw_end_date) = unpack_time_interval(interval)

        # We clamp the end_interval date to not be later than todays date to
        # avoid return buckets for which there will be no data.
        # TODO(david, stephen): This will break any stock interval forecasts.
        # We should see if we can instead limit it to the last date for which we
        # have data for the specific indicator.
        end_date = min(raw_end_date, date.today() + timedelta(days=1))

        if start_date >= end_date:
            return output

        if granularity == 'day':
            for i in range((end_date - start_date).days):
                interval_start = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                interval_end = (start_date + timedelta(days=i + 1)).strftime('%Y-%m-%d')
                output.append('%s/%s' % (interval_start, interval_end))
            return output

        if granularity == 'week':
            for i in range(math.ceil((end_date - start_date).days / 7)):
                interval_start = (start_date + timedelta(days=i * 7)).strftime(
                    '%Y-%m-%d'
                )
                interval_end = (start_date + timedelta(days=(i + 1) * 7)).strftime(
                    '%Y-%m-%d'
                )
                output.append('%s/%s' % (interval_start, interval_end))
            return output

        bucket_size = self.BUCKET_SIZE[granularity]
        month = self.MONTH_MAPPING[granularity][start_date.month - 1]
        year = start_date.year
        while not (
            # If the year is larger, we're definitely done.
            year > end_date.year
            or
            # If the year matches the end year, check if the month is
            # greater than the end month.
            (year == end_date.year and month > end_date.month)
            or
            # If the year matches the end year and the month matches the end
            # month, only break if the end date is not the first of the
            # month. If the end date is not the first of the month, we will
            # need to include one more interval.
            (year == end_date.year and month == end_date.month and end_date.day == 1)
        ):
            interval_start = '%s-%02d-01' % (year, month)
            month = month + bucket_size
            if month > 12:
                month = month % 12
                year += 1
            interval_end = '%s-%02d-01' % (year, month)
            output.append('%s/%s' % (interval_start, interval_end))
        return output
