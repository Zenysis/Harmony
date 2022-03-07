// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import filterHierarchyTree from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/common/filterHierarchyTree';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { CustomQueryPartSelectorProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

const TEXT = t('AdvancedQueryApp.QueryFormPanel.QueryBuilder.GroupBySelector');

type Props = {
  ...CustomQueryPartSelectorProps<GroupingItem>,
  hierarchyRoot: HierarchyItem<LinkedCategory | GroupingItem>,

  /** A list of items that have already been selected. */
  selectedItems: Zen.Array<GroupingItem>,

  button?: $PropertyType<
    React.ElementConfig<typeof QueryPartSelector>,
    'button',
  >,
  closeOnSelect?: boolean,
  hideUnsupportedItems?: boolean,

  /** An optional list of dimension IDs that are supported for selection. */
  supportedDimensions?: $ReadOnlyArray<string> | void,

  /** An optional list of granularity IDs that are supported for selection. */
  supportedGranularities?: $ReadOnlyArray<string> | void,
};

function logMenuOpen() {
  analytics.track('Open Hierarchical Selector ', {
    querySection: 'Group By Selector',
  });
}

// NOTE(stephen): Originally had a way to pass a ToggleSwitch with the
// `columnTitleGenerator` that would toggle whether only supported items would
// be shown. However this component was generalized and simplified so that was
// removed. If it needs to be added back in, figure out how to support it and
// the other generalizations at the same time.
function columnTitleGenerator(
  item: HierarchyItem<LinkedCategory | GroupingItem>,
): string {
  return TEXT.columnTitles[item.id()];
}

function GroupBySelector({
  hierarchyRoot,
  onItemSelect,
  selectedItems,

  button = undefined,
  closeOnSelect = false,
  hideUnsupportedItems = false,
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
      analytics.track('Select AQT Grouping', {
        selectedGrouping: selectedGrouping.id(),
      });
      onItemSelect(selectedGrouping);
    },
    [onItemSelect],
  );

  return (
    <QueryPartSelector
      button={button}
      closeOnSelect={closeOnSelect}
      columnWidth={400}
      onItemSelect={onGroupByItemSelect}
      hierarchyRoot={modifiedHierarchyRoot}
      onMenuOpen={logMenuOpen}
      columnTitleGenerator={columnTitleGenerator}
      unselectableItems={unselectableItems}
    />
  );
}

export default (React.memo(GroupBySelector): React.AbstractComponent<Props>);
