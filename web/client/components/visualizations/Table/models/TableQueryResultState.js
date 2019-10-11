// @flow
import QueryResultState from 'models/core/QueryResultState';
import TableQueryEngine, {
  extractConstituentSettings,
} from 'components/visualizations/Table/models/TableQueryEngine';
import TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

function _fieldsToQueryHasChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newSeriesObjects = newResultSpec
    .getSeriesSettings(RESULT_VIEW_TYPES.TABLE)
    .seriesObjects();
  const prevSeriesObjects = prevResultSpec
    .getSeriesSettings(RESULT_VIEW_TYPES.TABLE)
    .seriesObjects();

  if (newSeriesObjects === prevSeriesObjects) {
    return false;
  }

  const newConstituentsShown = extractConstituentSettings(newSeriesObjects);
  const prevConstituentsShown = extractConstituentSettings(prevSeriesObjects);
  if (newConstituentsShown.size !== prevConstituentsShown.size) {
    return true;
  }

  const union = new Set(newConstituentsShown);
  prevConstituentsShown.forEach(v => union.add(v));
  return union.size !== newConstituentsShown.size;
}

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.filters() !== prevResultSpec.filters()
  );
}

function shouldRunNewQuery(
  newSelections: SimpleQuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: SimpleQuerySelections,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevSelections || !prevResultSpec) {
    return true;
  }

  // If selections have changed, we must issue a new query.
  if (newSelections !== prevSelections) {
    return true;
  }

  return _fieldsToQueryHasChanged(newResultSpec, prevResultSpec);
}

const TableQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<TableQueryResultData>,
> = QueryResultState.createInitialState(
  TableQueryEngine,
  TableQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default TableQueryResultState;
