// @flow
import BumpChartQueryEngine from 'components/visualizations/BumpChart/models/aqt/BumpChartQueryEngine';
import BumpChartQueryResultData from 'components/visualizations/BumpChart/models/BumpChartQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { shouldRebuildQueryResult } from 'components/visualizations/BumpChart/models/BumpChartQueryResultState';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function shouldRunNewQuery(
  newSelections: QuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: QuerySelections,
  prevResultSpec?: QueryResultSpec, // eslint-disable-line no-unused-vars
): boolean {
  // If selections have changed, we must issue a new query. Currently, no
  // post-query settings can cause the query to change.
  return newSelections !== prevSelections;
}

const BumpChartQueryResultState: QueryResultState<
  QuerySelections,
  Class<BumpChartQueryResultData>,
> = QueryResultState.createInitialState(
  BumpChartQueryEngine,
  BumpChartQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BumpChartQueryResultState;
