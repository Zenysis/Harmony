// @flow
import * as React from 'react';

import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import getFilterHierarchy from 'components/common/QueryBuilder/FilterSelector/getFilterHierarchy';
import { AuthorizedDimensionService } from 'services/wip/DimensionService';
import { cancelPromise } from 'util/promiseUtil';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type Dimension from 'models/core/wip/Dimension';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

export default function useFilterHierarchy(
  excludeTimeFilters?: boolean = false,
): HierarchyItem<LinkedCategory | Dimension | CustomizableTimeInterval> {
  const [hierarchy, setHierarchy] = React.useState<
    HierarchyItem<LinkedCategory | Dimension | CustomizableTimeInterval>,
  >(HierarchyItem.createRoot());

  React.useEffect(() => {
    const promise = AuthorizedDimensionService.getAll().then(dimensions =>
      setHierarchy(getFilterHierarchy(dimensions, excludeTimeFilters)),
    );
    return () => cancelPromise(promise);
  }, [excludeTimeFilters]);

  return hierarchy;
}
