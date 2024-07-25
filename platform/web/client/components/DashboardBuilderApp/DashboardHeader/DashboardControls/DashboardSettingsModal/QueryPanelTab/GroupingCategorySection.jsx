// @flow
import * as React from 'react';

import EnabledFilterGroupingItems from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/EnabledFilterGroupingItems';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { GroupingSettings } from 'models/DashboardBuilderApp/DashboardCommonSettings';

type Props = {
  groupingCategories: $ReadOnlyArray<LinkedCategory>,
  groupingSettings: GroupingSettings<GroupingItem>,
  onGroupingSettingsChange: (
    groupingSettings: GroupingSettings<GroupingItem>,
  ) => void,
};

export default function GroupingCategorySection({
  groupingCategories,
  groupingSettings,
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
      paddingBottom="l"
      spacing="l"
    >
      <Heading.Small>
        <I18N.Ref id="Group Bys" />
      </Heading.Small>
      <QueryPanelToggleSwitch
        header={I18N.text('Allow users to use group bys on this dashboard')}
        onChange={toggleDashboardGroubyVisibility}
        value={groupingSettings.visible}
      />
      {groupingSettings.visible && (
        <EnabledFilterGroupingItems
          categories={groupingCategories}
          errorText={I18N.text(
            'You cannot disable the only group by item, instead disable grouping on the dashboard',
            'disableGroupingItemError',
          )}
          onChangeSelectedCategoryIds={onChangeSelectedCategories}
          selectedCategoryIds={groupingSettings.enabledCategories}
          title={I18N.text('Choose which group bys to enable')}
        />
      )}
    </Group.Vertical>
  );
}
