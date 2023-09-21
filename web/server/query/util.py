from pydruid.utils.aggregators import count

from db.druid.calculations.base_calculation import BaseCalculation

COUNT_AGGREGATION_NAME = 'count'
COUNT_CALCULATION = BaseCalculation(
    aggregations={COUNT_AGGREGATION_NAME: count('count')}
)
