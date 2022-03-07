// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import HierarchicalSelector from 'components/ui/HierarchicalSelector';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import { buildGroupingHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import type Dimension from 'models/core/wip/Dimension';
import type Granularity from 'models/core/wip/Granularity';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

type Props = {
  dimensions: $ReadOnlyArray<Dimension>,
  granularities: $ReadOnlyArray<Granularity>,

  onItemSelect: (selectedItem: GroupingItem) => void,

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

function GroupBySelector({
  dimensions,
  granularities,
  onItemSelect,
  showLoadingSpinner = false,
}: Props) {
  const hierarchy = React.useMemo(
    () =>
      dimensions.length === 0
        ? HierarchyItem.createRoot()
        : buildGroupingHierarchy(dimensions, granularities),
    [dimensions, granularities],
  );

  const onItemClick = React.useCallback(
    (selectedItem: HierarchyItem<LinkedCategory | GroupingItem>) => {
      if (selectedItem.isLeafItem()) {
        const metadata = selectedItem.metadata();
        invariant(
          metadata.tag !== 'LINKED_CATEGORY',
          'Selected leaf item cannot be a LinkedCategory',
        );
        const selectedGrouping = Zen.cast<HierarchyItem<GroupingItem>>(
          selectedItem,
        );
        analytics.track('Select AQT Grouping', {
          selectedGrouping: selectedGrouping.id(),
        });

        onItemSelect(metadata);
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

export default (React.memo(GroupBySelector): React.AbstractComponent<Props>);
