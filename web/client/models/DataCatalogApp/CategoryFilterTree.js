// @flow
// eslint-disable-next-line max-classes-per-file
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';

export type CategoryFilterItem = {
  id: string,
  name: () => string,
  shortName: () => string,
};

/**
 * Mutable HierarchyItem that we use to build the immutable tree from. Supports
 * filtering out branches of the tree that do *not* have any Fields in them.
 */
export class MutableHierarchyFilterItem {
  +id: string;
  +leaf: boolean;
  +children: Array<MutableHierarchyFilterItem> = [];
  +parents: Set<MutableHierarchyFilterItem> = new Set();
  immutableItem: HierarchyItem<CategoryFilterItem> | void = undefined;
  metadata: CategoryFilterItem;

  constructor(
    id: string,
    name: string = '',
    shortName: string = '',
    leaf: boolean = false,
  ) {
    this.id = id;
    this.leaf = leaf;
    this.updateMetadata(name, shortName);
  }

  checkNotImmutable() {
    if (this.immutableItem !== undefined) {
      throw new Error(
        '[MutableHierarchyFilterItem] Attempting to mutate after finalizing node.',
      );
    }
  }

  updateMetadata(name: string, shortName: string) {
    this.checkNotImmutable();
    this.metadata = {
      id: this.id,
      name: () => name,
      shortName: () => shortName,
    };
  }

  addParent(parent: MutableHierarchyFilterItem) {
    this.checkNotImmutable();
    parent.children.push(this);
    this.parents.add(parent);
  }

  finalize(): HierarchyItem<CategoryFilterItem> | void {
    // Build the immutable HierarchyItem that represents this branch. Filter out
    // any branches that do *not* have field children. Examples include
    // "Geography".
    if (this.immutableItem === undefined) {
      const children = [];
      this.children.forEach(child => {
        const result = child.finalize();
        if (result !== undefined) {
          children.push(result);
        }
      });

      this.immutableItem = HierarchyItem.create({
        id: this.id,
        children: !this.leaf ? Zen.Array.create(children) : undefined,
        metadata: this.metadata,
      });
    }

    return this.immutableItem;
  }
}

export default class CategoryFilterTree {
  categoryMap: Map<string, MutableHierarchyFilterItem> = new Map();
  rootChildren: Array<MutableHierarchyFilterItem> = [];

  linkParentCategories(
    item: MutableHierarchyFilterItem,
    parentIds: $ReadOnlyArray<string>,
  ): void {
    parentIds.forEach(parentId => {
      let parent = this.categoryMap.get(parentId);

      // To avoid needing to topologically sort the parent category relationship
      // to guarantee that all parent categories have already been created, we
      // create an empty category whenever a parent is found that has not yet
      // been created.
      // NOTE(stephen): This assumes that the relationships defined in the
      // database are valid, and that all categories will eventually be
      // processed.
      if (parent === undefined) {
        parent = new MutableHierarchyFilterItem(parentId);
        this.categoryMap.set(parentId, parent);
      }
      item.addParent(parent);
    });
  }

  /**
   * Add a category to the tree as a child of the parent category provided. If
   * no parent category exists, this category will be attached to the root of
   * the tree.
   */
  addCategory(id: string, name: string, parentId: string | void): void {
    // Check to see if this category ID was already referenced as the parent
    // of a different category. If so, update the existing node to have the
    // correct metadata. Otherwise, create a new category.
    let item = this.categoryMap.get(id);
    if (item !== undefined) {
      item.updateMetadata(name, name);
    } else {
      item = new MutableHierarchyFilterItem(id, name, name);
      this.categoryMap.set(id, item);
    }

    if (parentId === undefined) {
      this.rootChildren.push(item);
    } else {
      this.linkParentCategories(item, [parentId]);
    }
  }

  /**
   * Add a new field to the tree as a leaf node of the parent categories
   * provided.
   */
  addField(
    id: string,
    name: string,
    shortName: string,
    parentIds: $ReadOnlyArray<string>,
  ): void {
    const item = new MutableHierarchyFilterItem(id, name, shortName, true);
    this.linkParentCategories(item, parentIds);
  }

  getCategoryFilterItem(categoryId: string): MutableHierarchyFilterItem | void {
    return this.categoryMap.get(categoryId);
  }

  /**
   * Build a list of CategoryFilterItems containing the parent hierarchy of
   * the provided category ID.
   */
  getCategoryPath(
    categoryId: string,
  ): $ReadOnlyArray<$ReadOnly<CategoryFilterItem>> {
    const output = [];

    const buildPath = (id: string) => {
      const item = this.categoryMap.get(id);
      if (item === undefined) {
        return;
      }

      output.push(item.metadata);
      if (item.parents.size === 0) {
        output.reverse();
        return;
      }
      // NOTE(stephen): Categories can only have one parent.
      const parent = Array.from(item.parents)[0];
      buildPath(parent.id);
    };
    buildPath(categoryId);
    return output;
  }

  /**
   * Produce an immutable HierarchyItem root node that points to categories that
   * will eventually end with fields.
   */
  finalize(): HierarchyItem<CategoryFilterItem> {
    const finalizedRootChildren = [];
    this.rootChildren.forEach(child => {
      const item = child.finalize();
      if (item !== undefined) {
        finalizedRootChildren.push(item);
      }
    });

    invariant(
      finalizedRootChildren.length === 1,
      'Somehow have an incompatible category tree',
    );

    const hierarchyRoot = finalizedRootChildren[0];

    // HACK(stephen): The `HierarchyItem` model has a very restricted definition
    // of what can be a `root` item without any way to override it. For
    // simplicity, we're just overriding the method here instead of creating a
    // child class.
    // $FlowExpectedError[cannot-write]
    hierarchyRoot.isHierarchyRoot = () => true;
    return hierarchyRoot;
  }
}
