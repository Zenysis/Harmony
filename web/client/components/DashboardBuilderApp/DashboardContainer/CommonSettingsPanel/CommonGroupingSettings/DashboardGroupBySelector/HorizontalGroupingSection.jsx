// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CollapsedLayoutList from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/CollapsedLayoutList';
import CustomizableGroupByTag from 'components/common/QueryBuilder/CustomizableGroupByTag';
import Group from 'components/ui/Group';
import GroupBySelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock/GroupBySelector';
import I18N from 'lib/I18N';
import SelectorButton from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/SelectorButton';
import TagItemList from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/TagItemList';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

type Props = {
  collapsedLayout: boolean,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'hierarchyRoot',
  >,
  onSelectedItemsChanged: (Zen.Array<GroupingItem>) => void,
  selectedItems: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'selectedItems',
  >,
  supportedDimensions: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'supportedDimensions',
  >,
  supportedGranularities: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'supportedGranularities',
  >,
};

const BUTTON = <SelectorButton title={I18N.text('Add Dashboard Grouping')} />;

const renderTag = ({ className, ...tagProps }) => (
  <CustomizableGroupByTag
    {...tagProps}
    className={`${className} gd-query-section__grouping-tag`}
  />
);

function GroupingSection({
  collapsedLayout,
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,
  supportedDimensions,
  supportedGranularities,
}: Props) {
  // NOTE(stephen): Explicitly calling `.customize()` here because, unlike
  // GroupBySelectionBlock, this is not taken care of by a parent.
  const onGroupingItemAdded = React.useCallback(
    item =>
      onSelectedItemsChanged(selectedItems.push(item.metadata().customize())),
    [onSelectedItemsChanged, selectedItems],
  );

  if (collapsedLayout) {
    return (
      <CollapsedLayoutList
        renderTag={renderTag}
        selectedItems={selectedItems}
        title="Groupings:"
      />
    );
  }

  return (
    <Group.Horizontal
      className="gd-query-section gd-query-section--horizontal"
      spacing="xs"
    >
      <GroupBySelector
        button={BUTTON}
        hideUnsupportedItems
        hierarchyRoot={hierarchyRoot}
        onItemSelect={onGroupingItemAdded}
        selectedItems={selectedItems}
        supportedDimensions={supportedDimensions}
        supportedGranularities={supportedGranularities}
      />
      <TagItemList
        onSelectedItemsChanged={onSelectedItemsChanged}
        renderTag={renderTag}
        selectedItems={selectedItems}
      />
    </Group.Horizontal>
  );
}

export default (React.memo<Props>(
  GroupingSection,
): React.AbstractComponent<Props>);
