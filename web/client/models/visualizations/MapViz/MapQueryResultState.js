// @flow
import MapQueryEngine from 'models/visualizations/MapViz/MapQueryEngine';
import MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { objKeyEq } from 'util/objUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function _getControls(resultSpec: QueryResultSpec) {
  return resultSpec.getVisualizationControls('MAP');
}

function _controlsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newControls = _getControls(newResultSpec);
  const prevControls = _getControls(prevResultSpec);
  if (newControls === prevControls) {
    return false;
  }

  return !objKeyEq(newControls, prevControls, [
    'resultLimit',
    'selectedField',
    'sortOrder',
  ]);
}

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'MAP') ||
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.dataFilters() !== prevResultSpec.dataFilters() ||
    _controlsChanged(newResultSpec, prevResultSpec)
  );
}

export function shouldRunNewQuery(
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

const MapQueryResultState: QueryResultState<MapQueryResultData> = QueryResultState.createInitialState(
  MapQueryEngine,
  MapQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default MapQueryResultState;
