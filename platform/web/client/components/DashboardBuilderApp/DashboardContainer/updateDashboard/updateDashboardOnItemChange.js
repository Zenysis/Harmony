// @flow
import DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type Dashboard from 'models/core/Dashboard';

export default function updateDashboardOnItemChange(
  itemHolder: DashboardItemHolder,
  dashboard: Dashboard,
): Dashboard {
  // First we extract the index of the item being updated
  const id = itemHolder.id();
  const currentItems = dashboard.specification().items();
  const itemIndex = currentItems.findIndex(item => item.id() === id);

  // We then clone the items array and update the relevant item
  const newItems = currentItems.slice(0);
  newItems[itemIndex] = itemHolder;

  return dashboard
    .deepUpdate()
    .specification()
    .items(newItems);
}
