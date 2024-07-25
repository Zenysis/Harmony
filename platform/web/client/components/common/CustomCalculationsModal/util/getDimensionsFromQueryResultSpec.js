// @flow
import type QueryResultSpec from 'models/core/QueryResultSpec';

export default function getDimensionsFromQueryResultSpec(
  queryResultSpec: QueryResultSpec,
): $ReadOnlyArray<string> {
  return queryResultSpec
    .groupBySettings()
    .groupings()
    .values()
    .map(group => group.getDimensionId());
}
