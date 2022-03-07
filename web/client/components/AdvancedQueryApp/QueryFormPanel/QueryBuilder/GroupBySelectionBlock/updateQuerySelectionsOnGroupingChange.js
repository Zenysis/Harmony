// @flow
import * as Zen from 'lib/Zen';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

/**
 * Update the QuerySelections model when new groupings are selected. Prevent the
 * same grouping item from being added twice.
 */
export default function updateQuerySelectionsOnGroupingChange(
  querySelections: QuerySelections,
  selectedGroupDimensions: Zen.Array<GroupingItem>,
): QuerySelections {
  // If a new item is being added, and that item is a Granularity type, swap
  // the old item for the newly selected item.
  const prevSelectedItems = querySelections.groups();

  // If a new item is *not* being added or if no items were previously
  // selected, proceed normally.
  if (
    selectedGroupDimensions.size() <= prevSelectedItems.size() ||
    prevSelectedItems.isEmpty()
  ) {
    return querySelections.groups(selectedGroupDimensions);
  }

  // Get the latest item selected.
  // HACK(stephen): Taking advantage of knowledge that only a single item
  // will be added at a time.
  const newItem = selectedGroupDimensions.last();

  // If this item was previously selected, skip the change.
  // NOTE(stephen): Cannot fully rely on object equality here since
  // dashboards deserialize a different version of the grouping item objects
  // than what the hierarchical selector will provide.
  const GroupingItemClass = newItem.constructor;
  const previouslyAdded = prevSelectedItems.some(
    item => item instanceof GroupingItemClass && item.id() === newItem.id(),
  );
  if (previouslyAdded) {
    return querySelections;
  }

  // If the item being added was a Granularity. Check to see if another
  // granularity was already set.
  if (
    newItem instanceof GroupingGranularity &&
    prevSelectedItems.some(item => item instanceof GroupingGranularity)
  ) {
    const newItems = prevSelectedItems.map(item => {
      if (item instanceof GroupingGranularity) {
        return newItem;
      }
      return item;
    });
    return querySelections.groups(newItems);
  }

  return querySelections.groups(selectedGroupDimensions);
}
