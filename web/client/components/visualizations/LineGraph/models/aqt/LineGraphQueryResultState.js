// @flow
import LineGraphQueryEngine from 'components/visualizations/LineGraph/models/aqt/LineGraphQueryEngine';
import LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import QueryResultState from 'models/core/QueryResultState';
import { hasBucketTypeChanged } from 'components/visualizations/LineGraph/models/util';
import { shouldRebuildQueryResult } from 'components/visualizations/LineGraph/models/LineGraphQueryResultState';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

function shouldRunNewQuery(
  newSelections: QuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections?: QuerySelections,
  prevResultSpec?: QueryResultSpec, // eslint-disable-line no-unused-vars
): boolean {
  const isBucketTypeChanged = hasBucketTypeChanged(
    newResultSpec,
    prevResultSpec,
  );

  return newSelections !== prevSelections || isBucketTypeChanged;
}

const LineGraphQueryResultState: QueryResultState<
  QuerySelections,
  Class<LineGraphQueryResultData>,
> = QueryResultState.createInitialState(
  LineGraphQueryEngine,
  LineGraphQueryResultData,
  shouldRebuildQueryResult,
  shouldRunNewQuery,
);

export default LineGraphQueryResultState;
