// @flow
import PropTypes from 'prop-types';

import ZenCollection from 'util/ZenModel/ZenCollection';
import ZenMap from 'util/ZenModel/ZenMap';
import override from 'decorators/override';
import { convertZenModels } from 'util/ZenModel';
import { range } from 'util/util';
import type { Comparator } from 'types/jsCore';

/**
 * ZenArray is an immutable wrapper around a JS array.
 * It can be used as a prop type in other models and React components.
 * You should always use ZenArray with Flow types.
 *
 * NOTE(pablo): Read the comment in ZenCollections for a note on performance.
 * NOTE(pablo): Do not extend ZenArray. Type annotations are not guaranteed
 * to be correct if you do that.
 *
 * Specifying as a prop in a component:
 *   import * as Zen from 'lib/Zen';
 *   type Props = {
 *     fields: Zen.Array<Field>,
 *     fieldIds: Zen.Array<string>,
 *   }
 *
 * Specifying as a value type in a ZenModel *without* flow:
 *   class SomeModel extends ZenModel.withTypes({
 *     fields: def(Zen.Array.of(Field).isRequired),
 *
 *     fieldIds: def(Zen.Array.of(PropTypes.string)),
 *   });
 *
 * ZenArrays support all of the operations you'd expect in a normal array,
 * except that they are all immutable (meaning things like sort() and reverse()
 * will return a new instance of ZenArray).
 *
 * Examples:
 *   import * as Zen from 'lib/Zen';
 *   const fields: Zen.Array<Field> = Zen.Array.create(fields);
 *   const ids: Zen.Array<string> = fields.pull('id');
 *   const newFields: Zen.Array<Field> = fields.push(newField);
 */

type IterationCallback<T, R> = (
  value: T,
  idx: number,
  arr: $ReadOnlyArray<T>,
) => R;

export default class ZenArray<T> extends ZenCollection<$ReadOnlyArray<T>, T>
  implements Iterable<T> {
  // Stub out Iterable interface requirements. We properly provide
  // [Symbol.iterator] below, but Flow does not detect this properly.
  // TODO(stephen): Sometimes the flow-parser that prettier uses will strip this
  // comment line out.
  /* ::
  @@iterator: () => Iterator<T>;
  */

  // HACK(stephen): Babel has an error where Symbol.iterator will be improperly
  // compiled. Tell flow these properties are defined and fix this when the
  // issue is landed. https://github.com/babel/babel/issues/7705
  /* ::
  _cache: Set<T> | void = undefined;
  */

  static create<V>(values: $ReadOnlyArray<V> | ZenArray<V> = []): ZenArray<V> {
    if (values instanceof ZenArray) {
      return new ZenArray(values._values);
    }
    return new ZenArray(values);
  }

  /**
   * Return a ZenArray of numbers from start to end.
   * If only a single argument is passed, this argument is used as the end, and
   * start is 0.
   * Example:
   *   range(5): [0, 1, 2, 3, 4]
   *   range(1, 6): [1, 2, 3, 4, 5]
   */
  static range(start: number, end?: number): ZenArray<T> {
    return new ZenArray(range(start, end));
  }

  static fromZenMap(zenMap: ZenMap<T>): ZenArray<T> {
    return new ZenArray(zenMap.values());
  }

  @override
  static baseCollectionType(): $PropertyType<ReactPropTypes, 'arrayOf'> {
    return (PropTypes.arrayOf: any);
  }

  constructor(values: $ReadOnlyArray<T> = []): void {
    super(values);
    this._cache = undefined;
    this._validate();
  }

  /**
   * ZenArray is an iterable element, meaning that you can do:
   *   const plainArray = Array.from(zenArray);
   *   const set = new Set(zenArray);
   *   for (let model of zenArray) { }
   */
  // $FlowIssue: Flow doesn't support computed property keys
  [Symbol.iterator]() {
    return this._values[Symbol.iterator]();
  }

  @override
  serialize(): Array<mixed> {
    return convertZenModels(this._values);
  }

  /**
   * Return the wrapped array and clone it. This is a shallow conversion and
   * is an O(n) operation.
   */
  toArray(): Array<T> {
    return [...this._values];
  }

  /**
   * Return the wrapped array. This is an O(1) operation that just returns
   * the wrapped collection, it does not clone it.
   */
  arrayView(): $ReadOnlyArray<T> {
    return this._values;
  }

  /**
   * Return the first element of the array
   */
  first(): T {
    return this.get(0);
  }

  /**
   * Return the last element of the array
   */
  last(): T {
    return this.get(this.size() - 1);
  }

  /**
   * Return all elements except the first one
   */
  tail(): ZenArray<T> {
    return this.slice(1);
  }

  size(): number {
    return this._values.length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  clear(): ZenArray<T> {
    return new ZenArray([]);
  }

  push(newEntry: T): ZenArray<T> {
    return new ZenArray([...this._values, newEntry]);
  }

  concat(...newEntries: Array<T | Array<T> | ZenArray<T>>): ZenArray<T> {
    const entries = newEntries.map(item =>
      item instanceof ZenArray ? item._values : item,
    );

    return new ZenArray(this._values.concat(...entries));
  }

  /**
   * pop() removes the last element of the ZenArray, and returns both the
   * new ZenArray and the removed element (as opposed to the JS Array
   * implementation which is mutable and only has to return the removed element)
   *
   * @return Array [ZenArray, removedElement]
   */
  pop(): [ZenArray<T>, T | void] {
    const removedElement =
      this._values.length === 0
        ? undefined
        : this._values[this._values.length - 1];
    const newZenArray = new ZenArray(this._values.slice(0, -1));
    return [newZenArray, removedElement];
  }

  /**
   * shift() removes the first element of the ZenArray, and returns both the
   * new ZenArray and the removed element (as opposed to the JS Array
   * implementation which is mutable and only has to return the removed element)
   *
   * @return Array [ZenArray, removedElement]
   */
  shift(): [ZenArray<T>, T | void] {
    const removedElement =
      this._values.length === 0 ? undefined : this._values[0];
    const newZenArray = new ZenArray(this._values.slice(1));
    return [newZenArray, removedElement];
  }

  /**
   * Insert `newEntry` into the beginning of the array.
   */
  unshift(newEntry: T): ZenArray<T> {
    return new ZenArray([newEntry, ...this._values]);
  }

  sort(compareFunction: Comparator<T, T>): ZenArray<T> {
    return new ZenArray([...this._values].sort(compareFunction));
  }

  reverse(): ZenArray<T> {
    return new ZenArray([...this._values].reverse());
  }

  slice(begin?: number, end?: number): ZenArray<T> {
    return new ZenArray(this._values.slice(begin, end));
  }

  splice(start: number, deleteCount?: number, ...items: Array<T>): ZenArray<T> {
    return new ZenArray([
      ...this._values.slice(0, start),
      ...items,
      ...this._values.slice(start + deleteCount),
    ]);
  }

  /**
   * Insert `item` at `index` such that in the new returned array,
   * the inserted item's index will be `index`.
   */
  insertAt(index: number, item: T): ZenArray<T> {
    return this.splice(index, 0, item);
  }

  delete(idx: number): ZenArray<T> {
    const vals = this._values;
    if (idx < 0 || idx >= vals.length) {
      throw new Error(
        `[ZenArray] index out of bounds in ZenArray delete function`,
      );
    }
    return new ZenArray(vals.slice(0, idx).concat(vals.slice(idx + 1)));
  }

  set(idx: number, value: T): ZenArray<T> {
    return this.splice(idx, 1, value);
  }

  /**
   * Update element at an index with an updater function:
   *   arr.apply(idx, model => model.label('something'));
   */
  apply(idx: number, fn: T => T): ZenArray<T> {
    return this.set(idx, fn(this.get(idx)));
  }

  get(idx: number): T {
    return this._values[idx];
  }

  fill(value: T, start?: number, end?: number): ZenArray<T> {
    return new ZenArray([...this._values].fill(value, start, end));
  }

  includes(item: T): boolean {
    if (this._cache === undefined) {
      this._cache = new Set(this._values);
    }
    return this._cache.has(item);
  }

  indexOf(item: T, fromIndex?: number): number {
    return this._values.indexOf(item, fromIndex);
  }

  join(separator?: string): string {
    return this._values.join(separator);
  }

  /**
   * Flatten a ZenArray of Arrays or ZenArrays.
   * NOTE: Use this function (and flatMap) only when you feel confident of the
   * return types.
   *
   * There is no good way to represent nested arrays of variable depths and
   * types without running into type-check issues
   * (https://github.com/facebook/flow/issues/2562)
   * So the * operator is needed to make this work, but this makes us lose
   * type safety.
   */
  flatten(): ZenArray<*> {
    return this.reduce((acc, val) => acc.concat(val), ZenArray.create());
  }

  forEach(func: IterationCallback<T, mixed>, thisArg?: ?Object): void {
    this._values.forEach(func, thisArg);
  }

  /**
   * 'pull' will return a new ZenArray where every item has had funcName
   * called on it. It is ideal for ZenArrays of ZenModels.
   * If you want to cast your returned ZenArray to a specific subclass of
   * ZenArray, then pass the class as the ArrayClass argument.
   *
   * NOTE: Use this function only when you know what the return types are.
   * This function is not type-safe, because there's no way Flow can know
   * what the type extracted from the funcName will be.
   *
   * Example:
   *   const fieldIds = fields.pull('id');
   *   This is equivalent to:
   *     const fieldIds = fields.map(field => field.id());
   */
  pull(
    funcName: string,
    ArrayClass?: typeof ZenArray = ZenArray,
  ): ZenArray<any> {
    return this.map(model => {
      if (model === null || model === undefined) {
        return model;
      }
      // $FlowIndexerIssue: Flow can't index into generic type T
      const func = model[funcName];
      if (typeof func === 'function') {
        return func.call(model);
      }
      throw new Error(
        '[ZenArray] attempting to pull a property that is not a callable function',
      );
    }, ArrayClass);
  }

  filter(func: IterationCallback<T, boolean>, thisArg?: ?Object): ZenArray<T> {
    return new ZenArray(this._values.filter(func, thisArg));
  }

  filterInstance<M>(Model: Class<M>): ZenArray<M> {
    return ((this.filter(val => val instanceof Model): any): ZenArray<M>);
  }

  find(func: IterationCallback<T, boolean>, thisArg?: ?Object): T | void {
    return this._values.find(func, thisArg);
  }

  findIndex(func: IterationCallback<T, boolean>, thisArg?: ?Object): number {
    return this._values.findIndex(func, thisArg);
  }

  /**
   * Find the first element that returns truthy when `func` is applied,
   * then delete it from the ZenArray. If no element was found, return
   * the unmodified ZenArray.
   */
  findAndDelete(
    func: IterationCallback<T, boolean>,
    thisArg?: ?Object,
  ): ZenArray<T> {
    const idx = this.findIndex(func, thisArg);
    if (idx < 0 || idx >= this.size()) {
      return this;
    }
    return this.delete(this.findIndex(func, thisArg));
  }

  some(func: IterationCallback<T, boolean>, thisArg?: ?Object): boolean {
    return this._values.some(func, thisArg);
  }

  every(func: IterationCallback<T, boolean>, thisArg?: ?Object): boolean {
    return this._values.every(func, thisArg);
  }

  reduce<V>(
    func: (accumulator: V, value: T, idx: number, arr: $ReadOnlyArray<T>) => V,
    initialValue: V,
  ): V {
    return this._values.reduce(func, initialValue);
  }

  /**
   * Map all values in the ZenArray to func(value)
   * The values can potentially be of any type, so by default the returned
   * ZenArray will be of the base ZenArray class. If you wanted to cast to
   * a specific custom subclass, pass it as the ArrayClass parameter.
   * @return ZenArray
   */
  map<V>(
    func: IterationCallback<T, V>,
    ArrayClass?: typeof ZenArray = ZenArray,
    thisArg?: ?Object,
  ): ZenArray<V> {
    return ArrayClass.create(this._values.map(func, thisArg));
  }

  /**
   * Behaves exactly like 'map', except it returns a JS array
   * instead of a new ZenArray instance.
   */
  mapValues<V>(func: IterationCallback<T, V>, thisArg?: ?Object): Array<V> {
    return this._values.map(func, thisArg);
  }

  /**
   * flatMap is ideal for cases when you have a map function that returns
   * an Array or ZenArray of values, and you need it immediately flattened.
   * This is inspired from JavaScript's experimental flatMap function.
   *
   * NOTE: use this function only when you feel confident of the return types.
   * Read comment under the flatten() method for more details.
   */
  flatMap<V>(
    func: IterationCallback<T, V | Array<V> | ZenArray<V>>,
    ArrayClass?: typeof ZenArray = ZenArray,
    thisArg?: ?Object,
  ): ZenArray<V> {
    return this.map(func, ArrayClass, thisArg).flatten();
  }
}

ZenArray.displayName = 'ZenArray';

// Export a ZenArray API that is compatible with a ZenModel's deepUpdate() call.
// This only includes functions that take at least one argument (otherwise the
// deepUpdate library won't recognize it as a closing call for .deepUpdate())
// AND returns a new ZenArray of the same type.
export type DeepUpdateZenArrayAPI<T, FinalReturn> = {
  push: (newEntry: T) => FinalReturn,
  concat: (...newEntries: Array<T | Array<T> | ZenArray<T>>) => FinalReturn,
  unshift: (newEntry: T) => FinalReturn,
  sort: (compareFunction: Comparator<T, T>) => FinalReturn,
  slice: (begin?: number, end?: number) => FinalReturn,
  splice: (
    start: number,
    deleteCount?: number,
    ...items: Array<T>
  ) => FinalReturn,
  insertAt: (index: number, item: T) => FinalReturn,
  delete: (idx: number) => FinalReturn,
  set: (idx: number, value: T) => FinalReturn,
  apply: (idx: number, fn: (T) => T) => FinalReturn,
  fill: (value: T, start?: number, end?: number) => FinalReturn,
  filter: (
    func: IterationCallback<T, boolean>,
    thisArg?: ?Object,
  ) => FinalReturn,
  filterInstance: (model: Class<T>) => FinalReturn,
  findAndDelete: (
    func: IterationCallback<T, boolean>,
    thisArg?: ?Object,
  ) => FinalReturn,
  reduce: (
    func: (accumulator: T, value: T, idx: number, arr: $ReadOnlyArray<T>) => T,
    initialValue: T,
  ) => FinalReturn,
  map: (
    func: IterationCallback<T, T>,
    ArrayClass?: typeof ZenArray,
    thisArg?: ?Object,
  ) => FinalReturn,
};
