// @flow
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type ZenArray from 'util/ZenModel/ZenArray';
import type { SearchableNodeView } from 'models/ui/common/GraphSearchResults/types';

/**
 * This is a singleton class that provides a view around a HierarchyItem to
 * use with a GraphIterator. This provides an easier way to iterate over a
 * HierarchyItem tree.
 *
 * This class implements a SearchableNodeView interface so that its iterator
 * can work with the `deepSearch` function in GraphSearchResults.
 */
class HierarchyItemGraphNodeView
  implements
    SearchableNodeView<string, string, HierarchyItem, ZenArray<HierarchyItem>> {
  forEach(
    children: ZenArray<HierarchyItem>,
    func: HierarchyItem => mixed,
  ): void {
    children.forEach(func);
  }

  isLeaf(item: HierarchyItem): boolean {
    return item.isLeafItem();
  }

  children(item: HierarchyItem): ?ZenArray<HierarchyItem> {
    return item.children();
  }

  searchableText(item: HierarchyItem): string {
    return item.name();
  }

  value(item: HierarchyItem): string {
    return item.id();
  }
}

export default new HierarchyItemGraphNodeView();
