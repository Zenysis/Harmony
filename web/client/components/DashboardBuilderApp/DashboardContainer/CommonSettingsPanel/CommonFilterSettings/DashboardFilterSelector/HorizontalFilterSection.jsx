// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CollapsedLayoutList from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/CollapsedLayoutList';
import CustomizableFilterTag from 'components/common/QueryBuilder/CustomizableFilterTag';
import FilterSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/FilterSelector';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import SelectorButton from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/SelectorButton';
import TagItemList from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/TagItemList';
import UnappliedQueryFilterItem from 'models/core/wip/QueryFilterItem/UnappliedQueryFilterItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  collapsedLayout: boolean,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof CustomizableFilterTag>,
    'dimensionValueMap',
  >,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof FilterSelector>,
    'hierarchyRoot',
  >,
  onSelectedItemsChanged: (Zen.Array<QueryFilterItem>) => void,
  selectedItems: Zen.Array<QueryFilterItem>,
  supportedDimensions: $PropertyType<
    React.ElementConfig<typeof FilterSelector>,
    'supportedDimensions',
  >,
};

const BUTTON = <SelectorButton title={I18N.text('Add Dashboard Filter')} />;

function FilterSection({
  collapsedLayout,
  dimensionValueMap,
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,
  supportedDimensions,
}: Props) {
  // HACK(stephen): We need a signal that will allow us to tell the
  // TagItemList to immediately open the last item in the list when a new item
  // is added. Filter items require customization, so we want to show the
  // customization module immediately.
  const [customizeLastItem, setCustomizeLastItem] = React.useState(false);

  const onFiltersChanged = React.useCallback(
    dashboardFilterItems => {
      onSelectedItemsChanged(dashboardFilterItems);
      setCustomizeLastItem(false);
    },
    [onSelectedItemsChanged],
  );
  const onFilterAdded = React.useCallback(
    item => {
      // When we add a new filter, we need to mark it as unapplied so that it
      // does not affect the actual dashboard queries that will be run.
      // NOTE(stephen): Explicitly calling `.customize()` here because, unlike
      // FilterSelectionBlock, this is not taken care of by a parent.
      const items = selectedItems.push(
        UnappliedQueryFilterItem.create({ item: item.metadata().customize() }),
      );
      onSelectedItemsChanged(items);
      setCustomizeLastItem(true);
    },
    [selectedItems, onSelectedItemsChanged],
  );

  const renderTag = React.useCallback(
    ({ onItemCustomized, className, ...tagProps }) => (
      <CustomizableFilterTag
        className={`${className} gd-query-section__filter-tag`}
        dimensionValueMap={dimensionValueMap}
        keepDateTagInSingleLine
        onApplyClick={onItemCustomized}
        {...tagProps}
      />
    ),
    [dimensionValueMap],
  );

  if (collapsedLayout) {
    return (
      <CollapsedLayoutList
        renderTag={renderTag}
        selectedItems={selectedItems}
        title="Filters:"
      />
    );
  }

  return (
    <Group.Horizontal
      className="gd-query-section gd-query-section--horizontal"
      spacing="xs"
    >
      <FilterSelector
        button={BUTTON}
        hideUnsupportedDimensions
        hierarchyRoot={hierarchyRoot}
        onItemSelect={onFilterAdded}
        supportedDimensions={supportedDimensions}
      />
      <TagItemList
        customizeLastSelectedItem={customizeLastItem}
        onSelectedItemsChanged={onFiltersChanged}
        renderTag={renderTag}
        selectedItems={selectedItems}
      />
    </Group.Horizontal>
  );
}

export default (React.memo<Props>(
  FilterSection,
): React.AbstractComponent<Props>);
