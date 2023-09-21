// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CategoryFilterTree from 'models/DataCatalogApp/CategoryFilterTree';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { CategoryFilterItem } from 'models/DataCatalogApp/CategoryFilterTree';
import type {
  useFilterHierarchy_categoryConnection$data,
  useFilterHierarchy_categoryConnection$key,
} from './__generated__/useFilterHierarchy_categoryConnection.graphql';
import type {
  useFilterHierarchy_fieldConnection$data,
  useFilterHierarchy_fieldConnection$key,
} from './__generated__/useFilterHierarchy_fieldConnection.graphql';

export default function useFilterHierarchy(
  categoryConnection: useFilterHierarchy_categoryConnection$key,
  fieldConnection: useFilterHierarchy_fieldConnection$key,
): [
  HierarchyItem<CategoryFilterItem>,
  (categoryId: string) => $ReadOnlyArray<$ReadOnly<CategoryFilterItem>>,
] {
  const categories: useFilterHierarchy_categoryConnection$data = useFragment(
    graphql`
      fragment useFilterHierarchy_categoryConnection on categoryConnection {
        edges {
          node {
            id
            name
            parent {
              id
            }
          }
        }
      }
    `,
    categoryConnection,
  );

  const fields: useFilterHierarchy_fieldConnection$data = useFragment(
    graphql`
      fragment useFilterHierarchy_fieldConnection on fieldConnection {
        edges {
          node {
            id
            name
            shortName: short_name
            fieldCategoryMappings: field_category_mappings {
              category {
                id
              }
            }
          }
        }
      }
    `,
    fieldConnection,
  );

  const [hierarchyRoot, getCategoryPath] = React.useMemo(() => {
    const tree = new CategoryFilterTree();

    // Alphabetically sorting categories and fields.
    const sortedCategories = categories.edges
      .slice()
      .sort((a, b) => a.node.name.localeCompare(b.node.name));
    const sortedFields = fields.edges
      .slice()
      .sort((a, b) => a.node.name.localeCompare(b.node.name));

    // Add categories to the tree first, since they form the branches that all
    // fields will connect to.
    sortedCategories.forEach(({ node }) => {
      const { id, name, parent } = node;
      tree.addCategory(id, name, parent ? parent.id : undefined);
    });

    sortedFields.forEach(({ node }) => {
      const { id, name, shortName } = node;
      const parentIds = node.fieldCategoryMappings.map(
        ({ category }) => category.id,
      );
      tree.addField(id, name, shortName, parentIds);
    });

    return [tree.finalize(), categoryId => tree.getCategoryPath(categoryId)];
  }, [categories, fields]);
  return [hierarchyRoot, getCategoryPath];
}
