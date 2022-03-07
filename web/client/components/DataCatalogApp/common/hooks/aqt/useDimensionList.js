// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import Dimension from 'models/core/wip/Dimension';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { relayIdToDatabaseId } from 'util/graphql';
import type { useDimensionList_dimensionConnection$key } from './__generated__/useDimensionList_dimensionConnection.graphql';

// This hook provides a simple way to create an AQT compatible Dimension list,
// with complete category information, using graphql.
export default function useDimensionList(
  fragmentRef: useDimensionList_dimensionConnection$key,
): $ReadOnlyArray<Dimension> {
  const dimensionConnection = useFragment(
    graphql`
      fragment useDimensionList_dimensionConnection on dimensionConnection {
        edges {
          node {
            id
            name

            dimensionCategoryMappings: dimension_category_mappings {
              category: dimension_category {
                name
                id
              }
            }
          }
        }
      }
    `,
    fragmentRef,
  );

  return React.useMemo(() => {
    const cachedCategories = {};
    function buildLinkedCategory(
      categories: $ReadOnlyArray<{ +category: { +id: string, +name: string } }>,
    ): LinkedCategory | void {
      if (categories.length === 0) {
        return undefined;
      }

      // NOTE(stephen): Right now we are only expecting dimensions to live
      // within a single parent category. That category cannot be nested
      // further beneath another category. This assumption is valid right now,
      // since that's how the non-data catalog structures work. Re-evaluate
      // in the future.
      const { id, name } = categories[0].category;
      if (cachedCategories[id] === undefined) {
        cachedCategories[id] = LinkedCategory.create({ id, name });
      }

      return cachedCategories[id];
    }

    return dimensionConnection.edges.map(({ node }) =>
      Dimension.fromObject({
        category: buildLinkedCategory(node.dimensionCategoryMappings),
        id: relayIdToDatabaseId(node.id),
        name: node.name,
      }),
    );
  }, [dimensionConnection]);
}
