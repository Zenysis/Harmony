// @flow
import * as Zen from 'lib/Zen';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

/**
 * Set the `includeTotal` setting on every grouping item in a query to be
 * `false`. Certain visualizations cannot effectively show total values, and
 * others would have their results distorted (like BoxPlot and BumpChart) if a
 * total value were to be included.
 */
export default function unsetGroupTotalSetting(
  groups: Zen.Array<GroupingItem>,
): Zen.Array<GroupingItem> {
  return groups.map(group => group.set('includeTotal', false));
}
