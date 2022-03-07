// @flow
import * as React from 'react';

import DashboardCommonSettings from 'models/DashboardBuilderApp/DashboardCommonSettings';
import FilterCategorySection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/FilterCategorySection';
import GroupingCategorySection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/GroupingCategorySection';
import useFilterAndGroupingCategories from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/hooks/useFilterAndGroupingCategories';

type Props = {
  commonSettings: DashboardCommonSettings,
  onCommonSettingsUpdate: (commonSettings: DashboardCommonSettings) => void,
};

export default function QueryPanelTab({
  commonSettings,
  onCommonSettingsUpdate,
}: Props): React.Node {
  const [
    filterCategories,
    groupingCategories,
  ] = useFilterAndGroupingCategories();

  const onFilterSettingsChange = newFilterSettings => {
    onCommonSettingsUpdate(commonSettings.filterSettings(newFilterSettings));
  };

  const onGroupingSettingsChange = newGroupSettings => {
    onCommonSettingsUpdate(commonSettings.groupingSettings(newGroupSettings));
  };

  return (
    <div className="general-settings-tab">
      <FilterCategorySection
        filterSettings={commonSettings.filterSettings()}
        onFilterSettingsChange={onFilterSettingsChange}
        filterCategories={filterCategories}
      />
      <GroupingCategorySection
        groupingSettings={commonSettings.groupingSettings()}
        onGroupingSettingsChange={onGroupingSettingsChange}
        groupingCategories={groupingCategories}
      />
    </div>
  );
}
