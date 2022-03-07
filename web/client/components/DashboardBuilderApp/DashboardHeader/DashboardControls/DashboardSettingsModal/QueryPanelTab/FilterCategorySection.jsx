// @flow
import * as React from 'react';

import EnabledFilterGroupingItems from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/EnabledFilterGroupingItems';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import type { CommonQueryTileSettings } from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  filterSettings: CommonQueryTileSettings<QueryFilterItem>,
  filterCategories: $ReadOnlyArray<LinkedCategory>,
  onFilterSettingsChange: (
    filterSettings: CommonQueryTileSettings<QueryFilterItem>,
  ) => void,
};

export default function FilterCategorySection({
  filterSettings,
  filterCategories,
  onFilterSettingsChange,
}: Props): React.Node {
  const toggleDashboardFilterVisibility = () => {
    onFilterSettingsChange({
      ...filterSettings,
      visible: !filterSettings.visible,
    });
  };

  const onChangeSelectedCategories = (
    selectedCategories: $ReadOnlyArray<string>,
  ) => {
    onFilterSettingsChange({
      ...filterSettings,
      enabledCategories: selectedCategories,
    });
  };

  return (
    <Group.Vertical
      className="gd-query-panel-tab-config-item"
      spacing="l"
      paddingBottom="l"
    >
      <Heading.Small>
        <I18N>Filters</I18N>
      </Heading.Small>
      <QueryPanelToggleSwitch
        header={I18N.text('Allow users to use filters on this dashboard')}
        value={filterSettings.visible}
        onChange={toggleDashboardFilterVisibility}
      />
      {filterSettings.visible && (
        <EnabledFilterGroupingItems
          title={I18N.text('Choose which filters to enable')}
          categories={filterCategories}
          selectedCategoryIds={filterSettings.enabledCategories}
          onChangeSelectedCategoryIds={onChangeSelectedCategories}
          errorText={I18N.text(
            'You cannot disable the only filter item, instead disable filtering on the dashboard',
            'disableFilterItemError',
          )}
        />
      )}
    </Group.Vertical>
  );
}
