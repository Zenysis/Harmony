// @flow
import BumpChartQueryEngine from 'models/visualizations/BumpChart/BumpChartQueryEngine';
import BumpChartQueryResultData from 'models/visualizations/BumpChart/BumpChartQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function _controlsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newControls = newResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.BUMP_CHART,
  );
  const prevControls = prevResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.BUMP_CHART,
  );
  if (newControls === prevControls) {
    return false;
  }

  return (
    newControls.resultLimit() !== prevControls.resultLimit() ||
    newControls.selectedField() !== prevControls.selectedField() ||
    newControls.sortOrder() !== prevControls.sortOrder()
  );
}

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'BUMP_CHART') ||
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.dataFilters() !== prevResultSpec.dataFilters() ||
    _controlsChanged(newResultSpec, prevResultSpec)
  );
}

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

const BumpChartQueryResultState: QueryResultState<BumpChartQueryResultData> = QueryResultState.createInitialState(
  BumpChartQueryEngine,
  BumpChartQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BumpChartQueryResultState;
