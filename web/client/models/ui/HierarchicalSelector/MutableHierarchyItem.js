// @flow
import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

/**
 * The MutableHierarchyItem is used to efficiently build a HierarchyTree without
 * the cost and complexity of an immutable ZenModel HierarchyItem. When the tree
 * is finished being built, it will call `finalize()` on the
 * MutableHierarchyItem to produce an immutable HierarchyItem. Once `finalize`
 * has been called, you can no longer mutate the MutableHierarchyItem instance.
 * Subsequent calls to `finalize` will return the same immutable instance.
 */
export default class MutableHierarchyItem<T: NamedItem> {
  +id: string;
  +children: Array<MutableHierarchyItem<T>>;
  +metadata: T;
  immutableItem: HierarchyItem<T> | void = undefined;

  constructor(
    id: string,
    children: Array<MutableHierarchyItem<T>> = [],
    metadata: any = undefined,
  ) {
    this.id = id;
    this.children = children;
    this.metadata = metadata;
  }

  addChild(child: MutableHierarchyItem<T>): void {
    if (this.immutableItem !== undefined) {
      throw new Error(
        '[MutableHierarchyItem] Attempting to add child to finalized node.',
      );
    }

    this.children.push(child);
  }

  finalize(sortChildren: boolean = false): HierarchyItem<T> {
    if (this.immutableItem === undefined) {
      // Dont set children if none exist.
      const maybeSortedChildren = sortChildren
        ? this.children.sort((a, b) => {
            if (a.metadata.tag === b.metadata.tag) {
              return a.metadata.name().localeCompare(b.metadata.name());
            }
            if (a.metadata.tag === 'LINKED_CATEGORY') {
              return -1;
            }
            return 1;
          })
        : this.children;

      const finalChildren =
        maybeSortedChildren.length > 0
          ? Zen.Array.create(
              maybeSortedChildren.map(child => child.finalize(sortChildren)),
            )
          : undefined;

      this.immutableItem = HierarchyItem.create({
        id: this.id,
        children: finalChildren,
        metadata: this.metadata,
      });
    }
    return this.immutableItem;
  }
}
