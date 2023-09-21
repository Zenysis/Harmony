import related

from pydruid.utils.aggregators import doublesum, filtered as filtered_aggregator

from data.query.models.calculation.calculation import (
    Calculation,
    COUNT_METRIC,
    SUM_METRIC,
)
from db.druid.calculations.base_calculation import BaseCalculation


@Calculation.register_subtype
@related.immutable
class AverageCalculation(Calculation):
    type = related.StringField('AVG')

    def to_druid(self, result_id):
        count_key = f'{result_id}_count_for_average'
        sum_key = f'{result_id}_sum_for_average'
        aggregations = {
            count_key: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublesum(COUNT_METRIC)
            ),
            sum_key: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublesum(SUM_METRIC)
            ),
        }
        calculation = BaseCalculation(aggregations=aggregations)

        avg_formula = f'{sum_key} / {count_key}'
        calculation.add_post_aggregation_from_formula(result_id, avg_formula)
        calculation.set_strict_null_fields([result_id])
        return calculation
