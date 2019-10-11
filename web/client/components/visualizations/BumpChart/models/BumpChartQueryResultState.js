// @flow
import BumpChartQueryEngine from 'components/visualizations/BumpChart/models/BumpChartQueryEngine';
import BumpChartQueryResultData from 'components/visualizations/BumpChart/models/BumpChartQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

function controlsChanged(
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
    newControls.resultLimit !== prevControls.resultLimit ||
    newControls.selectedField !== prevControls.selectedField ||
    newControls.sortOrder !== prevControls.sortOrder
  );
}

export function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.filters() !== prevResultSpec.filters() ||
    controlsChanged(newResultSpec, prevResultSpec)
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

const BumpChartQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<BumpChartQueryResultData>,
> = QueryResultState.createInitialState(
  BumpChartQueryEngine,
  BumpChartQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BumpChartQueryResultState;
