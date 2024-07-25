// @flow
import { useFragment } from 'react-relay/hooks';

import type { useCategoryContentCount_category$key } from './__generated__/useCategoryContentCount_category.graphql';

// This hook provides a way to count both the child categories and
// fields of a parent category
export default function useCategoryContentCount(
  fragmentRef: ?useCategoryContentCount_category$key,
): number {
  const data = useFragment(
    graphql`
      fragment useCategoryContentCount_category on category {
        fieldCategoryMappingsAggregate: field_category_mappings_aggregate {
          aggregate {
            count
          }
        }
        childrenCategoryAggregate: children_aggregate {
          aggregate {
            count
          }
        }
      }
    `,
    fragmentRef,
  );

  if (!data) {
    return 0;
  }

  const { childrenCategoryAggregate, fieldCategoryMappingsAggregate } = data;
  let categoryContentCount = 0;
  if (fieldCategoryMappingsAggregate.aggregate) {
    if (fieldCategoryMappingsAggregate.aggregate.count) {
      categoryContentCount += fieldCategoryMappingsAggregate.aggregate.count;
    }
  }

  if (childrenCategoryAggregate.aggregate) {
    if (childrenCategoryAggregate.aggregate.count) {
      categoryContentCount += childrenCategoryAggregate.aggregate.count;
    }
  }

  return categoryContentCount;
}
