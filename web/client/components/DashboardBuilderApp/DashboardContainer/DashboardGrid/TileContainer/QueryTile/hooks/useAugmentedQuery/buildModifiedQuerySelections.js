// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

// Object that groups QueryFilterItems by their type. DimensionValueFilterItems
// are stored with a mapping from Dimension ID -> filter item array.
type FilterItemGroup = {
  dimensions: { [string]: $ReadOnlyArray<DimensionValueFilterItem>, ... },
  time: $ReadOnlyArray<CustomizableTimeInterval>,
};

function groupFilters(
  filterItems: Zen.Array<QueryFilterItem>,
): FilterItemGroup {
  const output = {
    dimensions: {},
    time: [],
  };
  filterItems.forEach(item => {
    // Unapplied filter items should be skipped. The user must confirm them (and
    // thus create a concrete non-unapplied item type) for them to be included
    // in the filter grouping.
    if (item.tag === 'UNAPPLIED_QUERY_FILTER_ITEM') {
      return;
    }

    if (item.tag === 'CUSTOMIZABLE_TIME_INTERVAL') {
      output.time.push(item);
      return;
    }
    invariant(
      item.tag === 'DIMENSION_VALUE_FILTER_ITEM',
      'Expected DimensionValueFilterItem.',
    );

    const dimensionID = item.dimension();
    if (output.dimensions[dimensionID] === undefined) {
      output.dimensions[dimensionID] = [];
    }
    output.dimensions[dimensionID].push(item);
  });
  return output;
}

/**
 * Apply the currently selected dashboard filters and groupings on top of
 * the original query selections to produce the full QuerySelections that
 * should be used when querying.
 *
 * NOTE(david): For filters, we attempt to augment the query filters with the
 * dashboard level filters. For groupings, we simply replace query groupings
 * with dashboard groupings if they exist.
 * Explanation here: https://zenysis.slack.com/archives/C4HUURK46/p1621957192016900?thread_ts=1621954008.016400&cid=C4HUURK46
 */
export default function buildModifiedQuerySelections(
  querySelections: QuerySelections,
  dashboardFilterItems: Zen.Array<QueryFilterItem>,
  dashboardGroupingItems: Zen.Array<GroupingItem>,
): QuerySelections {
  // If there are no filters to apply, return the original selections.
  if (dashboardFilterItems.isEmpty() && dashboardGroupingItems.isEmpty()) {
    return querySelections;
  }

  const dashboardFilters = groupFilters(dashboardFilterItems);
  const queryFilters = groupFilters(querySelections.filter());

  // Prefer the user's dashboard time filter over the time filters
  // set on the original query.
  const timeFilters =
    dashboardFilters.time.length > 0
      ? dashboardFilters.time
      : queryFilters.time;

  // Merge logic:
  // 1) If a filter on a specific dimension is set only on the original query
  //    OR only on the user's dashboard filters, add that dimension's filters
  //    directly.
  // 2) If a filter on a specific dimension is set on both the original query
  //    and on the user's dashboard filters, use the dashboard filter's
  //    version and drop the original query's filter for that dimension.
  const mergedDimensionFilters = {
    ...queryFilters.dimensions,
    // Merge dashboard filters in last since they have precedence over the
    // original query's filters.
    ...dashboardFilters.dimensions,
  };

  // NOTE(stephen): Right now, filter order does not matter because they are
  // all ANDed together when the query is run.
  const fullFilter = [...timeFilters];
  Object.keys(mergedDimensionFilters).forEach(dimensionID => {
    fullFilter.push(...mergedDimensionFilters[dimensionID]);
  });
  const newQuerySelections = querySelections.filter(
    Zen.Array.create(fullFilter),
  );
  if (dashboardGroupingItems.isEmpty()) {
    return newQuerySelections;
  }
  return newQuerySelections.groups(dashboardGroupingItems);
}
