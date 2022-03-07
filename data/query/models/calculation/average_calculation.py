import related

from pydruid.utils.aggregators import doublesum, filtered as filtered_aggregator

from data.query.models.calculation.calculation import (
    Calculation,
    COUNT_METRIC,
    SUM_METRIC,
)
from db.druid.calculations.base_calculation import BaseCalculation


@related.immutable
class AverageCalculation(Calculation):
    type = related.StringField('AVG')

    def to_druid(self, result_id):
        count_key = '%s_count_for_average' % result_id
        sum_key = '%s_sum_for_average' % result_id
        aggregations = {
            count_key: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublesum(COUNT_METRIC)
            ),
            sum_key: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublesum(SUM_METRIC)
            ),
        }
        calculation = BaseCalculation(aggregations=aggregations)

        avg_formula = '%s / %s' % (sum_key, count_key)
        calculation.add_post_aggregation_from_formula(result_id, avg_formula)
        calculation.set_strict_null_fields([result_id])
        return calculation


Calculation.register_subtype(AverageCalculation)
