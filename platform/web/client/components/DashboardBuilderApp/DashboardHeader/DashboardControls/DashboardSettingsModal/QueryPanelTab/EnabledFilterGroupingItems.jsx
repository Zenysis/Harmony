// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import FilterCategoryItem from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/FilterCategoryItem';
import Group from 'components/ui/Group';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import Toaster from 'components/ui/Toaster';
import useDimensionValueMap from 'components/common/QueryBuilder/FilterSelector/useDimensionValueMap';
import useSupportedItems from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/hooks/useSupportedItems';
import { TIME_INTERVAL_FILTER_ID } from 'components/common/QueryBuilder/FilterSelector/constants';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { FilterCategoryHierarchy } from 'models/DashboardBuilderApp/DashboardCommonSettings';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type FilterHierarchyProps = {
  [key: string]: Zen.Array<QueryFilterItem>,
};
type Props = {
  categories: $ReadOnlyArray<LinkedCategory>,
  enabledFilterHierarchy?: $ReadOnlyArray<FilterCategoryHierarchy>,
  errorText: string,
  onChangeFilterHierarchy?: (
    selectedFilterHierarchy: FilterHierarchyProps,
  ) => void,
  onChangeSelectedCategoryIds: (
    selectedCategoryIds: $ReadOnlyArray<string>,
  ) => void,
  selectedCategoryIds: $ReadOnlyArray<string>,
  title: string,
};

function EnabledFilterGroupingItems({
  categories,
  enabledFilterHierarchy,
  errorText,
  onChangeFilterHierarchy,
  onChangeSelectedCategoryIds,
  selectedCategoryIds,
  title,
}: Props): React.Node {
  const [dimensions] = useSupportedItems(selectedCategoryIds);
  const dimensionValueMap = useDimensionValueMap();
  const [
    selectedCategoryItems,
    setSelectedCategoryItems,
  ] = React.useState<FilterHierarchyProps>({});

  const includeTimeFilters = React.useMemo(() => {
    const filteredCategories = enabledFilterHierarchy
      ? enabledFilterHierarchy.map(item => item.category)
      : [];

    return (
      !filteredCategories.length ||
      filteredCategories.includes(TIME_INTERVAL_FILTER_ID)
    );
  }, [enabledFilterHierarchy]);

  const filterSettingsByCategory = React.useMemo(() => {
    if (enabledFilterHierarchy) {
      const categoryFilterItems = {};
      enabledFilterHierarchy.forEach(hierarchy => {
        const filterItems = hierarchy.dimensions.map(item => {
          const dimensionValues = item.values
            ? dimensionValueMap[item.dimension]?.filter(dimensionValue =>
                item.values.includes(dimensionValue.name()),
              )
            : [];
          const dimensionFilterItems =
            dimensionValues && dimensionValues.length > 0
              ? DimensionValueFilterItem.createFromDimensionValues(
                  ...dimensionValues,
                )
              : [];
          return dimensionFilterItems;
        });
        categoryFilterItems[hierarchy.category] = Zen.Array.create(filterItems);
      });

      return categoryFilterItems;
    }

    return {};
  }, [enabledFilterHierarchy, dimensionValueMap]);

  React.useEffect(() => {
    if (Object.keys(filterSettingsByCategory).length) {
      setSelectedCategoryItems(filterSettingsByCategory);
    } else {
      setSelectedCategoryItems(
        selectedCategoryIds.reduce((acc, item) => {
          acc[item] = Zen.Array.create([]);
          return acc;
        }, {}),
      );
    }
  }, [
    dimensionValueMap,
    enabledFilterHierarchy,
    filterSettingsByCategory,
    selectedCategoryIds,
  ]);

  React.useEffect(() => {
    if (
      Object.keys(filterSettingsByCategory).length &&
      Object.keys(dimensionValueMap).length
    ) {
      setSelectedCategoryItems(filterSettingsByCategory);
    }
  }, [
    dimensions,
    enabledFilterHierarchy,
    dimensionValueMap,
    filterSettingsByCategory,
  ]);

  const onChange = React.useCallback(
    (category: LinkedCategory) => {
      if (!selectedCategoryIds.length) {
        // Incase there is only one category for filtering prompt user
        // to disable filtering on the dashboard instead
        if (categories.length === 1) {
          Toaster.warning(errorText);
          return;
        }
        // take all categories filter out that specific category
        const newCategories = categories.map(c => c.id());

        onChangeSelectedCategoryIds(newCategories);
        return;
      }

      const hasCategory = selectedCategoryIds.includes(category.id());
      if (hasCategory) {
        if (selectedCategoryIds.length === 1) {
          Toaster.warning(errorText);
          return;
        }
        const newCategories = selectedCategoryIds.filter(
          id => id !== category.id(),
        );
        onChangeSelectedCategoryIds(newCategories);
        return;
      }
      onChangeSelectedCategoryIds([...selectedCategoryIds, category.id()]);
    },
    [categories, errorText, onChangeSelectedCategoryIds, selectedCategoryIds],
  );

  /**
   * If there are no selected categories, select all categories
   */
  React.useEffect(() => {
    if (!selectedCategoryIds.length) {
      categories.forEach(category => {
        onChange(category);
      });
    }
  }, [categories, onChange, selectedCategoryIds]);

  const onDimensionsChange = React.useCallback(
    (dimensionId: string, selectedItems: Zen.Array<QueryFilterItem>) => {
      const newSelectedItems = {
        ...selectedCategoryItems,
        [dimensionId]: selectedItems,
      };
      setSelectedCategoryItems(newSelectedItems);

      if (onChangeFilterHierarchy) {
        onChangeFilterHierarchy(newSelectedItems);
      }
    },
    [onChangeFilterHierarchy, selectedCategoryItems],
  );

  const renderCategory = (
    category: LinkedCategory,
    idx: number,
  ): React.Node => {
    const categoryEnabled = selectedCategoryIds.includes(category.id());

    if (enabledFilterHierarchy === undefined) {
      return (
        <QueryPanelToggleSwitch
          key={category.id()}
          className={
            idx !== categories.length - 1
              ? 'gd-query-panel-tab-config-item__list--item-group_by'
              : ''
          }
          header={category.name()}
          onChange={() => onChange(category)}
          value={categoryEnabled}
        />
      );
    }

    return (
      <FilterCategoryItem
        key={category.id()}
        category={category}
        categoryEnabled={categoryEnabled}
        className={`gd-query-panel-tab-config-item${
          idx === categories.length - 1 ? ' last-index' : ''
        }`}
        dimensions={dimensions}
        includeTimeFilters={includeTimeFilters}
        onChange={onChange}
        onDimensionChange={onDimensionsChange}
        selectedCategoryItems={selectedCategoryItems[category.id()]}
      />
    );
  };

  return (
    <Group.Vertical className="gd-query-panel-tab-config-item__list">
      <span className="gd-query-panel-tab-config-item__info-text gd-query-panel-tab-config-item__description">
        {title}
      </span>
      {categories.map((category, idx) => renderCategory(category, idx))}
    </Group.Vertical>
  );
}

export default (React.memo<Props>(
  EnabledFilterGroupingItems,
): React.AbstractComponent<Props>);
