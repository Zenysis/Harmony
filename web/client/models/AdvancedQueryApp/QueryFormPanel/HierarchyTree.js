// @flow
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import MutableHierarchyItem from 'models/ui/HierarchicalSelector/MutableHierarchyItem';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type Dimension from 'models/core/wip/Dimension';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type Field from 'models/core/wip/Field';
import type Granularity from 'models/core/wip/Granularity';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

/**
 * HierarchyTree is a *mutable* model. It is not intended to be passed around
 * React components, but is instead a helper model to easily take flattened
 * arrays of HierarchyItems and generate a tree.
 *
 * Once the tree is created we can take the root of this model (which is an
 * immutable HierarchyItem) and use that in our React components.
 *
 */

const ROOT_ID = 'root';

export default class HierarchyTree<T: NamedItem> {
  cache: { [string]: MutableHierarchyItem<T>, ... } = {
    [ROOT_ID]: new MutableHierarchyItem(ROOT_ID),
  };

  _finalized: boolean = true;

  finalize(sortValues: boolean = false): HierarchyItem<LinkedCategory | T> {
    Object.keys(this.cache).forEach((key: string) => {
      const item = this.cache[key];
      item.finalize(sortValues);
    });
    this._finalized = false;
    return this.cache[ROOT_ID].finalize(sortValues);
  }

  add(item: MutableHierarchyItem<T>, parent?: LinkedCategory | void): void {
    if (!this._finalized) {
      throw new Error(
        '[HierarchyTree] Attempting to add nodes to a completed tree.',
      );
    }

    const itemId = item.id;
    if (this.cache[itemId]) {
      throw new Error(
        `[HierarchyTree] Attempting to add duplicate node to tree: ${itemId}`,
      );
    }
    this.cache[itemId] = item;

    let currNode = item;
    let parentCategory = parent;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // If this node has no parent category, we should attach this to the root
      // of the tree
      if (parentCategory === undefined) {
        this.cache[ROOT_ID].addChild(currNode);
        break;
      }

      // If the parent category is already in the cache, attach the current
      // node to it as a child
      const parentId = parentCategory.id();
      if (this.cache[parentId]) {
        this.cache[parentId].addChild(currNode);
        break;
      }

      // The parent category is not in the cache, so let's make it into a
      // node in the tree
      this.cache[parentId] = new MutableHierarchyItem(
        parentId,
        [currNode],
        parentCategory,
      );

      // Store this new node as the current node, and now process its parent
      currNode = this.cache[parentId];
      parentCategory = parentCategory.parent();
    }
  }
}

export function buildFieldHierarchy(
  fields: $ReadOnlyArray<Field>,
  fieldCategoryMapping: { +[fieldId: string]: LinkedCategory },
  sortValues: boolean = false,
): HierarchyItem<LinkedCategory | Field> {
  const tree = new HierarchyTree();
  fields.forEach(field => {
    const category = fieldCategoryMapping[field.id()];
    if (category !== undefined) {
      tree.add(new MutableHierarchyItem(field.id(), [], field), category);
    }
  });
  return tree.finalize(sortValues);
}

export function buildDimensionHierarchy(
  dimensions: $ReadOnlyArray<Dimension>,
  flattenHierarchy?: boolean = false,
): HierarchyItem<LinkedCategory | Dimension> {
  const tree = new HierarchyTree();
  dimensions.forEach(dimension => {
    tree.add(
      new MutableHierarchyItem(dimension.id(), [], dimension),
      flattenHierarchy ? undefined : dimension.category(),
    );
  });
  return tree.finalize();
}

export function buildDimensionValueHierarchy(
  dimensionsToInclude: $ReadOnlyArray<Dimension>,
  dimensionValues: $ReadOnlyArray<DimensionValue>,
): HierarchyItem<LinkedCategory | DimensionValue> {
  const tree = new HierarchyTree<DimensionValue>();

  const dimensionIds = dimensionsToInclude.map(dimension => dimension.id());

  dimensionValues.forEach(dimensionValue => {
    const dimensionId = dimensionValue.dimension();
    if (dimensionIds.includes(dimensionId)) {
      const parentDimensionCategory = LinkedCategory.create({
        id: dimensionId,
        name: getFullDimensionName(dimensionId),
      });
      tree.add(
        new MutableHierarchyItem(dimensionValue.id(), [], dimensionValue),
        parentDimensionCategory,
      );
    }
  });

  return tree.finalize();
}

export function buildGroupingHierarchy(
  dimensions: $ReadOnlyArray<Dimension>,
  granularities: $ReadOnlyArray<Granularity>,
): HierarchyItem<LinkedCategory | GroupingDimension | GroupingGranularity> {
  const tree = new HierarchyTree();
  dimensions.forEach(dimension =>
    tree.add(
      new MutableHierarchyItem(
        dimension.id(),
        [],
        GroupingDimension.create({
          dimension: dimension.id(),
          name: dimension.name(),
        }),
      ),
      dimension.category(),
    ),
  );
  granularities.forEach(granularity =>
    tree.add(
      new MutableHierarchyItem(
        granularity.id(),
        [],
        GroupingGranularity.createFromGranularity(granularity),
      ),
      granularity.category(),
    ),
  );
  return tree.finalize();
}
