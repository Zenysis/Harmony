// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardGroupBySelector from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonGroupingSettings/DashboardGroupBySelector';
import useGroupingHierarchy from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock/useGroupingHierarchy';
import useSupportedItems from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/hooks/useSupportedItems';
import type { CommonQueryTileSettings } from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

type Props = {
  collapse: boolean,
  dashboardQueryItemTitles: $PropertyType<
    React.ElementConfig<typeof DashboardGroupBySelector>,
    'dashboardQueryItemTitles',
  >,
  horizontal: boolean,
  onSettingsChange: (CommonQueryTileSettings<GroupingItem>) => void,
  presenting: boolean,
  settings: CommonQueryTileSettings<GroupingItem>,
};

/**
 * The CommonGroupingSettings control the list of groupings that will apply to
 * multiple query tiles on the dashboard.
 */
function CommonGroupingSettings({
  collapse,
  dashboardQueryItemTitles,
  horizontal,
  onSettingsChange,
  presenting,
  settings,
}: Props) {
  const { enabledCategories, excludedTiles, items } = settings;
  const [dimensions, granularities] = useSupportedItems(enabledCategories);
  const hierarchyRoot = useGroupingHierarchy();

  const onExcludedTilesChange = React.useCallback(
    newExcludedTiles =>
      onSettingsChange({
        ...settings,
        excludedTiles: newExcludedTiles.arrayView(),
      }),
    [onSettingsChange, settings],
  );
  const onGroupingItemsChange = React.useCallback(
    newExcludedItems =>
      onSettingsChange({
        ...settings,
        items: newExcludedItems.arrayView(),
      }),
    [onSettingsChange, settings],
  );

  // NOTE(stephen): The existing DashboardGroupBySelector expects values to come
  // in as a ZenArray, while our modern approach uses $ReadOnlyArray.
  const legacyExcludedTiles = React.useMemo(
    () => Zen.Array.create(excludedTiles),
    [excludedTiles],
  );
  const legacyItems = React.useMemo(() => Zen.Array.create(items), [items]);
  return (
    <DashboardGroupBySelector
      collapsedLayout={collapse}
      dashboardQueryItemTitles={dashboardQueryItemTitles}
      hierarchyRoot={hierarchyRoot}
      horizontal={horizontal}
      initialExcludedItems={legacyExcludedTiles}
      onExcludedItemsUpdate={onExcludedTilesChange}
      onSelectedItemsChanged={onGroupingItemsChange}
      selectedItems={legacyItems}
      showExclusionsAsTooltip={presenting}
      supportedDimensions={dimensions}
      supportedGranularities={granularities}
    />
  );
}

export default (React.memo(
  CommonGroupingSettings,
): React.AbstractComponent<Props>);
