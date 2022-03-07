// @flow
import * as React from 'react';

import ShareQueryModal from 'components/common/SharingUtil/ShareQueryModal';
import useAugmentedQuery from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useAugmentedQuery';
import { VISUALIZATION_TO_VIEW_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dashboardFilterItems: $ReadOnlyArray<QueryFilterItem>,
  dashboardGroupingItems: $ReadOnlyArray<GroupingItem>,
  item: DashboardQueryItem,
  onCloseModal: () => void,
  show: boolean,
};

/**
 * The ShareQueryTileModal opens the sharing interface for a query tile so the
 * user can download the results and generate a link to the query. The
 * dashboard-level filter and grouping items *will be applied* to the query that
 * is shared or downloaded.
 */
export default function ShareQueryTileModal({
  dashboardFilterItems,
  dashboardGroupingItems,
  item,
  onCloseModal,
  show,
}: Props): React.Element<typeof ShareQueryModal> {
  // NOTE(stephen): When the user shares a query on the dashboard, they
  // generally want to share the query they are *currently viewing*, which means
  // we need to include the dashboard level filters and groupings that are
  // applied to this tile.
  const [querySelections, queryResultSpec] = useAugmentedQuery(
    item,
    dashboardFilterItems,
    dashboardGroupingItems,
  );
  const visualizationType = item.visualizationType();
  return (
    <ShareQueryModal
      onRequestClose={onCloseModal}
      queryResultSpec={queryResultSpec}
      querySelections={querySelections}
      show={show}
      viewType={VISUALIZATION_TO_VIEW_TYPE[visualizationType]}
      visualizationType={visualizationType}
    />
  );
}
