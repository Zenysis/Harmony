// @flow
import * as React from 'react';

import EnabledFilterGroupingItems from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/EnabledFilterGroupingItems';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import type { CommonQueryTileSettings } from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

type Props = {
  groupingSettings: CommonQueryTileSettings<GroupingItem>,
  groupingCategories: $ReadOnlyArray<LinkedCategory>,
  onGroupingSettingsChange: (
    groupingSettings: CommonQueryTileSettings<GroupingItem>,
  ) => void,
};

export default function GroupingCategorySection({
  groupingSettings,
  groupingCategories,
  onGroupingSettingsChange,
}: Props): React.Node {
  const toggleDashboardGroubyVisibility = () => {
    onGroupingSettingsChange({
      ...groupingSettings,
      visible: !groupingSettings.visible,
    });
  };

  const onChangeSelectedCategories = (
    selectedCategories: $ReadOnlyArray<string>,
  ) => {
    onGroupingSettingsChange({
      ...groupingSettings,
      enabledCategories: selectedCategories,
    });
  };

  return (
    <Group.Vertical
      className="gd-query-panel-tab-config-item gd-query-panel-tab-config-item__grouping"
      spacing="l"
      paddingBottom="l"
    >
      <Heading.Small>
        <I18N.Ref id="Group bys" />
      </Heading.Small>
      <QueryPanelToggleSwitch
        header={I18N.text('Allow users to use group bys on this dashboard')}
        value={groupingSettings.visible}
        onChange={toggleDashboardGroubyVisibility}
      />
      {groupingSettings.visible && (
        <EnabledFilterGroupingItems
          title={I18N.text('Choose which group bys to enable')}
          categories={groupingCategories}
          selectedCategoryIds={groupingSettings.enabledCategories}
          onChangeSelectedCategoryIds={onChangeSelectedCategories}
          errorText={I18N.text(
            'You cannot disable the only group by item, instead disable grouping on the dashboard',
            'disableGroupingItemError',
          )}
        />
      )}
    </Group.Vertical>
  );
}
