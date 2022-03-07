from pydruid.utils.aggregators import (
    doublemax,
    doublesum,
    filtered as filtered_aggregator,
    longmax,
    longmin,
    longsum,
)
from pydruid.utils.filters import Filter

from db.druid.aggregations.time_interval_aggregation import TimeIntervalAggregation
from db.druid.calculations.base_calculation import BaseCalculation

# Most common calculation used. Creates a sum aggregator for a given field.
class SumCalculation(BaseCalculation):
    def __init__(self, dimension, field, aggregation_suffix=''):
        self.sum_key = '%s%s' % (field, aggregation_suffix)
        self.dimension = dimension
        self.dimension_filter = Filter(dimension=dimension, value=field)

        aggregations = {
            self.sum_key: filtered_aggregator(
                filter=self.dimension_filter, agg=doublesum('sum')
            )
        }

        super(SumCalculation, self).__init__(aggregations=aggregations)

    @classmethod
    def create_with_filter(cls, field, agg_filter):
        # Setup the sum calculation normally.
        calculation = SumCalculation('__unused__', field)
        # Replace the filter that wraps the aggregator with the new filter.
        aggregation = calculation.aggregations[calculation.sum_key]
        aggregation['filter'] = agg_filter.build_filter()
        return calculation


# Class that calculates weighted average which is defined by:
#   SUM (weighted values) / SUM (weights)
class WeightedAverageCalculation(SumCalculation):
    SUFFIX = '_for_weighted_average'

    def __init__(self, dimension, field, weight_field):
        super(WeightedAverageCalculation, self).__init__(dimension, field, self.SUFFIX)

        self.weight_key = '%s%s' % (weight_field, self.SUFFIX)
        self.weight_filter = Filter(dimension=dimension, value=weight_field)

        weight_aggregation = {
            self.weight_key: filtered_aggregator(
                filter=self.weight_filter, agg=doublesum('sum')
            )
        }
        self.add_aggregations(weight_aggregation)

        weighted_avg = '%s / %s' % (self.sum_key, self.weight_key)
        self.add_post_aggregation_from_formula(field, weighted_avg)


class AverageCalculation(SumCalculation):
    SUFFIX = '_for_average'

    def __init__(self, dimension, field):
        super(AverageCalculation, self).__init__(dimension, field, self.SUFFIX)
        # Calculate the count for this field.
        count_key = '%s_event_count%s' % (field, self.SUFFIX)
        count_agg = filtered_aggregator(
            filter=self.dimension_filter, agg=longsum('count')
        )
        self.add_aggregation(count_key, count_agg)

        avg_formula = '%s / %s' % (self.sum_key, count_key)
        self.add_post_aggregation_from_formula(field, avg_formula)


# Scale an aggregated field by the difference of a linearly increasing
# sequential field. The sequential field should work as a proxy for counting
# a specific type of event (like month, day, second).
class AverageOverSequenceCalculation(SumCalculation):
    SUFFIX = '_for_average_over_sequence'

    def __init__(
        self, dimension, sum_field, sequence_field, sequence_scaling_constant=1
    ):
        super(AverageOverSequenceCalculation, self).__init__(
            dimension, sum_field, self.SUFFIX
        )
        self.sequence_field = sequence_field
        self.min_key = '%s_minimum' % sequence_field
        self.max_key = '%s_maximum' % sequence_field

        # Build a set of aggregations for calculating the minimum and
        # maximum values seen for the specified sequence field
        aggregations = {
            self.min_key: self.build_sequence_aggregation(longmin),
            self.max_key: self.build_sequence_aggregation(longmax),
        }
        self.add_aggregations(aggregations)

        # Compute the difference between the minimum and maximum sequence values
        sequence_difference = '(%s - %s)' % (self.max_key, self.min_key)

        # If requested, scale the sequence difference by an appropriate
        # scaling factor for its type
        if sequence_scaling_constant and sequence_scaling_constant != 1:
            sequence_difference = '(%s / %s)' % (
                sequence_difference,
                sequence_scaling_constant,
            )

        # Need to add one since we are scaling by the number of sequence values
        # seen (like seq=1, seq=2 would be 2 sequence values even though the
        # difference is just 1). We can accurately compute the unique sequence
        # values seen since the property of the sequence field is that it is
        # linearly increasing.
        denominator_formula = '1 + %s' % sequence_difference

        # Use a post aggregation formula to convert the raw aggregated sum
        # field into the scaled version.
        avg_formula = '%s / (%s)' % (self.sum_key, denominator_formula)
        self.add_post_aggregation_from_formula(sum_field, avg_formula)

    def build_sequence_aggregation(self, agg_type):
        # Special case for druid builtin type "__time". It should not be
        # used as part of a filtered aggregation
        if self.sequence_field == '__time':
            return agg_type('__time')

        dimension_filter = Filter(dimension=self.dimension, value=self.sequence_field)
        return filtered_aggregator(filter=dimension_filter, agg=agg_type('sum'))


# Scale an aggregated field by the number of days in the time bucket.
class AverageOverTimeBucketCalculation(AverageOverSequenceCalculation):
    # Druid timestamp is stored in milliseconds
    MILLISECOND_IN_DAY = 1000 * 60 * 60 * 24
    SUFFIX = '_for_average_over_time_bucket'

    def __init__(self, dimension, field):
        super(AverageOverTimeBucketCalculation, self).__init__(
            dimension, field, f'{field}__time', self.MILLISECOND_IN_DAY
        )
        # Unlike the parent class, we do want to filter the time aggregation to only
        # find the min/max time when this specific field has reported data. Replace the
        # aggregations that the parent calculation will build over the __time dimension
        # with our own filtered variant.
        # TODO(stephen): Refactor the flow of this class because it is convoluted.
        self.aggregations[self.min_key] = self.build_filtered_time_aggregation(
            longmin, dimension, field
        )
        self.aggregations[self.max_key] = self.build_filtered_time_aggregation(
            longmax, dimension, field
        )

    def build_filtered_time_aggregation(self, agg_type, dimension, sequence_field):
        dimension_filter = Filter(dimension=dimension, value=sequence_field)
        return filtered_aggregator(filter=dimension_filter, agg=agg_type('__time'))


# Only sum a field when the timestamp equals the max timestamp seen for
# that field.
class LastValueCalculation(BaseCalculation):
    def __init__(self, dimension, field, aggregation_suffix=''):
        self.key = '%s%s' % (field, aggregation_suffix)
        self.dimension = dimension
        self.dimension_filter = Filter(dimension=dimension, value=field)
        inner_agg = {
            'type': 'aggregateLast',
            'aggregator': {**doublesum('sum'), 'name': self.key},
        }
        aggregations = {
            self.key: filtered_aggregator(filter=self.dimension_filter, agg=inner_agg)
        }
        super(LastValueCalculation, self).__init__(aggregations=aggregations)


# Scale an aggregated field by an integer constant
class ScaledConstantCalculation(SumCalculation):
    SUFFIX = '_for_scaled_constant'

    def __init__(self, dimension, field, constant):
        super(ScaledConstantCalculation, self).__init__(dimension, field, self.SUFFIX)
        # TODO(stephen): Allow multiplication or division for scaling
        scaled_formula = '%s / %s' % (self.sum_key, constant)
        self.add_post_aggregation_from_formula(field, scaled_formula)


# Perform some aggregation over the druid internal `__time` field which returns
# the timestamp of the aggregation result in epoch milliseconds.
class TimeCalculation(BaseCalculation):
    def __init__(self, result_id, agg_type, query_filter=None):
        base_aggregation = agg_type('__time')
        if query_filter:
            base_aggregation = filtered_aggregator(
                filter=query_filter, agg=base_aggregation
            )
        aggregations = {result_id: base_aggregation}
        super(TimeCalculation, self).__init__(aggregations)


# This calculation wraps a base aggregation in a time interval dependent
# filter that must be resolved at query time. It is useful for calculating
# values where the aggregation type is known but the final filter that should
# be used is not known until the query is issued.
class TimeIntervalCalculation(BaseCalculation):
    def __init__(self, result_id, base_aggregation, interval_creator):
        aggregations = {
            result_id: TimeIntervalAggregation(base_aggregation, interval_creator)
        }
        super(TimeIntervalCalculation, self).__init__(aggregations=aggregations)

    # Convenience method for building a TimeIntervalCalculation over a field
    # that should be summed.
    @classmethod
    def sum_calculation(cls, dimension, field, interval_creator):
        dimension_filter = Filter(dimension=dimension, value=field)
        base_aggregation = filtered_aggregator(
            filter=dimension_filter, agg=doublesum('sum')
        )
        return cls(field, base_aggregation, interval_creator)


class MaxCalculation(BaseCalculation):
    def __init__(self, dimension, field, aggregation_suffix=''):
        self.max_key = '%s%s' % (field, aggregation_suffix)
        self.dimension_filter = Filter(dimension=dimension, value=field)
        aggregations = {
            self.max_key: filtered_aggregator(
                filter=self.dimension_filter, agg=doublemax('max')
            )
        }

        super(MaxCalculation, self).__init__(aggregations=aggregations)
