// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import I18N from 'lib/I18N';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import UnsupportedDimensionsToggle from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/common/UnsupportedDimensionsToggle';
import filterHierarchyTree from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/common/filterHierarchyTree';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { CustomQueryPartSelectorProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

type Props = {
  ...CustomQueryPartSelectorProps<GroupingItem>,
  button?: $PropertyType<
    React.ElementConfig<typeof QueryPartSelector>,
    'button',
  >,
  closeOnSelect?: boolean,
  hideUnsupportedItems?: boolean,
  hierarchyRoot: HierarchyItem<LinkedCategory | GroupingItem>,

  /** A list of items that have already been selected. */
  selectedItems: Zen.Array<GroupingItem>,

  /** Callback to reset value of `hideUnsupportedItems`.
   * If non-null, display UnsupportedDimensionsToggle to user. */
  setHideUnsupportedItems?: (boolean => void) | void,

  /** An optional list of dimension IDs that are supported for selection. */
  supportedDimensions?: $ReadOnlyArray<string> | void,

  /** An optional list of granularity IDs that are supported for selection. */
  supportedGranularities?: $ReadOnlyArray<string> | void,
};

function logMenuOpen() {}

function GroupBySelector({
  hierarchyRoot,
  onItemSelect,
  selectedItems,

  button = undefined,
  closeOnSelect = false,
  hideUnsupportedItems = false,
  setHideUnsupportedItems = undefined,
  supportedDimensions = undefined,
  supportedGranularities = undefined,
}: Props) {
  const modifiedHierarchyRoot = React.useMemo(() => {
    if (
      !hideUnsupportedItems ||
      (supportedDimensions === undefined &&
        supportedGranularities === undefined)
    ) {
      return hierarchyRoot;
    }

    // Filter the original hierarchy tree to remove any dimensions that are not
    // supported. If granularities are provided, ensure only the granularities
    // specified are included.
    const supportedDimensionIds = new Set(supportedDimensions || []);
    const supportedGranularityIds = new Set(supportedGranularities || []);

    function shouldIncludeChild(
      child: HierarchyItem<LinkedCategory | GroupingItem>,
    ): boolean {
      // If the child is a category (i.e. has non-undefined children) we should
      // include it since its children will be tested directly.
      if (child.children() !== undefined) {
        return true;
      }

      // If the child is a granularity item, and the user has specified a set of
      // granularities to include, test that the item is in the set. If the user
      // has not specified any granularities, always include it.
      const id = child.id();
      if (child.metadata().tag === 'GROUPING_GRANULARITY') {
        return (
          supportedGranularities === undefined ||
          supportedGranularityIds.has(id)
        );
      }

      // We should now be at the dimension level. If the user has specified a
      // set of dimensions to include, test that the item is in the set. If the
      // user has not specified any dimensions, always include it.
      return supportedDimensions === undefined || supportedDimensionIds.has(id);
    }

    return filterHierarchyTree(hierarchyRoot, shouldIncludeChild);
  }, [
    hideUnsupportedItems,
    hierarchyRoot,
    supportedDimensions,
    supportedGranularities,
  ]);

  const unselectableItems = React.useMemo(
    () => selectedItems.map(obj => obj.id()),
    [selectedItems],
  );

  const onGroupByItemSelect = React.useCallback(
    (item: HierarchyItem<LinkedCategory | GroupingItem>) => {
      invariant(
        item.metadata().tag !== 'LINKED_CATEGORY',
        'A leaf item cannot be a LinkedCategory',
      );
      const selectedGrouping = Zen.cast<HierarchyItem<GroupingItem>>(item);
      onItemSelect(selectedGrouping);
    },
    [onItemSelect],
  );

  const unsupportedDimensionsToggle = React.useMemo(() => {
    if (setHideUnsupportedItems === undefined) {
      return null;
    }
    const onToggleChange = () => setHideUnsupportedItems(!hideUnsupportedItems);

    return (
      <UnsupportedDimensionsToggle
        hideUnsupportedItems={hideUnsupportedItems}
        onToggleChange={onToggleChange}
      />
    );
  }, [hideUnsupportedItems, setHideUnsupportedItems]);

  const columnTitleGenerator = React.useCallback(
    (item: HierarchyItem<LinkedCategory | GroupingItem>) => {
      if (item.id() === 'root') {
        const instructionText = <I18N.Ref id="Select a category" />;
        return (
          <Group.Vertical lastItemStyle={{ fontWeight: 'normal' }} spacing="xs">
            <Heading.Small>{instructionText}</Heading.Small>
            {unsupportedDimensionsToggle}
          </Group.Vertical>
        );
      }
      return <div>{item.name()}</div>;
    },
    [unsupportedDimensionsToggle],
  );

  return (
    <QueryPartSelector
      button={button}
      closeOnSelect={closeOnSelect}
      collapseOnRootChange
      columnTitleGenerator={columnTitleGenerator}
      columnWidth={400}
      hierarchyRoot={modifiedHierarchyRoot}
      onItemSelect={onGroupByItemSelect}
      onMenuOpen={logMenuOpen}
      unselectableItems={unselectableItems}
    />
  );
}

export default (React.memo(GroupBySelector): React.AbstractComponent<Props>);
