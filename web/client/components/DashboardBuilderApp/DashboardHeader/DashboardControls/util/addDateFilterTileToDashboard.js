// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';
import buildPositionForNewTile from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/buildPositionForNewTile';
import type Dashboard from 'models/core/Dashboard';

/**
 * Add a date filter tile (a text tile) as the last item on the dashboard.
 */
export default function addDateFilterTileToDashboard(
  dashboard: Dashboard,
): Dashboard {
  const currentItems = dashboard.specification().items();

  const dateFilterItem = DashboardTextItem.create({
    text: '<p>{Date}</p>',
  });

  const itemHolder = DashboardItemHolder.createWithUniqueId(
    dateFilterItem,
    buildPositionForNewTile(
      currentItems,
      'text_item',
      dashboard.specification().legacy(),
    ),
  );

  const newItems = [...currentItems, itemHolder];

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
