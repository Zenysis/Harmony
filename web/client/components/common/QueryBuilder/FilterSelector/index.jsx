// @flow
import * as React from 'react';
import invariant from 'invariant';

import Dimension from 'models/core/wip/Dimension';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import getFilterHierarchy from 'components/common/QueryBuilder/FilterSelector/getFilterHierarchy';
import { uniqueId } from 'util/util';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  dimensions: $ReadOnlyArray<Dimension>,
  onItemSelect: (selectedItem: QueryFilterItem) => void,

  excludeTimeFilters?: boolean,
  flattenDimensionHierarchy?: boolean,

  /**
   * Determines if a loading spinner is shown. Should be set to true if we are
   * still loading the dimensions;
   */
  showLoadingSpinner?: boolean,
};

// TODO(stephen): Implement this.
function columnTitleGenerator(): string {
  return '';
}

function FilterSelector({
  dimensions,
  onItemSelect,
  showLoadingSpinner = false,
  excludeTimeFilters = false,
  flattenDimensionHierarchy = false,
}: Props) {
  const hierarchy = React.useMemo(
    () =>
      dimensions.length === 0
        ? HierarchyItem.createRoot()
        : getFilterHierarchy(
            dimensions,
            excludeTimeFilters,
            flattenDimensionHierarchy,
          ),
    [dimensions, excludeTimeFilters, flattenDimensionHierarchy],
  );

  const onItemClick = React.useCallback(
    (
      selectedItem: HierarchyItem<
        LinkedCategory | Dimension | CustomizableTimeInterval,
      >,
    ) => {
      if (selectedItem.isLeafItem()) {
        const metadata = selectedItem.metadata();
        invariant(
          metadata.tag !== 'LINKED_CATEGORY',
          'Selected leaf item cannot be a LinkedCategory',
        );

        // if the selected hierarchy item is a dimension we need to convert
        // it to a DimensionValueFilterItem
        const newMetadata =
          metadata.tag === 'DIMENSION'
            ? DimensionValueFilterItem.create({
                dimension: metadata.id(),
                id: `${metadata.id()}__${uniqueId()}`,
              })
            : metadata;

        onItemSelect(newMetadata.customize());
      }
    },
    [onItemSelect],
  );

  return (
    <HierarchicalSelector
      maxHeight={400}
      maxWidth={1000}
      columnWidth={400}
      onItemClick={onItemClick}
      hierarchyLoaded={!showLoadingSpinner}
      hierarchyRoot={hierarchy}
      columnTitleGenerator={columnTitleGenerator}
    />
  );
}

export default (React.memo(FilterSelector): React.AbstractComponent<Props>);
