// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import QueryPanelToggleSwitch from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab/QueryPanelToggleSwitch';
import Toaster from 'components/ui/Toaster';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

type Props = {
  categories: $ReadOnlyArray<LinkedCategory>,
  errorText: string,
  onChangeSelectedCategoryIds: (
    selectedCategoryIds: $ReadOnlyArray<string>,
  ) => void,
  selectedCategoryIds: $ReadOnlyArray<string>,
  title: string,
};

function EnabledFilterGroupingItems({
  categories,
  onChangeSelectedCategoryIds,
  errorText,
  selectedCategoryIds,
  title,
}: Props): React.Node {
  const allEnabled = selectedCategoryIds.length === 0;

  const onChange = (category: LinkedCategory) => {
    if (allEnabled) {
      // Incase there is only one category for filtering prompt user
      // to disable filtering on the dashboard instead
      if (categories.length === 1) {
        Toaster.warning(errorText);
        return;
      }
      // take all categories filter out that specific category
      const newCategories = categories
        .filter(c => c.id() !== category.id())
        .map(c => c.id());
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
  };

  const renderCategory = (
    category: LinkedCategory,
    idx: number,
  ): React.Node => {
    const categoryEnabled =
      allEnabled || selectedCategoryIds.includes(category.id());

    return (
      <QueryPanelToggleSwitch
        className={
          idx !== categories.length - 1
            ? 'gd-query-panel-tab-config-item__list--item'
            : ''
        }
        key={category.id()}
        header={category.name()}
        value={categoryEnabled}
        onChange={() => onChange(category)}
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
