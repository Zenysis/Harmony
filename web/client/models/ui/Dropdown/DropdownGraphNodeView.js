// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import type { DropdownChildType } from 'components/ui/Dropdown/types';
import type { SearchableNodeView } from 'models/ui/common/GraphSearchResults/types';

type Children<T> = React.ChildrenArray<?DropdownChildType<T>>;

/**
 * This is a view around a DropdownChildType (which is either an Option or an
 * OptionsGroup) that can be used with a GraphIterator. This provides an
 * easier way to iterate over a Dropdown option tree.
 *
 * This class also implements a SearchableNodeView interface so that its
 * iterator can work with the `deepSearch` function in GraphSearchResults.
 *
 */
export default class DropdownGraphNodeView<T>
  implements SearchableNodeView<string, T, DropdownChildType<T>, Children<T>> {
  forEach(children: Children<T>, func: (DropdownChildType<T>) => mixed): void {
    React.Children.forEach(children, (node: ?DropdownChildType<T>) => {
      // only process non-null and non-void nodes
      if (node !== undefined && node !== null) {
        func(node);
      }
    });
  }

  isLeaf(node: DropdownChildType<T>): boolean {
    return node ? node.type !== Dropdown.OptionsGroup : false;
  }

  children(node: DropdownChildType<T>): ?Children<T> {
    if (node && node.type === Dropdown.OptionsGroup) {
      const optGroup: React.Element<
        Class<Dropdown.OptionsGroup<T>>,
      > = (node: $Cast);
      return optGroup.props.children;
    }
    return undefined;
  }

  searchableText(node: DropdownChildType<T>): string {
    return node.props.searchableText;
  }

  value(node: DropdownChildType<T>): string | T {
    if (node.type === Dropdown.OptionsGroup) {
      const optGroup: React.Element<
        Class<Dropdown.OptionsGroup<T>>,
      > = (node: $Cast);
      return optGroup.props.id;
    }
    const option: React.Element<Class<Dropdown.Option<T>>> = (node: $Cast);
    return option.props.value;
  }
}
