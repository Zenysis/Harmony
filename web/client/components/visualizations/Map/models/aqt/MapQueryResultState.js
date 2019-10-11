// @flow
import MapQueryEngine from 'components/visualizations/Map/models/aqt/MapQueryEngine';
import MapQueryResultData from 'components/visualizations/Map/models/MapQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { shouldRebuildQueryResult } from 'components/visualizations/Map/models/MapQueryResultState';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function shouldRunNewQuery(
  newSelections: QuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: QuerySelections,
  prevResultSpec?: QueryResultSpec, // eslint-disable-line no-unused-vars
): boolean {
  return newSelections !== prevSelections;
}

const MapQueryResultState: QueryResultState<
  QuerySelections,
  Class<MapQueryResultData>,
> = QueryResultState.createInitialState(
  MapQueryEngine,
  MapQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default MapQueryResultState;
