import related

from pydruid.utils.aggregators import (
    doublesum,
    filtered as filtered_aggregator,
    longmax,
    longmin,
)

from data.query.models.calculation.calculation import Calculation, SUM_METRIC
from db.druid.calculations.base_calculation import BaseCalculation

# Druid timestamp is stored in milliseconds
MILLISECOND_IN_DAY = 1000 * 60 * 60 * 24


@related.immutable
class AverageOverTimeCalculation(Calculation):
    '''Scale an aggregated field by the number of days in the time bucket.

    This is commonly used for `population` style indicators. The full population value
    is repeated every day over a year. Then, to calculate the actual population at a
    specific time, we SUM(population) / number_of_days_in_query (roughly).
    '''

    type = related.StringField('AVERAGE_OVER_TIME')

    def to_druid(self, result_id: str) -> 'BaseCalculation':
        min_time_agg = f'{result_id}__min_time'
        max_time_agg = f'{result_id}__max_time'
        sum_agg = f'{result_id}__raw_sum'

        druid_filter = self.filter.to_druid()
        aggregations = {
            # Find the first/last time an event passes the filter.
            min_time_agg: filtered_aggregator(
                filter=druid_filter, agg=longmin('__time')
            ),
            max_time_agg: filtered_aggregator(
                filter=druid_filter, agg=longmax('__time')
            ),
            sum_agg: filtered_aggregator(
                filter=druid_filter, agg=doublesum(SUM_METRIC)
            ),
        }

        output = BaseCalculation(aggregations=aggregations)

        # Calculate the number of days in the interval. Find the minimum/maximum
        # timestamp *in milliseconds*. Then, subtract the max time from the min time and
        # divide by the number of milliseconds in a day to produce the difference, in
        # days, between the last timestamp and the first. Finally, add 1 so that we
        # have a count of the number of days, not just the difference.
        number_of_days_formula = (
            f'1 + ({max_time_agg} - {min_time_agg}) / {MILLISECOND_IN_DAY}'
        )

        # Scale the sum value by the number of days to get the true value.
        output.add_post_aggregation_from_formula(
            result_id, f'{sum_agg} / ({number_of_days_formula})'
        )
        return output


Calculation.register_subtype(AverageOverTimeCalculation)
