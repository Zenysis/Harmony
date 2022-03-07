// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import buildModifiedQuerySelections from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useAugmentedQuery/buildModifiedQuerySelections';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * Build updated QuerySelections and QueryResultSpec that include the dashboard
 * level filters and groupings that the user has applied. These will override
 * the filters and groupings applied by the user when they first added the Query
 * item to the dashboard.
 */
export default function useAugmentedQuery(
  item: DashboardQueryItem,
  dashboardFilterItems: $ReadOnlyArray<QueryFilterItem>,
  dashboardGroupingItems: $ReadOnlyArray<GroupingItem>,
): [QuerySelections, QueryResultSpec] {
  const querySelections = item.querySelections();

  // NOTE(stephen): Since we are sharing code between the new DashboardApp
  // rebuild and the legacy GridDashboardApp, it is easier to use the ZenArray
  // representation of these items for now since it is more work to change the
  // GridDashboardApp code to not require it.
  const dashboardFilterItemsZenArray = React.useMemo(
    () => Zen.Array.create(dashboardFilterItems),
    [dashboardFilterItems],
  );
  const dashboardGroupingItemsZenArray = React.useMemo(
    () => Zen.Array.create(dashboardGroupingItems),
    [dashboardGroupingItems],
  );

  const augmentedQuerySelections = React.useMemo(
    () =>
      buildModifiedQuerySelections(
        querySelections,
        dashboardFilterItemsZenArray,
        dashboardGroupingItemsZenArray,
      ),
    [
      dashboardFilterItemsZenArray,
      dashboardGroupingItemsZenArray,
      querySelections,
    ],
  );

  // Make sure the GroupBySettings structure on the QueryResultSpec contains the
  // groupings applied at the dashboard level.
  const queryResultSpec = item.queryResultSpec();

  const augmentedQueryResultSpec = React.useMemo(() => {
    return queryResultSpec.updateGroupBySettingsFromGroupingItems(
      querySelections.groups(),
      augmentedQuerySelections.groups(),
    );
  }, [augmentedQuerySelections, queryResultSpec, querySelections]);

  return [augmentedQuerySelections, augmentedQueryResultSpec];
}
