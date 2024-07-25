// @flow
import * as Zen from 'lib/Zen';
import BarGraphQueryEngine from 'models/visualizations/BarGraph/BarGraphQueryEngine';
import BarGraphQueryResultData from 'models/visualizations/BarGraph/BarGraphQueryResultData';
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
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'BAR_GRAPH') ||
    Zen.hasChanged<QueryResultSpec>('customFields', 'dataFilters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

const BarGraphQueryResultState: QueryResultState<BarGraphQueryResultData> = QueryResultState.createInitialState(
  BarGraphQueryEngine,
  BarGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BarGraphQueryResultState;
