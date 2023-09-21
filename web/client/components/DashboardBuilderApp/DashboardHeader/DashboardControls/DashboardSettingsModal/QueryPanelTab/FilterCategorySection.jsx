// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import EnabledFilterGroupingItems from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/EnabledFilterGroupingItems';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import type { FilterSettings } from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  filterCategories: $ReadOnlyArray<LinkedCategory>,
  filterSettings: FilterSettings<QueryFilterItem>,
  onFilterSettingsChange: (
    filterSettings: FilterSettings<QueryFilterItem>,
  ) => void,
};

type FilterHierarchyProps = {
  [key: string]: Zen.Array<QueryFilterItem>,
};

export default function FilterCategorySection({
  filterCategories,
  filterSettings,
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
    const { enabledFilterHierarchy } = filterSettings;
    const updatedFilterHierarchy = selectedCategories.map(category => {
      const originalCategory = enabledFilterHierarchy.find(
        c => c.category === category,
      );
      return originalCategory
        ? { ...originalCategory }
        : { category, dimensions: [] };
    });

    onFilterSettingsChange({
      ...filterSettings,
      enabledFilterHierarchy: updatedFilterHierarchy,
    });
  };

  const onChangeFilterHierarchy = React.useCallback(
    (selectedFilterHierarchy: FilterHierarchyProps) => {
      const enabledFilterHierarchy = [];
      Object.keys(selectedFilterHierarchy).forEach(key => {
        enabledFilterHierarchy.push({
          category: key,
          dimensions: selectedFilterHierarchy[key].toArray().map(dimension => {
            if (dimension.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
              return {
                dimension: dimension.dimension(),
                values: dimension
                  .dimensionValues()
                  .map(dimensionValue => dimensionValue.name())
                  .toArray(),
              };
            }
            // NOTE: This is a hack to get around the fact that we don't have a way to
            // represent a dimension with no values selected. This is a valid state
            // for a dimension filter, but we can't represent it in the model.
            return { dimension: '', values: [] };
          }),
        });
      });

      onFilterSettingsChange({
        ...filterSettings,
        enabledFilterHierarchy,
      });
    },
    [filterSettings, onFilterSettingsChange],
  );

  return (
    <Group.Vertical
      className="gd-query-panel-tab-config-item"
      paddingBottom="l"
      spacing="l"
    >
      <Heading.Small>
        <I18N>Filters</I18N>
      </Heading.Small>
      <QueryPanelToggleSwitch
        header={I18N.text('Allow users to use filters on this dashboard')}
        id="toggle-dashboard-filter-visibility"
        onChange={toggleDashboardFilterVisibility}
        value={filterSettings.visible}
      />
      {filterSettings.visible && (
        <EnabledFilterGroupingItems
          categories={filterCategories}
          enabledFilterHierarchy={filterSettings.enabledFilterHierarchy}
          errorText={I18N.text(
            'You cannot disable the only filter item, instead disable filtering on the dashboard',
            'disableFilterItemError',
          )}
          onChangeFilterHierarchy={onChangeFilterHierarchy}
          onChangeSelectedCategoryIds={onChangeSelectedCategories}
          selectedCategoryIds={filterSettings.enabledFilterHierarchy.map(
            item => item.category,
          )}
          title={I18N.text('Choose which filters to enable')}
        />
      )}
    </Group.Vertical>
  );
}
