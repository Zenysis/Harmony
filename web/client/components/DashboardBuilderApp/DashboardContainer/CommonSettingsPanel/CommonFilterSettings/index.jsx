// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardFilterSelector from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonFilterSettings/DashboardFilterSelector';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import useDimensionValueMap from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useDimensionValueMap';
import useFilterHierarchy from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useFilterHierarchy';
import useSupportedItems from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/hooks/useSupportedItems';
import { TIME_INTERVAL_FILTER_ID } from 'components/common/QueryBuilder/FilterSelector/constants';
import { arrayEquality } from 'util/arrayUtil';
import type { CommonQueryTileSettings } from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  collapse: boolean,
  dashboardQueryItemTitles: $PropertyType<
    React.ElementConfig<typeof DashboardFilterSelector>,
    'dashboardQueryItemTitles',
  >,
  horizontal: boolean,
  onSettingsChange: (CommonQueryTileSettings<QueryFilterItem>) => void,
  presenting: boolean,
  settings: CommonQueryTileSettings<QueryFilterItem>,
};

/**
 * The CommonFilterSettings control the list of filters that will apply to
 * multiple query tiles on the dashboard.
 */
function CommonFilterSettings({
  collapse,
  dashboardQueryItemTitles,
  horizontal,
  onSettingsChange,
  presenting,
  settings,
}: Props) {
  const { enabledCategories, excludedTiles, items } = settings;
  const [dimensions] = useSupportedItems(enabledCategories);

  // When the array is empty time filters are enabled by default. When the array
  // is not empty, time filters are only included if the date range filter type
  // is selected.
  // NOTE(stephen, david): The date range category id is included in the
  // enabledCategories preoperty but has to be checked separately because it is
  // not a dimension or granularity category
  const includeTimeFilters = React.useMemo(
    () =>
      enabledCategories.length === 0 ||
      enabledCategories.includes(TIME_INTERVAL_FILTER_ID),
    [enabledCategories],
  );

  const dimensionValueMap = useDimensionValueMap();
  const hierarchyRoot = useFilterHierarchy(!includeTimeFilters);

  const onExcludedTilesChange = React.useCallback(
    newExcludedTiles =>
      onSettingsChange({
        ...settings,
        excludedTiles: newExcludedTiles.arrayView(),
      }),
    [onSettingsChange, settings],
  );

  // NOTE(stephen): The existing DashboardFilterSelector expects values to come
  // in as a ZenArray, while our modern approach uses $ReadOnlyArray.
  const legacyExcludedTiles = React.useMemo(
    () => Zen.Array.create(excludedTiles),
    [excludedTiles],
  );

  const initialSelectedItems = React.useMemo(() => Zen.Array.create(items), [
    items,
  ]);
  const [selectedItems, setSelectedItems] = React.useState(
    initialSelectedItems,
  );

  // If the incoming selected items change, we must reset any changes made by
  // the user.
  React.useEffect(() => {
    setSelectedItems(initialSelectedItems);
  }, [initialSelectedItems]);

  // When the user changes their selected items, we want to store them locally.
  // We also want to determine if we should push these changes up to the parent.
  const onFilterItemsChange = React.useCallback(
    newSelectedItems => {
      setSelectedItems(newSelectedItems);

      // The DashboardFilterSelector stores changes to the selected items in an
      // *uncontrolled* way. We don't want to store an "unapplied" filter item
      // on the Dashboard spec.
      // NOTE(stephen): This is different from the existing GridDashboardApp
      // approach. In our modern rearchitecture, we don't have to store a
      // "dashboard has unsaved changes" flag. Instead, we compare the dashboard
      // specs by reference. If we were to store unapplied filter items, then
      // the dashboard would show as "unsaved" even though fundamentally nothing
      // has changed.
      const appliedFilterItems = QueryFilterItemUtil.removeEmptyItems(
        newSelectedItems.arrayView(),
      );
      const appliedFiltersEqual = arrayEquality(
        initialSelectedItems.arrayView(),
        appliedFilterItems,
      );
      if (!appliedFiltersEqual) {
        onSettingsChange({
          ...settings,
          items: appliedFilterItems,
        });
      }
    },
    [initialSelectedItems, onSettingsChange, settings],
  );

  return (
    <DashboardFilterSelector
      collapsedLayout={collapse}
      dashboardQueryItemTitles={dashboardQueryItemTitles}
      dimensionValueMap={dimensionValueMap}
      hierarchyRoot={hierarchyRoot}
      horizontal={horizontal}
      initialExcludedItems={legacyExcludedTiles}
      onExcludedItemsUpdate={onExcludedTilesChange}
      onSelectedItemsChanged={onFilterItemsChange}
      selectedItems={selectedItems}
      showExclusionsAsTooltip={presenting}
      supportedDimensions={dimensions}
    />
  );
}

export default (React.memo(
  CommonFilterSettings,
): React.AbstractComponent<Props>);
