// @flow
/* eslint-disable no-use-before-define */
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import type {
  NamedItem,
  ShortNamedItem,
} from 'models/ui/HierarchicalSelector/types';

const ROOT = 'root';

type Values<T> = {
  +id: string,
  +metadata: T,
  +children?: Zen.Array<HierarchyItem<T>> | void,
};

export default class HierarchyItem<+T: NamedItem> {
  +_id: string;
  +_metadata: T;
  +_children: Zen.Array<HierarchyItem<T>> | void;

  static create<V: NamedItem>(vals: Values<V>): HierarchyItem<V> {
    return new HierarchyItem(vals);
  }

  /**
   * Use this function to create a root for a HierarchyItem tree.
   *
   * NOTE(pablo): this function is type-unsound, but this is intentional.
   * _Only_ the root item has undefined metadata, but we still treating it as
   * type `T` so that we can work with HierarchyItems a lot more easily. It
   * allows us to not have to constantly check all other children for void
   * metadata even though we know that'll never happen.
   */
  static createRoot<V: NamedItem>(): HierarchyItem<V> {
    return HierarchyItem.create({
      id: ROOT,
      children: Zen.Array.create(),

      // Allow undefined metadata only for the root (so we use $AllowAny
      // to let this happen). Read the note above for why.
      metadata: (undefined: $AllowAny),
    });
  }

  constructor({ id, metadata, children = undefined }: Values<T>): void {
    this._id = id;
    this._metadata = metadata;
    this._children = children;
  }

  id(): string {
    return this._id;
  }

  /* ::
  +metadata: (() => T) & (<V: NamedItem>(V) => HierarchyItem<T | V>);
  */
  metadata<V: NamedItem>(val?: V): HierarchyItem<T | V> | T {
    // getter
    if (arguments.length === 0) {
      return this._metadata;
    }

    // setter
    return new HierarchyItem(
      ({
        id: this._id,
        metadata: val,
        children: this._children,
      }: $AllowAny),
    );
  }

  /* ::
  +children: (
    (() => Zen.Array<HierarchyItem<T>> | void) &
    ((void) => HierarchyItem<T>) &
    (<V: NamedItem>(Zen.Array<HierarchyItem<V>>) => HierarchyItem<T | V>)
  );
  */
  children<V: NamedItem>(
    children?: Zen.Array<HierarchyItem<V>> | void,
  ): Zen.Array<HierarchyItem<T>> | void | HierarchyItem<T | V> {
    // getter
    if (arguments.length === 0) {
      return this._children;
    }

    // setter
    return new HierarchyItem(
      ({
        children,
        id: this._id,
        metadata: this._metadata,
      }: $AllowAny),
    );
  }

  name(): string {
    const metadata = this.metadata();
    invariant(
      metadata !== undefined,
      'Can only call HierarchyItem.name() if metadata is not undefined.',
    );
    return metadata.name();
  }

  shortName(): string {
    const metadata = this.metadata();
    invariant(
      metadata !== undefined,
      'Can only call HierarchyItem.name() if metadata is not undefined.',
    );

    // $FlowExpectedError[prop-missing]: this is not type-safe, but safe in practice and the only way we have to refine an interface
    if (typeof metadata.shortName === 'function') {
      return ((metadata: $Cast): ShortNamedItem).shortName();
    }

    return this.name();
  }

  hasChild<V: NamedItem>(hierarchyItem: HierarchyItem<V>): boolean {
    const id = hierarchyItem.id();
    const children = this.children();
    return children === undefined
      ? false
      : children.some(item => item.id() === id);
  }

  addChild<V: NamedItem>(
    hierarchyItem: HierarchyItem<V>,
    prepend?: boolean = false,
  ): HierarchyItem<T | V> {
    const children = this.children();
    if (children === undefined) {
      return this.children(Zen.Array.create([hierarchyItem]));
    }
    const newChildren: Zen.Array<HierarchyItem<T | V>> = ((prepend
      ? children.unshift(hierarchyItem)
      : children.push(hierarchyItem)): $Cast);
    return this.children(newChildren);
  }

  updateChild<V: NamedItem>(
    hierarchyItem: HierarchyItem<V>,
  ): HierarchyItem<T | V> {
    const idToAdd = hierarchyItem.id();
    const children = this.children();
    if (children) {
      const idx = children.findIndex(item => item.id() === idToAdd);
      if (idx !== -1) {
        const newChildren = children.set(idx, hierarchyItem);
        return this.children(newChildren);
      }
    }
    throw new Error(
      '[HierarchyItem] cannot update hierarchyItem because it does not exist',
    );
  }

  isHierarchyRoot(): boolean {
    return this.id() === ROOT;
  }

  isCategoryItem(): boolean {
    return this.children() instanceof Zen.Array;
  }

  isLeafItem(): boolean {
    return this.children() === undefined;
  }

  /**
   * Recusively search for a child hierarchy item with the given id.
   */
  findItemById(id: string): HierarchyItem<T> | void {
    if (this.id() === id) {
      return this;
    }

    const children = this.children();
    return children
      ? children.reduce((res, childItem) => res || childItem.findItemById(id))
      : undefined;
  }

  isChildrenEmpty(): boolean {
    const children = this.children();
    return !children || children.isEmpty();
  }
}
