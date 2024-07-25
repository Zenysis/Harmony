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

  // NOTE: Remove the item from the lists of tiles excluded from filtering and grouping
  // as well.
  const commonSettings = dashboard.specification().commonSettings();
  const { filterSettings, groupingSettings } = commonSettings.modelValues();
  const newCommonSettings = commonSettings.modelValues({
    filterSettings: {
      ...filterSettings,
      excludedTiles: filterSettings.excludedTiles.filter(
        itemId => itemId !== itemHolder.id(),
      ),
    },
    groupingSettings: {
      ...groupingSettings,
      excludedTiles: groupingSettings.excludedTiles.filter(
        itemId => itemId !== itemHolder.id(),
      ),
    },
  });

  return dashboard
    .deepUpdate()
    .specification()
    .modelValues({
      commonSettings: newCommonSettings,
      items: newItems,
    });
}
