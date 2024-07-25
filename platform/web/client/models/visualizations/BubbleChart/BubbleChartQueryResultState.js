// @flow
import * as Zen from 'lib/Zen';
import BubbleChartQueryEngine from 'models/visualizations/BubbleChart/BubbleChartQueryEngine';
import BubbleChartQueryResultData from 'models/visualizations/BubbleChart/BubbleChartQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
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
  return !newSelections.isQueryEqual(prevSelections);
}

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'BUBBLE_CHART') ||
    Zen.hasChanged<QueryResultSpec>('customFields', 'dataFilters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

const BubbleChartQueryResultState: QueryResultState<BubbleChartQueryResultData> = QueryResultState.createInitialState(
  BubbleChartQueryEngine,
  BubbleChartQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BubbleChartQueryResultState;
