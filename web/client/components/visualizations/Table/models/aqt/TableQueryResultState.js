// @flow
import QueryResultState from 'models/core/QueryResultState';
import TableQueryEngine from 'components/visualizations/Table/models/aqt/TableQueryEngine';
import TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
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
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.filters() !== prevResultSpec.filters()
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
  if (newSelections !== prevSelections) {
    return true;
  }

  return false;
}

const TableQueryResultState: QueryResultState<
  QuerySelections,
  Class<TableQueryResultData>,
> = QueryResultState.createInitialState(
  TableQueryEngine,
  TableQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default TableQueryResultState;
