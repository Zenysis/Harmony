// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import { arrayEquality } from 'util/arrayUtil';
import type Dashboard from 'models/core/Dashboard';

export default function updateDashboardOnItemsChange(
  items: $ReadOnlyArray<DashboardItemHolder>,
  dashboard: Dashboard,
): Dashboard {
  // Avoid creating a new dashboard if the items have not changed.
  const currentItems = dashboard.specification().items();
  if (arrayEquality(currentItems, items)) {
    return dashboard;
  }

  return dashboard
    .deepUpdate()
    .specification()
    .items(items);
}
