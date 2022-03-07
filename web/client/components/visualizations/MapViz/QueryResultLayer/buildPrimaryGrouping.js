// @flow
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';

export default function buildPrimaryGrouping(
  groupBySettings: GroupBySettings,
): QueryResultGrouping | void {
  const dimensionGroupings = groupBySettings
    .groupings()
    .zenValues()
    .filter(g => g.type() === 'STRING');

  if (dimensionGroupings.isEmpty()) {
    return undefined;
  }

  // NOTE(stephen): When multiple groupings are supported for MapViz (like
  // with a drill-downable style chart that changes from zoom level),
  // figure out how to support them.
  // For now, we will just get the last geo dimension we find (which, in the
  // case where there are multiple geo dimensions like in SQT, this will be
  // the most granular geo dimension).
  return dimensionGroupings
    .reverse()
    .find(group => group.isGeographyGrouping());
}
