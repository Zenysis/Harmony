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
        const allDimensionCategories = [];
        const allDimensionCategoryIDSet = new Set<string>();

        allDimensions.forEach(dimension => {
          const category = dimension.category();
          if (
            category !== undefined &&
            !allDimensionCategoryIDSet.has(category.id())
          ) {
            allDimensionCategories.push(category);
            allDimensionCategoryIDSet.add(category.id());
          }
        });

        const allGranularityCategories = [];
        const allGranularityCategoryIDSet = new Set<string>();

        allGranularities.forEach(granularity => {
          const category = granularity.category();
          if (
            category !== undefined &&
            !allGranularityCategoryIDSet.has(category.id())
          ) {
            allGranularityCategories.push(category);
            allGranularityCategoryIDSet.add(category.id());
          }
        });

        // Manually add date range category since its not a dimension or
        // granularity
        const timeIntervalCategory = LinkedCategory.create({
          id: TIME_INTERVAL_FILTER_ID,
          name: I18N.text('Date Range'),
        });

        setFilterCategories([...allDimensionCategories, timeIntervalCategory]);
        setGroupingCategories([
          ...allDimensionCategories,
          ...new Set(allGranularityCategories),
        ]);
      },
    );
  }, []);

  return [filterCategories, groupingCategories];
}
