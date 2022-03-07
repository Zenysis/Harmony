from enum import Enum

import related

from data.query.models.calculation.calculation import Calculation
from data.query.models.calculation.sum_calculation import SumCalculation
from data.query.models.calculation.synthetic_calculation.synthetic_calculation import (
    SyntheticCalculation,
)

DEFAULT_WINDOW_SIZE = 7


class WindowOperation(Enum):
    AVERAGE = 'average'
    MAX = 'max'
    MIN = 'min'
    SUM = 'sum'


@related.immutable
class WindowCalculation(SyntheticCalculation):
    '''A WindowCalculation computes its final value by evaluating an arithmetic
    expression over a rolling window of data points. If you select the `sum` operation
    and set the `size` to 7, then you will calculate the rolling sum over the 7 data
    points in each unique group.

    The WindowCalculation requires a time grouping to work correctly. It does not ensure
    that the time values passed in are gap-free (i.e. if you grouped by Month this
    calculation will build the window over all months returned).
    '''

    operation = related.ChildField(WindowOperation, WindowOperation.SUM)
    size = related.IntegerField(DEFAULT_WINDOW_SIZE)
    type = related.StringField('WINDOW')

    def to_druid(self, result_id):
        # The raw values that the window calculation will operate on post-query.
        return SumCalculation(filter=self.filter).to_druid(result_id)

    def calculate_result(self, df, grouping_dimension_ids, query_result_id):
        # TODO(stephen): Move the TIMESTAMP_COLUMN global variable to a better place
        # that won't cause circular imports.
        if 'timestamp' not in df or self.size <= 0:
            return df[query_result_id]

        # Sort the dataframe by the grouping dimensions + timestamp so that we know
        # the values will always be sorted by timestamp later.
        df = df.sort_values(grouping_dimension_ids + ['timestamp'])

        # Group the dataframe by the grouping dimensions so that we can perform the
        # window operation for each group.
        group_df = df.groupby(grouping_dimension_ids) if grouping_dimension_ids else df

        # Build a rolling series that we can operate on top of.
        series = group_df[query_result_id].rolling(self.size)
        if self.operation == WindowOperation.AVERAGE:
            series = series.mean()
        elif self.operation == WindowOperation.MAX:
            series = series.max()
        elif self.operation == WindowOperation.MIN:
            series = series.min()
        else:
            # Default is to compute a rolling SUM. Prefer default vs explicit check so
            # we don't have to throw an error.
            series = series.sum()

        # Sort the series by the original dataframe's index. Values must be returned in
        # the correct order since they will be merged into the original dataframe by
        # the caller.
        if grouping_dimension_ids:
            series = series.sort_index(level=len(grouping_dimension_ids)).reset_index(
                drop=True
            )
        return series


Calculation.register_subtype(WindowCalculation)
