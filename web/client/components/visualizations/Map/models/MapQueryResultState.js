// @flow
import MapQueryEngine from 'components/visualizations/Map/models/MapQueryEngine';
import MapQueryResultData from 'components/visualizations/Map/models/MapQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { objKeyEq } from 'util/objUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

function _getControls(resultSpec: QueryResultSpec) {
  return resultSpec.getVisualizationControls(RESULT_VIEW_TYPES.MAP);
}

function controlsChanged(
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
  return newSelections !== prevSelections;
}

const MapQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<MapQueryResultData>,
> = QueryResultState.createInitialState(
  MapQueryEngine,
  MapQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default MapQueryResultState;
