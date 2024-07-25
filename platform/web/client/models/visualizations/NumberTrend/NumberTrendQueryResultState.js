// @flow
import * as Zen from 'lib/Zen';
import NumberTrendQueryEngine from 'models/visualizations/NumberTrend/NumberTrendQueryEngine';
import NumberTrendQueryResultData from 'models/visualizations/NumberTrend/NumberTrendQueryResultData';
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
    newResultSpec.nullValueDisplayHasChanged(prevResultSpec, 'NUMBER_TREND') ||
    Zen.hasChanged<QueryResultSpec>('customFields', 'dataFilters')(
      newResultSpec,
      prevResultSpec,
    )
  );
}

const NumberTrendQueryResultState: QueryResultState<NumberTrendQueryResultData> = QueryResultState.createInitialState(
  NumberTrendQueryEngine,
  NumberTrendQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default NumberTrendQueryResultState;
