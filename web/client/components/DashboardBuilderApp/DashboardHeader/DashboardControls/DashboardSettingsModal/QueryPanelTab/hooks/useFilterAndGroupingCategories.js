// @flow
import * as React from 'react';

import DimensionService from 'services/wip/DimensionService';
import GranularityService from 'services/wip/GranularityService';
import I18N from 'lib/I18N';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { TIME_INTERVAL_FILTER_ID } from 'components/common/QueryBuilder/FilterSelector/constants';

/**
 * This hook returns the filter and grouping categories that can be enabled for
 * a dashboard.
 */
export default function useFilterAndGroupingCategories(): [
  $ReadOnlyArray<LinkedCategory>, // Filter Categories
  $ReadOnlyArray<LinkedCategory>, // Grouping Caategoriess
] {
  const [filterCategories, setFilterCategories] = React.useState([]);
  const [groupingCategories, setGroupingCategories] = React.useState([]);

  React.useEffect(() => {
    Promise.all([DimensionService.getAll(), GranularityService.getAll()]).then(
      ([allDimensions, allGranularities]) => {
        const allDimensionCategoriesSet = [];
        const allDimensionCategoryIDSet = new Set<string>();

        allDimensions.forEach(dimension => {
          const category = dimension.category();
          if (
            category !== undefined &&
            !allDimensionCategoryIDSet.has(category.id())
          ) {
            allDimensionCategoriesSet.push(category);
            allDimensionCategoryIDSet.add(category.id());
          }
        });

        const allGranularityCategories = allGranularities.map(granularity =>
          granularity.category(),
        );

        // Manually add date range category since its not a dimension or
        // granularity
        const timeIntervalCategory = LinkedCategory.create({
          name: I18N.text('Date Range'),
          id: TIME_INTERVAL_FILTER_ID,
        });

        setFilterCategories([
          ...allDimensionCategoriesSet,
          timeIntervalCategory,
        ]);
        setGroupingCategories([
          ...allDimensionCategoriesSet,
          ...new Set(allGranularityCategories),
        ]);
      },
    );
  }, []);

  return [filterCategories, groupingCategories];
}
