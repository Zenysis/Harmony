// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import DashboardSpacerItem from 'models/DashboardBuilderApp/DashboardItem/DashboardSpacerItem';
import buildPositionForNewTile from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/util/buildPositionForNewTile';
import type Dashboard from 'models/core/Dashboard';

/**
 * Add a spacer tile as the last item on the dashboard.
 */
export default function addSpacerTileToDashboard(
  dashboard: Dashboard,
): Dashboard {
  const currentItems = dashboard.specification().items();

  const spacerItem = DashboardSpacerItem.create({});

  const itemHolder = DashboardItemHolder.createWithUniqueId(
    spacerItem,
    buildPositionForNewTile(
      currentItems,
      'spacer',
      dashboard.specification().legacy(),
    ),
  );

  const newItems = [...currentItems, itemHolder];

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
