// @flow
import * as React from 'react';

import DashboardCommonSettings from 'models/DashboardBuilderApp/DashboardCommonSettings';
import FilterCategorySection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/FilterCategorySection';
import GroupingCategorySection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/GroupingCategorySection';
import QueryPanelOrientationSection from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelOrientationSection';
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

  const onPanelAlignmentChange = newPanelAlignment => {
    onCommonSettingsUpdate(commonSettings.panelAlignment(newPanelAlignment));
  };

  return (
    <div className="general-settings-tab">
      <FilterCategorySection
        filterCategories={filterCategories}
        filterSettings={commonSettings.filterSettings()}
        onFilterSettingsChange={onFilterSettingsChange}
      />
      <GroupingCategorySection
        groupingCategories={groupingCategories}
        groupingSettings={commonSettings.groupingSettings()}
        onGroupingSettingsChange={onGroupingSettingsChange}
      />
      <QueryPanelOrientationSection
        onPanelAlignmentChange={onPanelAlignmentChange}
        panelAlignment={commonSettings.panelAlignment()}
      />
    </div>
  );
}
