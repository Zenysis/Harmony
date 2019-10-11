// @flow
import BarGraphQueryEngine from 'components/visualizations/BarGraphTNG/models/aqt/BarGraphQueryEngine';
import BarGraphQueryResultData from 'components/visualizations/BarGraphTNG/models/BarGraphQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { hasChanged } from 'util/ZenModel/ZenModelUtil';
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

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return hasChanged<QueryResultSpec>('customFields', 'filters')(
    newResultSpec,
    prevResultSpec,
  );
}

const BarGraphQueryResultState: QueryResultState<
  QuerySelections,
  Class<BarGraphQueryResultData>,
> = QueryResultState.createInitialState(
  BarGraphQueryEngine,
  BarGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default BarGraphQueryResultState;
