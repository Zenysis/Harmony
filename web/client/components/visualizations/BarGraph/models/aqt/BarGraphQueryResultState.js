// @flow
import BarGraphQueryEngine from 'components/visualizations/BarGraph/models/aqt/BarGraphQueryEngine';
import BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { shouldRebuildQueryResult } from 'components/visualizations/BarGraph/models/BarGraphQueryResultState';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function shouldRunNewQuery(
  newSelections: QuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: QuerySelections,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevSelections || !prevResultSpec) {
    return true;
  }

  // If selections have changed, we must issue a new query.
  if (newSelections !== prevSelections) {
    return true;
  }

  return false;
}

const BarGraphQueryResultState: QueryResultState<
  QuerySelections,
  Class<BarGraphQueryResultData>,
> = QueryResultState.createInitialState(
  BarGraphQueryEngine,
  BarGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BarGraphQueryResultState;
