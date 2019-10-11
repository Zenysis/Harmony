// @flow
import BubbleChartQueryEngine from 'components/visualizations/BubbleChart/models/aqt/BubbleChartQueryEngine';
import BubbleChartQueryResultData from 'components/visualizations/BubbleChart/models/BubbleChartQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { hasChanged } from 'util/ZenModel/ZenModelUtil';
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

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return hasChanged<QueryResultSpec>('customFields', 'filters')(
    newResultSpec,
    prevResultSpec,
  );
}

const BubbleChartQueryResultState: QueryResultState<
  QuerySelections,
  Class<BubbleChartQueryResultData>,
> = QueryResultState.createInitialState(
  BubbleChartQueryEngine,
  BubbleChartQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BubbleChartQueryResultState;
