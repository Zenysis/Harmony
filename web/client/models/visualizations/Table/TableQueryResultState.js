// @flow
import QueryResultState from 'models/core/QueryResultState';
import TableQueryEngine from 'models/visualizations/Table/TableQueryEngine';
import TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'TABLE') ||
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.dataFilters() !== prevResultSpec.dataFilters()
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

const TableQueryResultState: QueryResultState<TableQueryResultData> = QueryResultState.createInitialState(
  TableQueryEngine,
  TableQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default TableQueryResultState;
