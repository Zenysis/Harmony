// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import Dimension from 'models/core/wip/Dimension';
import GranularityService from 'services/wip/GranularityService';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { buildGroupingHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import { cancelPromise } from 'util/promiseUtil';
import { relayIdToDatabaseId } from 'util/graphql';
import type Granularity from 'models/core/wip/Granularity';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { useGroupingHierarchy_dimensionConnection$key } from './__generated__/useGroupingHierarchy_dimensionConnection.graphql';

export default function useGroupingHierarchy(
  fragmentRef: useGroupingHierarchy_dimensionConnection$key,
): HierarchyItem<LinkedCategory | GroupingItem> {
  const dimensionConnection = useFragment(
    graphql`
      fragment useGroupingHierarchy_dimensionConnection on dimensionConnection {
        edges {
          node {
            id
            name
            dimensionCategoryMappings: dimension_category_mappings {
              category: dimension_category {
                id
                name
              }
            }
          }
        }
      }
    `,
    fragmentRef,
  );

  const [granularities, setGranularities] = React.useState<
    $ReadOnlyArray<Granularity>,
  >([]);

  const dimensions = React.useMemo(() => {
    const cachedCategories = {};

    const output = [];
    dimensionConnection.edges.forEach(({ node }) => {
      const { dimensionCategoryMappings, id, name } = node;
      const dimension = Dimension.UNSAFE_deserialize({
        id: relayIdToDatabaseId(id),
        name,
      });
      if (dimensionCategoryMappings.length === 0) {
        output.push(dimension);
        return;
      }

      // Dimensions can exist in multiple categories.
      // NOTE(stephen): Right now, we do not expect the categories to have a
      // parent category themselves. We expect the hierarchy to be 2 levels
      // (category -> Dimension). The database is set up more flexibly, so it
      // is possible for the category to have a parent in the future.
      dimensionCategoryMappings.forEach(({ category }) => {
        let linkedCategory;
        if (cachedCategories[category.id] !== undefined) {
          linkedCategory = cachedCategories[category.id];
        } else {
          linkedCategory = LinkedCategory.create(category);
          cachedCategories[category.id] = linkedCategory;
        }

        output.push(dimension.category(linkedCategory));
      });
    });
    return output;
  }, [dimensionConnection]);

  React.useEffect(() => {
    const promise = GranularityService.getAll().then(setGranularities);
    return () => cancelPromise(promise);
  }, []);

  const hierarchy = React.useMemo(
    () => buildGroupingHierarchy(dimensions, granularities),
    [dimensions, granularities],
  );
  return hierarchy;
}
