// @flow
import BubbleChartQueryEngine from 'components/visualizations/BubbleChart/models/sqt/BubbleChartQueryEngine';
import BubbleChartQueryResultData from 'components/visualizations/BubbleChart/models/BubbleChartQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.filters() !== prevResultSpec.filters()
  );
}

function shouldRunNewQuery(
  newSelections: SimpleQuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: SimpleQuerySelections,
  prevResultSpec?: QueryResultSpec, // eslint-disable-line no-unused-vars
): boolean {
  // If selections have changed, we must issue a new query. Currently, no
  // post-query settings can cause the query to change.
  return newSelections !== prevSelections;
}

const BubbleChartQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<BubbleChartQueryResultData>,
> = QueryResultState.createInitialState(
  BubbleChartQueryEngine,
  BubbleChartQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BubbleChartQueryResultState;
