// @flow
import HeatTilesQueryEngine from 'models/visualizations/HeatTiles/aqt/HeatTilesQueryEngine';
import HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { shouldRebuildQueryResult } from 'models/visualizations/HeatTiles/HeatTilesQueryResultState';
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
  if (newSelections !== prevSelections) {
    return true;
  }

  return false;
}

const HeatTilesQueryResultState: QueryResultState<
  QuerySelections,
  Class<HeatTilesQueryResultData>,
> = QueryResultState.createInitialState(
  HeatTilesQueryEngine,
  HeatTilesQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default HeatTilesQueryResultState;
