from pydruid.utils.aggregators import (
    filtered as filtered_aggregator,
    hyperunique,
    thetasketch,
)
from pydruid.utils.filters import Filter

from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.aggregations.exact_unique_count_aggregation import (
    ExactUniqueCountAggregation,
)

# Compute the unique count of a field that has been ingested using the
# HyperUnique metric.
class HyperUniqueCountCalculation(BaseCalculation):
    # TODO(stephen): Support a filtered hyper unique count
    def __init__(self, field, hyper_unique_field):
        aggregations = {field: hyperunique(hyper_unique_field)}

        super(HyperUniqueCountCalculation, self).__init__(aggregations=aggregations)


# Compute the exact unique count for a given dimension.
# NOTE(stephen): This calculation should almost never be used. It's very
# dangerous. Talk to @stephen if you think you need to use it.
class ExactUniqueCountCalculation(BaseCalculation):
    def __init__(self, dimension, name, count_filter=None):
        aggregations = {
            name: ExactUniqueCountAggregation(dimension, name, count_filter)
        }

        super(ExactUniqueCountCalculation, self).__init__(aggregations=aggregations)


# Compute the unique count of a field that has been ingested using the
# ThetaSketch metric. Optionally count uniqueness only when the supplied filter
# is met.
class ThetaSketchUniqueCountCalculation(BaseCalculation):
    def __init__(
        self,
        name,
        theta_sketch_field,
        size=16384,
        count_filter=None,
        is_input_theta_sketch=True,
    ):
        aggregator = thetasketch(theta_sketch_field, is_input_theta_sketch, size)
        if count_filter:
            aggregator = filtered_aggregator(filter=count_filter, agg=aggregator)
        aggregations = {name: aggregator}

        super(ThetaSketchUniqueCountCalculation, self).__init__(
            aggregations=aggregations
        )
