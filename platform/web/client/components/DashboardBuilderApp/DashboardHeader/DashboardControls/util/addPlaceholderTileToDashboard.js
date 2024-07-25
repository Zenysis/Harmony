// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import DashboardPlaceholderItem from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';
import buildPositionForNewTile from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/buildPositionForNewTile';
import type Dashboard from 'models/core/Dashboard';
import type { PlaceholderItemType } from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';

/**
 * Add a placeholder tile as the last item on the dashboard.
 */
export default function addPlaceholderTileToDashboard(
  dashboard: Dashboard,
  placeholderItemType: PlaceholderItemType,
): Dashboard {
  const currentItems = dashboard.specification().items();

  const placeholderItem = DashboardPlaceholderItem.create({
    itemType: placeholderItemType,
  });

  const itemHolder = DashboardItemHolder.createWithUniqueId(
    placeholderItem,
    buildPositionForNewTile(
      currentItems,
      placeholderItemType,
      dashboard.specification().legacy(),
    ),
  );

  const newItems = [...currentItems, itemHolder];

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
