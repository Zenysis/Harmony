import related

from pydruid.utils.aggregators import doublesum, filtered as filtered_aggregator

from data.query.models.calculation.calculation import Calculation, COUNT_METRIC
from db.druid.calculations.base_calculation import BaseCalculation


@related.immutable
class CountCalculation(Calculation):
    type = related.StringField('COUNT')

    def to_druid(self, result_id):
        aggregations = {
            result_id: filtered_aggregator(
                filter=self.filter.to_druid(), agg=doublesum(COUNT_METRIC)
            )
        }

        # NOTE(stephen): Intentionally not setting strict null fields here
        # becauase count should always be returned.
        return BaseCalculation(aggregations=aggregations)


Calculation.register_subtype(CountCalculation)
