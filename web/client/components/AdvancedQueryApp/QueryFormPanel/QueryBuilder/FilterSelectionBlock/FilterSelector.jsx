// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import UnsupportedDimensionsToggle from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/common/UnsupportedDimensionsToggle';
import convertToDimensionValueHack from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/convertToDimensionValueHack';
import filterHierarchyTree from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/common/filterHierarchyTree';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type Dimension from 'models/core/wip/Dimension';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { CustomQueryPartSelectorProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';

type Props = {
  ...CustomQueryPartSelectorProps<
    CustomizableTimeInterval | DimensionValueFilterItem,
  >,
  button?: $PropertyType<
    React.ElementConfig<typeof QueryPartSelector>,
    'button',
  >,

  hideUnsupportedDimensions?: boolean,
  hierarchyRoot: HierarchyItem<
    LinkedCategory | Dimension | CustomizableTimeInterval,
  >,

  /** Callback to reset value of `hideUnsupportedDimensions`.
   * If non-null, display UnsupportedDimensionsToggle to user. */
  setHideUnsupportedDimensions?: (boolean => void) | void,

  /** An optional list of dimension IDs that are supported for selection. */
  supportedDimensions?: $ReadOnlyArray<string> | void,
};

function logMenuOpen() {}

function FilterSelector({
  hierarchyRoot,
  onItemSelect,

  button = undefined,
  hideUnsupportedDimensions = false,
  setHideUnsupportedDimensions = undefined,
  supportedDimensions = undefined,
}: Props) {
  const onItemSelectWrapper = React.useCallback(
    (
      selectedItem: HierarchyItem<
        LinkedCategory | Dimension | CustomizableTimeInterval,
      >,
    ) => {
      const metadata = selectedItem.metadata();
      invariant(
        metadata.tag !== 'LINKED_CATEGORY',
        'onItemSelect should be impossible to call for a non-leaf item',
      );
      const item = convertToDimensionValueHack(
        Zen.cast<HierarchyItem<Dimension | CustomizableTimeInterval>>(
          selectedItem,
        ),
      );

      onItemSelect(item);
    },
    [onItemSelect],
  );

  const columnTitleGenerator = (
    item: HierarchyItem<LinkedCategory | Dimension | CustomizableTimeInterval>,
  ) => {
    // FilterSelector doesn't have column titles beyond (possibly) the
    // UnsupportedDimensionsToggle displayed at the root level.
    if (item.id() === 'root') {
      if (setHideUnsupportedDimensions === undefined) {
        return null;
      }
      return (
        <UnsupportedDimensionsToggle
          hideUnsupportedItems={hideUnsupportedDimensions}
          onToggleChange={() =>
            setHideUnsupportedDimensions(!hideUnsupportedDimensions)
          }
        />
      );
    }
    return null;
  };

  const modifiedHierarchyRoot = React.useMemo(() => {
    if (!hideUnsupportedDimensions) {
      return hierarchyRoot;
    }

    const supportedDimensionIds = new Set(supportedDimensions || []);

    function shouldIncludeChild(
      child: HierarchyItem<
        LinkedCategory | Dimension | CustomizableTimeInterval,
      >,
    ): boolean {
      // If the child is a category (i.e. has non-undefined children) we should
      // include it since its children will be tested directly.
      if (child.children() !== undefined) {
        return true;
      }

      // If the child is a customizable time interval, it should always be
      // included.
      if (child.metadata().tag === 'CUSTOMIZABLE_TIME_INTERVAL') {
        return true;
      }

      // Otherwise, if the user has specified a set of dimensions that should
      // be included, ensure the item is in that set. If the user has not
      // specified any dimensions, always include it.
      const id = child.id();
      return supportedDimensions === undefined || supportedDimensionIds.has(id);
    }

    return filterHierarchyTree(hierarchyRoot, shouldIncludeChild);
  }, [hideUnsupportedDimensions, hierarchyRoot, supportedDimensions]);

  return (
    <QueryPartSelector
      button={button}
      closeOnSelect
      collapseOnRootChange
      columnTitleGenerator={columnTitleGenerator}
      hierarchyRoot={modifiedHierarchyRoot}
      onItemSelect={onItemSelectWrapper}
      onMenuOpen={logMenuOpen}
    />
  );
}

export default (React.memo(FilterSelector): React.AbstractComponent<Props>);
