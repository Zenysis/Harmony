// @flow
import * as Zen from 'lib/Zen';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
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
    SearchableNodeView<
      string,
      string,
      HierarchyItem<NamedItem>,
      Zen.Array<HierarchyItem<NamedItem>>,
    > {
  forEach(
    children: Zen.Array<HierarchyItem<NamedItem>>,
    func: (HierarchyItem<NamedItem>) => mixed,
  ): void {
    children.forEach(func);
  }

  isLeaf(item: HierarchyItem<NamedItem>): boolean {
    return item.children() === undefined;
  }

  children<T: NamedItem>(item: HierarchyItem<T>): ?Zen.Array<HierarchyItem<T>> {
    return item.children();
  }

  searchableText(item: HierarchyItem<NamedItem>): string {
    return item.name();
  }

  value(item: HierarchyItem<NamedItem>): string {
    return item.id();
  }
}

export default (new HierarchyItemGraphNodeView(): HierarchyItemGraphNodeView);
