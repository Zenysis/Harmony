from typing import Optional

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
from db.druid.post_aggregations.theta_sketch import (
    TupleSketchEstimatePostAggregation,
    TupleSketchFilterExpressionPostAggregation,
    TupleSketchPostAggregation,
    bound_sketch_size,
)

# Compute the unique count of a field that has been ingested using the
# HyperUnique metric.
class HyperUniqueCountCalculation(BaseCalculation):
    # TODO(stephen): Support a filtered hyper unique count
    def __init__(self, field, hyper_unique_field):
        aggregations = {field: hyperunique(hyper_unique_field)}

        super().__init__(aggregations=aggregations)


# Compute the exact unique count for a given dimension.
# NOTE(stephen): This calculation should almost never be used. It's very
# dangerous. Talk to @stephen if you think you need to use it.
class ExactUniqueCountCalculation(BaseCalculation):
    def __init__(self, dimension, name, count_filter=None):
        aggregations = {
            name: ExactUniqueCountAggregation(dimension, name, count_filter)
        }

        super().__init__(aggregations=aggregations)


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
        aggregator = thetasketch(
            theta_sketch_field, is_input_theta_sketch, bound_sketch_size(size)
        )
        if count_filter:
            aggregator = filtered_aggregator(filter=count_filter, agg=aggregator)
        aggregations = {name: aggregator}

        super().__init__(aggregations=aggregations)


class TupleSketchUniqueCountCalculation(BaseCalculation):
    def __init__(self, name: str, dimension_id: str, size: int = 16384):
        self.agg_name = name
        self.agg_size = bound_sketch_size(size)
        self.tuple_sketch_agg = {
            'fieldName': dimension_id,
            'metricFilters': [],
            'nominalEntries': self.agg_size,
            'numberOfValues': 0,
            'type': 'arrayOfFilteredDoublesSketch',
        }
        aggregations = {name: self.tuple_sketch_agg}

        super().__init__(aggregations=aggregations)

    def add_metric(
        self, metric_column: str, metric_filter: Optional[Filter] = None
    ) -> int:
        '''Add a metric to column to calculate values for to the tuple sketch. If a
        metric filter is provided, restrict the metric values to calculate to this
        filter.

        Returns the index of this metric's value in the tuple sketch.
        '''
        metric_entry = {
            'metricColumn': metric_column,
            'filter': (
                Filter.build_filter(metric_filter)
                if metric_filter
                else {'type': 'true'}
            ),
        }
        self.tuple_sketch_agg['metricFilters'].append(metric_entry)

        metric_idx = self.number_of_metrics
        self.tuple_sketch_agg['numberOfValues'] += 1
        return metric_idx

    @property
    def number_of_metrics(self):
        return self.tuple_sketch_agg['numberOfValues']

    def add_estimate_post_aggregation(
        self, post_agg_id: str, expression: str, size: Optional[int] = None
    ) -> None:
        '''Add a post aggregation that computes the number of unique values in the
        sketch that match the filter expression supplied.
        '''
        post_agg = TupleSketchEstimatePostAggregation(
            TupleSketchFilterExpressionPostAggregation(
                f'{post_agg_id}__tuple_filter',
                TupleSketchPostAggregation(self.agg_name),
                expression,
                self.agg_size if size is None else bound_sketch_size(size),
            )
        )
        self.add_post_aggregation(post_agg_id, post_agg)
