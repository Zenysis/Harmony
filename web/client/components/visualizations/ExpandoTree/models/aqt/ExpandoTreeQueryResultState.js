// @flow
import ExpandoTreeQueryEngine from 'components/visualizations/ExpandoTree/models/aqt/ExpandoTreeQueryEngine';
import ExpandoTreeQueryResultData from 'components/visualizations/ExpandoTree/models/ExpandoTreeQueryResultData';
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

const ExpandoTreeQueryResultState: QueryResultState<
  QuerySelections,
  Class<ExpandoTreeQueryResultData>,
> = QueryResultState.createInitialState(
  ExpandoTreeQueryEngine,
  ExpandoTreeQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default ExpandoTreeQueryResultState;
