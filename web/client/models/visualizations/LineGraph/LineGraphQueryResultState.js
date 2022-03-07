// @flow
import LineGraphQueryEngine from 'models/visualizations/LineGraph/LineGraphQueryEngine';
import LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { getControls } from 'models/visualizations/LineGraph/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function _controlsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newControls = getControls(newResultSpec);
  const prevControls = getControls(prevResultSpec);
  if (newControls === prevControls) {
    return false;
  }

  return (
    newControls.resultLimit() !== prevControls.resultLimit() ||
    newControls.sortOn() !== prevControls.sortOn() ||
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
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'TIME') ||
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

const LineGraphQueryResultState: QueryResultState<LineGraphQueryResultData> = QueryResultState.createInitialState(
  LineGraphQueryEngine,
  LineGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default LineGraphQueryResultState;
