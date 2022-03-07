// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CategoryFilterTree from 'models/DataCatalogApp/CategoryFilterTree';
import Field from 'models/core/wip/Field';
import FieldHierarchyService from 'services/AdvancedQueryApp/FieldHierarchyService';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import { VISIBILITY_STATUS_MAP } from 'models/core/DataCatalog/constants';
import { relayIdToDatabaseId } from 'util/graphql';
import type { useFieldHierarchy_categoryConnection$key } from './__generated__/useFieldHierarchy_categoryConnection.graphql';
import type { useFieldHierarchy_fieldConnection$key } from './__generated__/useFieldHierarchy_fieldConnection.graphql';

// Mapping from field ID to the list of dimension IDs usable by that field. If
// a field has an empty array of dimensions, it is unknown which dimensions are
// usable.
type FieldToSupportedDimensionsMap = {
  +[string]: $ReadOnlyArray<string>,
};

// This hook produces a hierarchy tree containing all fields and their
// categories. It uses graphql to build the tree and the result can be used as
// a drop-in replacement for the non-graphql AQT field hierarchy.
export default function useFieldHierarchy(
  categoryConnection: useFieldHierarchy_categoryConnection$key,
  fieldConnection: useFieldHierarchy_fieldConnection$key,
): [
  HierarchyItem<LinkedCategory | Field>,
  (HierarchyItem<Field>) => void,
  { +[string]: $ReadOnlyArray<string> },
] {
  const categories = useFragment(
    graphql`
      fragment useFieldHierarchy_categoryConnection on categoryConnection {
        edges {
          node {
            id
            name
            parent {
              id
            }
            visibilityStatus: visibility_status
          }
        }
      }
    `,
    categoryConnection,
  );

  const fields = useFragment(
    graphql`
      fragment useFieldHierarchy_fieldConnection on fieldConnection {
        edges {
          node {
            id
            name
            serializedCalculation: calculation
            shortName: short_name
            fieldCategoryMappings: field_category_mappings {
              category {
                id
              }
              visibilityStatus: visibility_status
            }
            fieldDimensionMappings: field_dimension_mappings {
              dimension {
                id
              }
            }
          }
        }
      }
    `,
    fieldConnection,
  );

  // Sort fields for the hierarchical selector view. Categories are sorted
  // separately in the tree.
  const sortedFields = React.useMemo(
    () =>
      fields.edges
        .slice()
        .sort((a, b) => a.node.name.localeCompare(b.node.name)),
    [fields],
  );

  const [hierarchy, setHierarchy] = React.useState<
    HierarchyItem<LinkedCategory | Field>,
  >(HierarchyItem.createRoot());

  const [
    fieldToSupportedDimensionsMap,
    setFieldToSupportedDimensionsMap,
  ] = React.useState<FieldToSupportedDimensionsMap>({});

  // Creates a category tree and a set of hidden categories. Hidden categories
  // may have child categories that aren't explicity hidden but implicitly should
  // be.
  const [categoryFilterTree, hiddenCategories] = React.useMemo(() => {
    const tree = new CategoryFilterTree();
    const hiddenParentCategories = new Set();
    const hiddenCategoriesSet = new Set();

    // Add categories to the tree first, since they form the branches that all
    // fields will connect to.
    categories.edges.forEach(({ node }) => {
      const { id, name, parent, visibilityStatus } = node;
      if (visibilityStatus === VISIBILITY_STATUS_MAP.hidden) {
        hiddenParentCategories.add(id);
      }
      tree.addCategory(id, name, parent ? parent.id : undefined);
    });

    // Recusively traverse children of a hidden category and add ids to a set of
    // hidden category ids.
    function traverseCategoryChildren(id: string): void {
      if (hiddenCategoriesSet.has(id)) {
        return;
      }
      hiddenCategoriesSet.add(id);
      const categoryItem = tree.getCategoryFilterItem(id);
      if (categoryItem === undefined || categoryItem.children.length === 0) {
        return;
      }
      categoryItem.children.forEach(child => {
        const { id: childId } = child;
        if (!hiddenCategoriesSet.has(childId)) {
          traverseCategoryChildren(childId);
        }
      });
    }

    hiddenParentCategories.forEach(traverseCategoryChildren);
    return [tree, hiddenCategoriesSet];
  }, [categories]);

  React.useEffect(() => {
    const cachedCategories = {};

    function buildLinkedCategory(id: string): LinkedCategory | void {
      if (cachedCategories[id] !== undefined) {
        return cachedCategories[id];
      }

      const item = categoryFilterTree.getCategoryFilterItem(id);
      // Return if the CategoryFilterTree doesn't have a category item for the id
      // or if the category is hidden.
      if (item === undefined || hiddenCategories.has(id)) {
        return undefined;
      }

      // NOTE(stephen): For now, we are ignoring categories that might have
      // multiple parents. This functionality has not yet been thought through.
      const parent = Array.from(item.parents)[0];

      const parentCategory =
        parent !== undefined ? buildLinkedCategory(parent.id) : undefined;

      const category = LinkedCategory.create({
        id: relayIdToDatabaseId(id),
        name: item.metadata.name(),
        parent: parentCategory,
      });
      cachedCategories[id] = category;
      return category;
    }

    const models = [];
    const fieldMap = {};
    const fieldDimensionMap = {};
    const fieldToCategory = {};
    sortedFields.forEach(({ node }) => {
      const {
        fieldCategoryMappings,
        fieldDimensionMappings,
        id,
        name,
        serializedCalculation,
        shortName,
      } = node;
      const dbId = relayIdToDatabaseId(id);

      // NOTE(stephen): Only using the first category and the first pipeline
      // datasource for now since that is what the original Field model could
      // support. Hopefully we can loosen these restrictions soon.
      const fieldCategoryMapping = fieldCategoryMappings[0];
      const category =
        fieldCategoryMappings.length > 0
          ? buildLinkedCategory(fieldCategoryMapping.category.id)
          : undefined;

      // If this field does not have a category mapping, it cannot be added to
      // the tree.
      if (category === undefined) {
        return;
      }

      const field = Field.UNSAFE_deserialize({
        calculation: serializedCalculation,
        canonicalName: name,
        id: dbId,
        shortName,
      });

      if (
        fieldCategoryMapping.visibilityStatus === VISIBILITY_STATUS_MAP.visible
      ) {
        fieldMap[dbId] = field;
        fieldToCategory[dbId] = category;
        models.push(field);
      }
      fieldDimensionMap[dbId] = fieldDimensionMappings.map(({ dimension }) =>
        relayIdToDatabaseId(dimension.id),
      );
    });

    setHierarchy(
      FieldHierarchyService.initializeFieldHierarchy(
        models,
        fieldMap,
        fieldToCategory,
        true,
      ),
    );

    setFieldToSupportedDimensionsMap(fieldDimensionMap);
  }, [categoryFilterTree, hiddenCategories, sortedFields]);

  // Update the most recently used fields section of the hierarchy tree.
  const trackItemSelected = React.useCallback(
    (item: HierarchyItem<Field>) =>
      setHierarchy(FieldHierarchyService.addSelectedItem(item)),
    [],
  );

  return [hierarchy, trackItemSelected, fieldToSupportedDimensionsMap];
}
