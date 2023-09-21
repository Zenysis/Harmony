// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import FilterSelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import useDimensionValueMap from 'components/common/QueryBuilder/FilterSelector/useDimensionValueMap';
import useFilterHierarchy from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useFilterHierarchy';
import { TIME_INTERVAL_FILTER_ID } from 'components/common/QueryBuilder/FilterSelector/constants';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  category: LinkedCategory,
  categoryEnabled: boolean,
  className?: string,
  dimensions: $ReadOnlyArray<string>,
  includeTimeFilters?: boolean,
  onChange: (category: LinkedCategory) => void,
  onDimensionChange: (
    dimensionId: string,
    selectedItems: Zen.Array<QueryFilterItem>,
  ) => void,
  selectedCategoryItems: Zen.Array<QueryFilterItem>,
};

function FilterCategoryItem({
  category,
  categoryEnabled,
  className,
  dimensions,
  includeTimeFilters,
  onChange,
  onDimensionChange,
  selectedCategoryItems,
}: Props) {
  const initialSelectedItems = React.useMemo(
    () => Zen.Array.create(selectedCategoryItems),
    [selectedCategoryItems],
  );

  const dimensionValueMap = useDimensionValueMap();
  const [selectedItems, setSelectedItems] = React.useState(
    initialSelectedItems,
  );
  const hierarchyRoot = useFilterHierarchy(!includeTimeFilters);

  const categoryHierarchyData = hierarchyRoot
    .children()
    ?.find(item => item.id() === category.id());

  const filterTypesButton = () => {
    return (
      <>
        <button
          className="gd-query-panel-tab-config-item__control-btn"
          type="button"
        >
          <I18N>Specify filter values</I18N>
          <Icon className="gd-dashboard-control-button__icon" type="svg-add" />
        </button>
        <InfoTooltip
          text={I18N.text(
            'If no filter values are specified for a category, then all filter types in this category and their filter value will be allowed. However if a user specifies filter values, then only specified filter categories and values will be allowed',
          )}
        />
      </>
    );
  };

  // When the user changes their selected items, we want to store them locally.
  // We also want to determine if we should push these changes up to the parent.
  const onFilterItemsChange = React.useCallback(
    newSelectedItems => {
      setSelectedItems(newSelectedItems);
      onDimensionChange(category.id(), newSelectedItems);
    },
    [category, onDimensionChange],
  );

  // If the category is a date range, we don't want to render the filter selection block.
  const isDateRange = category.id() === TIME_INTERVAL_FILTER_ID;

  return (
    <Group.Vertical
      key={category.id()}
      className={className}
      marginBottom="none"
      paddingBottom={categoryEnabled ? 'm' : 'none'}
    >
      <QueryPanelToggleSwitch
        className={`gd-query-panel-tab-config-item__list--item${
          categoryEnabled ? '-active' : ''
        }`}
        header={category.name()}
        onChange={() => onChange(category)}
        value={categoryEnabled}
      />

      {categoryEnabled && !isDateRange && (
        <div className="gd-query-panel-tab-config-item__control">
          {categoryHierarchyData && (
            <FilterSelectionBlock
              button={filterTypesButton}
              dimensionValueMap={dimensionValueMap}
              hierarchyRoot={categoryHierarchyData}
              onSelectedItemsChanged={onFilterItemsChange}
              orientation="horizontal"
              renderNegateFilter={false}
              selectedItems={selectedItems}
              showDragHandle={false}
              showTitle={false}
              supportedDimensions={dimensions}
            />
          )}
        </div>
      )}
    </Group.Vertical>
  );
}

export default (React.memo<Props>(
  FilterCategoryItem,
): React.AbstractComponent<Props>);
