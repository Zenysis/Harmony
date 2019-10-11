// @flow
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import ZenArray from 'util/ZenModel/ZenArray';

/**
 * The MutableHierarchyItem is used to efficiently build a HierarchyTree without
 * the cost and complexity of an immutable ZenModel HierarchyItem. When the tree
 * is finished being built, it will call `finalize()` on the
 * MutableHierarchyItem to produce an immutable HierarchyItem. Once `finalize`
 * has been called, you can no longer mutate the MutableHierarchyItem instance.
 * Subsequent calls to `finalize` will return the same immutable instance.
 */
export default class MutableHierarchyItem {
  +id: string;
  +children: Array<MutableHierarchyItem>;
  +metadata: any;
  immutableItem: HierarchyItem | void = undefined;

  constructor(
    id: string,
    children: Array<MutableHierarchyItem> = [],
    metadata: any = undefined,
  ) {
    this.id = id;
    this.children = children;
    this.metadata = metadata;
  }

  addChild(child: MutableHierarchyItem): void {
    if (this.immutableItem !== undefined) {
      throw new Error(
        '[MutableHierarchyItem] Attempting to add child to finalized node.',
      );
    }

    this.children.push(child);
  }

  finalize(): HierarchyItem {
    if (this.immutableItem === undefined) {
      // Dont set children if none exist.
      const children = this.children.length > 0
        ? ZenArray.create(this.children.map(child => child.finalize()))
        : undefined;

      this.immutableItem = HierarchyItem.create({
        id: this.id,
        children,
        metadata: this.metadata,
      });
    }
    return this.immutableItem;
  }
}
