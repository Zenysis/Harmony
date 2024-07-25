// @flow
import * as React from 'react';
import Promise from 'bluebird';

import CalendarSettings from 'models/config/CalendarSettings';
import GranularityService from 'services/wip/GranularityService';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import { AuthorizedDimensionService } from 'services/wip/DimensionService';
import { buildGroupingHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import { cancelPromise } from 'util/promiseUtil';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';

export default function useGroupingHierarchy(
  excludeGranularities?: boolean = false,
): HierarchyItem<LinkedCategory | GroupingItem> {
  const [hierarchy, setHierarchy] = React.useState<
    HierarchyItem<LinkedCategory | GroupingItem>,
  >(HierarchyItem.createRoot());

  React.useEffect(() => {
    const granularitiesPromise = excludeGranularities
      ? Promise.resolve([])
      : GranularityService.getAll();
    const promise = Promise.all([
      AuthorizedDimensionService.getAll(),
      granularitiesPromise,
    ]).then(([dimensions, granularities]) => {
      setHierarchy(
        buildGroupingHierarchy(
          dimensions,

          // only use the granularities that are configured as queryable
          granularities.filter(granularity =>
            CalendarSettings.current()
              .granularitySettings()
              .isGranularityEnabled(granularity.id()),
          ),
        ),
      );
    });
    return () => cancelPromise(promise);
  }, []);

  return hierarchy;
}
