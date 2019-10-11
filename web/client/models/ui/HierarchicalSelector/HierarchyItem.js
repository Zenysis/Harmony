// @flow
import PropTypes from 'prop-types';

import ZenArray from 'util/ZenModel/ZenArray';
import ZenModel, { def } from 'util/ZenModel';
import ZenPropTypes from 'util/ZenPropTypes';

const ROOT = 'root';

export default class HierarchyItem extends ZenModel.withTypes({
  id: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),
  children: def(ZenPropTypes.eval(() => ZenArray.of(HierarchyItem)), undefined),

  // Class should implement NamedItem or ShortNamedItem.
  metadata: def(PropTypes.any, undefined),
}) {
  static createRoot(): HierarchyItem {
    return new HierarchyItem({
      id: ROOT,
      children: ZenArray.create(),
    });
  }

  // TODO(pablo): add name() and shortName() as derived values on the model
  name(): string {
    return this.metadata().name();
  }

  shortName(): string {
    // If no short name is defined, return the base name
    if (typeof this.metadata().shortName !== 'function') {
      return this.name();
    }

    return this.metadata().shortName();
  }

  hasChild(hierarchyItem: HierarchyItem): HierarchyItem {
    const id = hierarchyItem.id();
    return this.children().some(item => item.id() === id);
  }

  addChild(
    hierarchyItem: HierarchyItem,
    prepend?: boolean = false,
  ): HierarchyItem {
    return prepend
      ? this.deepUpdate()
          .children()
          .unshift(hierarchyItem)
      : this.deepUpdate()
          .children()
          .push(hierarchyItem);
  }

  updateChild(hierarchyItem: HierarchyItem): HierarchyItem {
    const idToAdd = hierarchyItem.id();
    const idx = this.children().findIndex(item => item.id() === idToAdd);
    if (idx !== -1) {
      return this.deepUpdate()
        .children()
        .set(idx, hierarchyItem);
    }
    throw new Error(
      '[HierarchyItem] cannot update hierarchyItem because it does not exist',
    );
  }

  isHierarchyRoot(): boolean {
    return this.id() === ROOT;
  }

  isCategoryItem(): boolean {
    return this.children() instanceof ZenArray;
  }

  isLeafItem(): boolean {
    return this.children() === undefined;
  }

  /**
   * Recusively search for a child hierarchy item with the given id.
   */
  findItemById(id: string): HierarchyItem | void {
    if (this.id() === id) {
      return this;
    }

    if (this.isLeafItem()) {
      return undefined;
    }

    return this.children().reduce(
      (result, childItem) => result || childItem.findItemById(id),
    );
  }
}
