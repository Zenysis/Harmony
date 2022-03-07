import related

from data.query.models.calculation.calculation import Calculation


@related.immutable
class SyntheticCalculation(Calculation):
    '''A SyntheticCalculation computes its final value post-query. It can add
    calculations to the Druid query like other Calculation types, but the result value
    it produces must be computed post-query using the query result dataframe.

    NOTE(stephen): A known limitation of SyntheticCalculations right now is that it
    can only produce a single series at the end. An advantage of this is that it makes
    the value calculation simpler to reason about: an input dataframe comes in, an
    output dataframe is returned. However, there might be some calculations that need to
    produce multiple values (like forecast and forecast error). These should probably be
    separate Fields, however you wouldn't want to calculate forecast values twice to
    get the result.
    '''

    def calculate_result(
        self, df, grouping_dimension_ids, query_result_id
    ):  # pylint: disable=no-self-use,unused-argument
        '''Given an input dataframe, compute the full value that this
        SyntheticCalculation represents. The output of this function should be a
        Series that can be cleanly merged into the input dataframe by the caller
        (i.e. with df[field_id] = calculation.calculate_result(df, result_id)).

        Args:
            df: The full query result dataframe.
            query_result_id: The result ID passed to `to_druid` which the Druid results
                were stored in during querying.
        '''
        raise ValueError('calculate_result must be implemented by subclass.')
