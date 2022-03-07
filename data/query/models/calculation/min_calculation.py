import related

from pydruid.utils.aggregators import doublemin, filtered as filtered_aggregator

from data.query.models.calculation.calculation import Calculation, SUM_METRIC
from db.druid.calculations.base_calculation import BaseCalculation


@related.immutable
class MinCalculation(Calculation):
    type = related.StringField('MIN')

    def to_druid(self, result_id):
        aggregations = {
            result_id: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublemin(SUM_METRIC)
            )
        }
        return BaseCalculation(
            aggregations=aggregations, strict_null_fields=[result_id]
        )


Calculation.register_subtype(MinCalculation)
