// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ExclusionSettingsButton from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/ExclusionSettingsButton';
import GroupBySelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock';
import HorizontalGroupingSection from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonGroupingSettings/DashboardGroupBySelector/HorizontalGroupingSection';
import I18N from 'lib/I18N';

type Props = {
  collapsedLayout: boolean,
  dashboardQueryItemTitles: $PropertyType<
    React.ElementConfig<typeof ExclusionSettingsButton>,
    'dashboardQueryItemTitles',
  >,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'hierarchyRoot',
  >,
  horizontal: boolean,
  initialExcludedItems: Zen.Array<string>,
  onExcludedItemsUpdate: (Zen.Array<string>) => void,
  onSelectedItemsChanged: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'onSelectedItemsChanged',
  >,
  selectedItems: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'selectedItems',
  >,
  showExclusionsAsTooltip: boolean,
  supportedDimensions: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'supportedDimensions',
  >,
  supportedGranularities: $PropertyType<
    React.ElementConfig<typeof GroupBySelectionBlock>,
    'supportedGranularities',
  >,
};

function DashboardGroupBySelector({
  collapsedLayout,
  dashboardQueryItemTitles,
  hierarchyRoot,
  horizontal,
  initialExcludedItems,
  onExcludedItemsUpdate,
  onSelectedItemsChanged,
  selectedItems,
  showExclusionsAsTooltip,
  supportedDimensions,
  supportedGranularities,
}: Props): React.Node {
  const groupingSection = horizontal ? (
    <HorizontalGroupingSection
      collapsedLayout={collapsedLayout}
      hierarchyRoot={hierarchyRoot}
      onSelectedItemsChanged={onSelectedItemsChanged}
      selectedItems={selectedItems}
      supportedDimensions={supportedDimensions}
      supportedGranularities={supportedGranularities}
    />
  ) : (
    <GroupBySelectionBlock
      helpText={I18N.text(
        'Select the groups to break up the analysis on your dashboard',
        'groupingHelpText',
      )}
      hideUnsupportedItems
      hierarchyRoot={hierarchyRoot}
      onSelectedItemsChanged={onSelectedItemsChanged}
      selectedItems={selectedItems}
      supportedDimensions={supportedDimensions}
      supportedGranularities={supportedGranularities}
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
            'Choose queries that can be grouped by',
            'exclusionSettingsGroupingHeader',
          )}
          initialExcludedItems={initialExcludedItems}
          onExcludedItemsUpdate={onExcludedItemsUpdate}
          showExclusionsAsTooltip={showExclusionsAsTooltip}
        />
      )}
      {groupingSection}
    </div>
  );
}

export default (React.memo<Props>(
  DashboardGroupBySelector,
): React.AbstractComponent<Props>);
