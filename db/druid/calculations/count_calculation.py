from pydruid.utils.aggregators import longsum, filtered as filtered_aggregator
from db.druid.calculations.base_calculation import BaseCalculation


class CountCalculation(BaseCalculation):
    ''' Compute the count of ingested rows matching a given filter
    '''

    def __init__(self, name, calculation_filter):
        aggregations = {
            name: filtered_aggregator(filter=calculation_filter, agg=longsum('count'))
        }

        super(CountCalculation, self).__init__(aggregations=aggregations)
