// @flow
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import { TIME_INTERVAL_FILTER_ID } from 'components/common/QueryBuilder/FilterSelector/constants';
import { buildDimensionHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import type Dimension from 'models/core/wip/Dimension';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

/* ::
declare function getFilterHierarchy(
  dimensions: $ReadOnlyArray<Dimension>,
  excludeTimeFilters: true,
  flattenDimensionHierarchy?: boolean,
): HierarchyItem<LinkedCategory | Dimension>;
declare function getFilterHierarchy(
  dimensions: $ReadOnlyArray<Dimension>,
  excludeTimeFilters?: boolean,
  flattenDimensionHierarchy?: boolean
): HierarchyItem<LinkedCategory | Dimension | CustomizableTimeInterval>;
*/
export default function getFilterHierarchy(
  dimensions: $ReadOnlyArray<Dimension>,
  excludeTimeFilters?: boolean = false,
  flattenDimensionHierarchy?: boolean = false,
):
  | HierarchyItem<LinkedCategory | Dimension | CustomizableTimeInterval>
  | HierarchyItem<LinkedCategory | Dimension> {
  const hierarchy = buildDimensionHierarchy(
    dimensions,
    flattenDimensionHierarchy,
  );

  if (excludeTimeFilters) {
    return hierarchy;
  }

  return hierarchy.addChild(
    HierarchyItem.create({
      id: TIME_INTERVAL_FILTER_ID,
      metadata: CustomizableTimeInterval.createDefaultInterval(),
      children: undefined,
    }),
  );
}
