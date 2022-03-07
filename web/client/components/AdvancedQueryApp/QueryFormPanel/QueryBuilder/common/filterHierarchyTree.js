// @flow
import * as Zen from 'lib/Zen';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import { NamedItem } from 'models/ui/HierarchicalSelector/types';

// Recursively filter all children attached to this node baesd on the provided
// test. If all children should be included, return the node unmodified.
function recursiveFilterHierarchyItems<T: NamedItem>(
  node: HierarchyItem<T> | void,
  shouldIncludeItem: (HierarchyItem<T>) => boolean,
): HierarchyItem<T> | void {
  if (node === undefined) {
    return undefined;
  }

  const originalChildren = node.children();

  // NOTE(stephen): We don't need to test if this node should be included
  // because the filter action was tested by our parent.
  if (originalChildren === undefined) {
    return node;
  }

  const newChildren = [];
  let childrenFiltered = false;
  originalChildren.forEach(child => {
    if (!shouldIncludeItem(child)) {
      childrenFiltered = true;
      return;
    }

    const newChild = recursiveFilterHierarchyItems(child, shouldIncludeItem);

    // If the new child previously had children and no longer has children, the
    // new child will be `undefined`.
    if (newChild === undefined) {
      childrenFiltered = true;
      return;
    }

    newChildren.push(newChild);
    if (newChild !== child) {
      childrenFiltered = true;
    }
  });

  // Levels that previously had children will be removed if all their children
  // are filtered out. We do not allow empty category levels.
  if (newChildren.length === 0) {
    return undefined;
  }

  return childrenFiltered ? node.children(Zen.Array.create(newChildren)) : node;
}

// Filter the hierarchy tree by applying the `shouldIncludeItem` test to all
// children. If a child is filtered out, all its children will also be removed
// from the tree. This method preserves the initial ordering of items within the
// tree.
export default function filterHierarchyTree<T: NamedItem>(
  hierarchyRoot: HierarchyItem<T>,
  shouldIncludeItem: (HierarchyItem<T>) => boolean,
): HierarchyItem<T> {
  const newRoot = recursiveFilterHierarchyItems(
    hierarchyRoot,
    shouldIncludeItem,
  );

  // The new root will only be undefined if every single child was filtered out.
  // If this happens, unset all children on the root and return it.
  if (newRoot === undefined) {
    return hierarchyRoot.children(Zen.Array.create());
  }

  return newRoot;
}
