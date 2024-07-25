// @flow
import * as Zen from 'lib/Zen';
import BoxPlotQueryEngine from 'models/visualizations/BoxPlot/BoxPlotQueryEngine';
import BoxPlotQueryResultData from 'models/visualizations/BoxPlot/BoxPlotQueryResultData';
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
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'BOX_PLOT') ||
    Zen.hasChanged<QueryResultSpec>('customFields', 'dataFilters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

const BoxPlotQueryResultState: QueryResultState<BoxPlotQueryResultData> = QueryResultState.createInitialState(
  BoxPlotQueryEngine,
  BoxPlotQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BoxPlotQueryResultState;
