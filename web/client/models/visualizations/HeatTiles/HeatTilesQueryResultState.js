// @flow
import HeatTilesQueryEngine from 'models/visualizations/HeatTiles/HeatTilesQueryEngine';
import HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import { objKeyEq } from 'util/objUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function _controlsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newControls = newResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.HEATTILES,
  );
  const prevControls = prevResultSpec.getVisualizationControls(
    RESULT_VIEW_TYPES.HEATTILES,
  );
  if (newControls === prevControls) {
    return false;
  }

  return !objKeyEq(newControls, prevControls, ['selectedField', 'sortOrder']);
}

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'HEATTILES') ||
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

const HeatTilesQueryResultState: QueryResultState<HeatTilesQueryResultData> = QueryResultState.createInitialState(
  HeatTilesQueryEngine,
  HeatTilesQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default HeatTilesQueryResultState;
