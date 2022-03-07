// @flow
import * as Zen from 'lib/Zen';
import HistogramQueryEngine from 'models/visualizations/Histogram/HistogramQueryEngine';
import HistogramQueryResultData from 'models/visualizations/Histogram/HistogramQueryResultData';
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
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'EPICURVE') ||
    Zen.hasChanged<QueryResultSpec>('customFields', 'dataFilters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

const HistogramQueryResultState: QueryResultState<HistogramQueryResultData> = QueryResultState.createInitialState(
  HistogramQueryEngine,
  HistogramQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default HistogramQueryResultState;
