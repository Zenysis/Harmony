// @flow
import LineGraphQueryEngine from 'components/visualizations/LineGraph/models/LineGraphQueryEngine';
import LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import {
  getControls,
  hasBucketTypeChanged,
} from 'components/visualizations/LineGraph/models/util';
import { objKeyEq } from 'util/objUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

function controlsChanged(
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec,
): boolean {
  const newControls = getControls(newResultSpec);
  const prevControls = getControls(prevResultSpec);
  if (newControls === prevControls) {
    return false;
  }

  return !objKeyEq(newControls, prevControls, [
    'resultLimit',
    'selectedField',
    'sortOrder',
  ]);
}

export function shouldRebuildQueryResult(
  newResultSpec: QueryResultSpec,
  prevResultSpec?: QueryResultSpec,
): boolean {
  if (!prevResultSpec) {
    return true;
  }

  return (
    newResultSpec.customFields() !== prevResultSpec.customFields() ||
    newResultSpec.filters() !== prevResultSpec.filters() ||
    controlsChanged(newResultSpec, prevResultSpec)
  );
}

function shouldRunNewQuery(
  newSelections: SimpleQuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: SimpleQuerySelections,
  prevResultSpec?: QueryResultSpec,
): boolean {
  const isBucketTypeChanged = hasBucketTypeChanged(
    newResultSpec,
    prevResultSpec,
  );
  return newSelections !== prevSelections || isBucketTypeChanged;
}

const LineGraphQueryResultState: QueryResultState<
  SimpleQuerySelections,
  Class<LineGraphQueryResultData>,
> = QueryResultState.createInitialState(
  LineGraphQueryEngine,
  LineGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default LineGraphQueryResultState;
