// @flow
import type Dashboard from 'models/core/Dashboard';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

export default function updateDashboardOnItemDelete(
  itemHolder: DashboardItemHolder,
  dashboard: Dashboard,
): Dashboard {
  const newItems = dashboard
    .specification()
    .items()
    .filter(item => item !== itemHolder);

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
