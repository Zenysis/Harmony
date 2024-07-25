// @flow
import * as Zen from 'lib/Zen';
import ExpandoTreeQueryEngine from 'models/visualizations/ExpandoTree/ExpandoTreeQueryEngine';
import ExpandoTreeQueryResultData from 'models/visualizations/ExpandoTree/ExpandoTreeQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
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
  return !newSelections.isQueryEqual(prevSelections);
}

function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'EXPANDOTREE') ||
    Zen.hasChanged<QueryResultSpec>('customFields', 'dataFilters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

const ExpandoTreeQueryResultState: QueryResultState<ExpandoTreeQueryResultData> = QueryResultState.createInitialState(
  ExpandoTreeQueryEngine,
  ExpandoTreeQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default ExpandoTreeQueryResultState;
