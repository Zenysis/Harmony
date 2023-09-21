// @flow
import * as React from 'react';

import CustomizableGroupByTag from 'components/common/QueryBuilder/CustomizableGroupByTag';
import GroupBySelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/GroupBySelectionBlock/GroupBySelector';
import I18N from 'lib/I18N';
import SelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type {
  CustomQueryPartSelectorProps,
  SelectionProps,
} from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { CustomizableTagProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

type Props = {
  ...SelectionProps<GroupingItem>,
  allowUnsupportedDimensionToggle?: boolean,
  helpText?: string,
  hideUnsupportedItems?: boolean,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof GroupBySelector>,
    'hierarchyRoot',
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

function logGroupingItemRemoval(item: GroupingItem) {}

function GroupBySelectionBlock({
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,

  allowUnsupportedDimensionToggle = false,
  helpText = I18N.text(
    'Select the groups to break up your analysis',
    'selectAnalysisGroups',
  ),
  hideUnsupportedItems = false,
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

  const [hideUnsupportedGroupBys, setHideUnsupportedGroupBys] = React.useState(
    hideUnsupportedItems,
  );

  // setHideUnsupportedItems controls GroupBySelector.unsupportedDimensionToggle
  // - undefined: toggle is disabled and will not be displayed
  // - setState function: toggle is enabled and will be displayed
  const setHideUnsupportedItems = allowUnsupportedDimensionToggle
    ? setHideUnsupportedGroupBys
    : undefined;

  const renderQueryPartSelector = React.useCallback(
    (props: CustomQueryPartSelectorProps<GroupingItem>) => (
      <GroupBySelector
        hideUnsupportedItems={hideUnsupportedGroupBys}
        hierarchyRoot={hierarchyRoot}
        selectedItems={selectedItems}
        setHideUnsupportedItems={setHideUnsupportedItems}
        supportedDimensions={supportedDimensions}
        supportedGranularities={supportedGranularities}
        {...props}
      />
    ),
    [
      hideUnsupportedGroupBys,
      hierarchyRoot,
      selectedItems,
      setHideUnsupportedItems,
      supportedDimensions,
      supportedGranularities,
    ],
  );

  return (
    <SelectionBlock
      helpText={helpText}
      onRemoveTag={logGroupingItemRemoval}
      onSelectedItemsChanged={onSelectedItemsChanged}
      renderCustomizableTag={renderCustomizableTag}
      renderCustomQueryPartSelector={renderQueryPartSelector}
      selectedItems={selectedItems}
      testId="group-by-selection-block"
      title={I18N.textById('Group By')}
    />
  );
}

export default (React.memo(
  GroupBySelectionBlock,
): React.AbstractComponent<Props>);
