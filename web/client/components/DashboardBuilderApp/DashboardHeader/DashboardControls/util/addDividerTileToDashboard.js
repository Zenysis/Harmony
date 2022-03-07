// @flow
import DashboardDividerItem from 'models/DashboardBuilderApp/DashboardItem/DashboardDividerItem';
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import buildPositionForNewTile from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/buildPositionForNewTile';
import type Dashboard from 'models/core/Dashboard';

/**
 * Add a divider tile as the last item on the dashboard.
 */
export default function addDividerTileToDashboard(
  dashboard: Dashboard,
): Dashboard {
  const currentItems = dashboard.specification().items();

  const dividerItem = DashboardDividerItem.create({});

  const itemHolder = DashboardItemHolder.createWithUniqueId(
    dividerItem,
    buildPositionForNewTile(
      currentItems,
      'divider',
      dashboard.specification().legacy(),
    ),
  );

  const newItems = [...currentItems, itemHolder];

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
