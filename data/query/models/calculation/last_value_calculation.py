from enum import Enum

import related

from data.query.models.calculation.calculation import Calculation
from data.query.models.calculation.average_calculation import AverageCalculation
from data.query.models.calculation.count_calculation import CountCalculation
from data.query.models.calculation.max_calculation import MaxCalculation
from data.query.models.calculation.min_calculation import MinCalculation
from data.query.models.calculation.sum_calculation import SumCalculation
from data.query.models.query_filter import FieldFilter


class AggregationOperation(Enum):
    AVERAGE = 'average'
    COUNT = 'count'
    MAX = 'max'
    MIN = 'min'
    SUM = 'sum'


# Mapping from AggregationOperation type to a Calculation that will produce that value.
OPERATION_TO_CALCULATION = {
    AggregationOperation.AVERAGE: AverageCalculation,
    AggregationOperation.COUNT: CountCalculation,
    AggregationOperation.MAX: MaxCalculation,
    AggregationOperation.MIN: MinCalculation,
    AggregationOperation.SUM: SumCalculation,
}


def build_null_calculation(result_id: str):
    '''Build a calculation that will always return a `null` value as the result.'''
    return SumCalculation(filter=FieldFilter('NON_EXISTANT_FIELD')).to_druid(result_id)


@related.immutable
class LastValueCalculation(Calculation):
    '''Aggregate rows with the largest timestamp in the query using the given
    aggregation operation.
    '''

    operation = related.ChildField(AggregationOperation, AggregationOperation.SUM)
    type = related.StringField('LAST_VALUE')

    def to_druid(self, result_id: str):
        # Build the original calculation that matches the operation supplied.
        # pylint: disable=invalid-name
        OperationCalculation = OPERATION_TO_CALCULATION[self.operation]
        # TODO(david): fix type error
        output = OperationCalculation(filter=self.filter).to_druid(  # type: ignore
            result_id
        )

        # Replace all aggregators in this original calculation with a variant that will
        # computes the last value.
        for aggregation in output.aggregations.values():
            # NOTE(stephen): This should never happen, but just to be safe, if we
            # encounter an aggregation that is *not* a filtered aggregator, produce a
            # null result.
            if aggregation.get('type') != 'filtered':
                return build_null_calculation(result_id)

            # Wrap the inner aggregator with an `aggregateLast` aggregator that will
            # only run the inner aggregator on rows with the maximum timestamp.
            inner_agg = {**aggregation['aggregator'], 'name': result_id}
            aggregation['aggregator'] = {
                'aggregator': inner_agg,
                'type': 'aggregateLast',
            }

        return output


Calculation.register_subtype(LastValueCalculation)
