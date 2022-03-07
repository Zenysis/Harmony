// @flow
import * as React from 'react';

import CustomizableGroupByTag from 'components/common/QueryBuilder/CustomizableGroupByTag';
import GroupBySelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock/GroupBySelector';
import SelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type {
  CustomQueryPartSelectorProps,
  SelectionProps,
} from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { CustomizableTagProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.GroupBySelectionBlock',
);

type Props = {
  ...SelectionProps<GroupingItem>,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'hierarchyRoot',
  >,

  helpText?: string,
  hideUnsupportedItems?: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'hideUnsupportedItems',
  >,
  supportedDimensions?: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'supportedDimensions',
  >,
  supportedGranularities?: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'supportedGranularities',
  >,
};

function logGroupingItemRemoval(item: GroupingItem) {
  analytics.track('Remove AQT Grouping', {
    selectedField: item.id(),
  });
}

function GroupBySelectionBlock({
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,

  helpText = TEXT.helpText,
  hideUnsupportedItems = undefined,
  supportedDimensions = undefined,
  supportedGranularities = undefined,
}: Props) {
  const renderCustomizableTag = React.useCallback(
    (props: CustomizableTagProps<GroupingItem>) => (
      <CustomizableGroupByTag
        className="aqt-customizable-grouping-tag"
        {...props}
      />
    ),
    [],
  );

  const renderQueryPartSelector = React.useCallback(
    (props: CustomQueryPartSelectorProps<GroupingItem>) => (
      <GroupBySelector
        hideUnsupportedItems={hideUnsupportedItems}
        hierarchyRoot={hierarchyRoot}
        selectedItems={selectedItems}
        supportedDimensions={supportedDimensions}
        supportedGranularities={supportedGranularities}
        {...props}
      />
    ),
    [
      hideUnsupportedItems,
      hierarchyRoot,
      selectedItems,
      supportedDimensions,
      supportedGranularities,
    ],
  );

  return (
    <SelectionBlock
      title={TEXT.title}
      helpText={helpText}
      onRemoveTag={logGroupingItemRemoval}
      onSelectedItemsChanged={onSelectedItemsChanged}
      renderCustomizableTag={renderCustomizableTag}
      renderCustomQueryPartSelector={renderQueryPartSelector}
      selectedItems={selectedItems}
      testId="group-by-selection-block"
    />
  );
}

export default (React.memo(
  GroupBySelectionBlock,
): React.AbstractComponent<Props>);
