// @flow
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * A function that returns whether or not a value of type QueryFilterItem
 * is in an "empty filter" state
 */
export default function filterItemIsEmpty(item: QueryFilterItem): boolean {
  // The UnappliedQueryFilterItem type will *always* produce an empty filter.
  if (item.tag === 'UNAPPLIED_QUERY_FILTER_ITEM') {
    return true;
  }

  if (item.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
    return item.isEmpty();
  }

  // All other filter item types will never have an "empty filter" state.
  return false;
}
