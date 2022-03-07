// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
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
  hierarchyRoot: HierarchyItem<
    LinkedCategory | Dimension | CustomizableTimeInterval,
  >,

  button?: $PropertyType<
    React.ElementConfig<typeof QueryPartSelector>,
    'button',
  >,
  hideUnsupportedDimensions?: boolean,

  /** An optional list of dimension IDs that are supported for selection. */
  supportedDimensions?: $ReadOnlyArray<string> | void,
};

// TODO(stephen): Implement this.
function columnTitleGenerator(): string {
  return '';
}

function logMenuOpen() {
  analytics.track('Open Hierarchical Selector ', {
    querySection: 'Filter Selector',
  });
}

function FilterSelector({
  hierarchyRoot,
  onItemSelect,

  button = undefined,
  hideUnsupportedDimensions = false,
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

      analytics.track('Select AQT Filter Type', {
        selectedFilterValue:
          metadata.tag === 'DIMENSION' ? metadata.name() : metadata.dateType(),
        isTimeDimension: metadata.tag === 'CUSTOMIZABLE_TIME_INTERVAL',
      });
      onItemSelect(item);
    },
    [onItemSelect],
  );

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
      columnTitleGenerator={columnTitleGenerator}
      onItemSelect={onItemSelectWrapper}
      onMenuOpen={logMenuOpen}
      hierarchyRoot={modifiedHierarchyRoot}
    />
  );
}

export default (React.memo(FilterSelector): React.AbstractComponent<Props>);
