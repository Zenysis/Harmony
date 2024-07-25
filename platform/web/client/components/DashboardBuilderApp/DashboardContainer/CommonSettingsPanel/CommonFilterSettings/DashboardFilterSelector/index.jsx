// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ExclusionSettingsButton from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/ExclusionSettingsButton';
import FilterSelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock';
import HorizontalFilterSection from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonFilterSettings/DashboardFilterSelector/HorizontalFilterSection';
import I18N from 'lib/I18N';

type Props = {
  collapsedLayout: boolean,
  dashboardQueryItemTitles: $PropertyType<
    React.ElementConfig<typeof ExclusionSettingsButton>,
    'dashboardQueryItemTitles',
  >,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'dimensionValueMap',
  >,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'hierarchyRoot',
  >,
  horizontal: boolean,
  initialExcludedItems: Zen.Array<string>,
  onExcludedItemsUpdate: (Zen.Array<string>) => void,
  onSelectedItemsChanged: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'onSelectedItemsChanged',
  >,
  selectedItems: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'selectedItems',
  >,
  showExclusionsAsTooltip: boolean,
  supportedDimensions: $PropertyType<
    React.ElementConfig<typeof FilterSelectionBlock>,
    'supportedDimensions',
  >,
};

function DashboardFilterSelector({
  collapsedLayout,
  dashboardQueryItemTitles,
  dimensionValueMap,
  hierarchyRoot,
  horizontal,
  initialExcludedItems,
  onExcludedItemsUpdate,
  onSelectedItemsChanged,
  selectedItems,
  showExclusionsAsTooltip,
  supportedDimensions,
}: Props): React.Node {
  const filterSection = horizontal ? (
    <HorizontalFilterSection
      collapsedLayout={collapsedLayout}
      dimensionValueMap={dimensionValueMap}
      hierarchyRoot={hierarchyRoot}
      onSelectedItemsChanged={onSelectedItemsChanged}
      selectedItems={selectedItems}
      supportedDimensions={supportedDimensions}
    />
  ) : (
    <FilterSelectionBlock
      dimensionValueMap={dimensionValueMap}
      helpText={I18N.text(
        'Limit the data that you want to see in your dashboard',
        'filterHelpText',
      )}
      hideUnsupportedDimensions
      hierarchyRoot={hierarchyRoot}
      onSelectedItemsChanged={onSelectedItemsChanged}
      selectedItems={selectedItems}
      supportedDimensions={supportedDimensions}
    />
  );

  const exclusionButtonClassName = horizontal
    ? 'gd-exclusion-settings-button--horizontal'
    : 'gd-exclusion-settings-button--vertical';

  return (
    <div className="gd-query-section">
      {!collapsedLayout && (
        <ExclusionSettingsButton
          className={exclusionButtonClassName}
          dashboardQueryItemTitles={dashboardQueryItemTitles}
          header={I18N.text(
            'Choose queries that can be filtered',
            'exclusionSettingsFilterHeader',
          )}
          initialExcludedItems={initialExcludedItems}
          onExcludedItemsUpdate={onExcludedItemsUpdate}
          showExclusionsAsTooltip={showExclusionsAsTooltip}
        />
      )}
      {filterSection}
    </div>
  );
}

export default (React.memo<Props>(
  DashboardFilterSelector,
): React.AbstractComponent<Props>);
