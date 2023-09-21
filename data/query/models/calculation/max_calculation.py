import related

from pydruid.utils.aggregators import doublemax, filtered as filtered_aggregator

from data.query.models.calculation.calculation import Calculation, MAX_METRIC
from db.druid.calculations.base_calculation import BaseCalculation


@Calculation.register_subtype
@related.immutable
class MaxCalculation(Calculation):
    type = related.StringField('MAX')

    def to_druid(self, result_id):
        aggregations = {
            result_id: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublemax(MAX_METRIC)
            )
        }
        return BaseCalculation(
            aggregations=aggregations, strict_null_fields=[result_id]
        )
