import related

from pydruid.utils.aggregators import doublesum, filtered as filtered_aggregator

from data.query.models.calculation.calculation import Calculation, SUM_METRIC
from db.druid.calculations.base_calculation import BaseCalculation


@Calculation.register_subtype
@related.immutable
class SumCalculation(Calculation):
    metric = related.StringField(SUM_METRIC)
    type = related.StringField('SUM')

    def to_druid(self, result_id):
        if self.filter:
            aggregations = {
                result_id: filtered_aggregator(
                    filter=self.filter.to_druid(), agg=doublesum(self.metric)
                )
            }
        else:
            aggregations = {result_id: doublesum(self.metric)}

        return BaseCalculation(
            aggregations=aggregations, strict_null_fields=[result_id]
        )
