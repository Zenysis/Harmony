// @flow
import HeatTilesQueryEngine from 'models/visualizations/HeatTiles/HeatTilesQueryEngine';
import HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { objKeyEq } from 'util/objUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

function controlsChanged(
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
): boolean {
  return newSelections !== prevSelections;
}

const HeatTilesQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<HeatTilesQueryResultData>,
> = QueryResultState.createInitialState(
  HeatTilesQueryEngine,
  HeatTilesQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default HeatTilesQueryResultState;
