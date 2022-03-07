// @flow
import { range } from 'util/arrayUtil';
import type ZenMap from 'lib/Zen/ZenMap';

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

export default class ZenArray<+T> implements Iterable<T> {
  // Stub out Iterable interface requirements. We properly provide
  // [Symbol.iterator] below, but Flow does not detect this properly.
  // TODO(stephen): Sometimes the flow-parser that prettier uses will strip this
  // comment line out.
  /* ::
  // $FlowFixMe[incompatible-variance]
  @@iterator: () => Iterator<T>;
  */

  +_values: $ReadOnlyArray<T> = [];
  _valuesCache: $ReadOnlySet<mixed> | void = undefined;

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
   *   fromRange(5): [0, 1, 2, 3, 4]
   *   fromRange(1, 6): [1, 2, 3, 4, 5]
   */
  static fromRange(start: number, end?: number): ZenArray<number> {
    return new ZenArray(range(start, end));
  }

  static fromZenMap<V>(zenMap: ZenMap<V>): ZenArray<V> {
    return new ZenArray(zenMap.values());
  }

  constructor(values: $ReadOnlyArray<T> = []): void {
    this._values = values;
    this._valuesCache = undefined;
  }

  /**
   * ZenArray is an iterable element, meaning that you can do:
   *   const plainArray = Array.from(zenArray);
   *   const set = new Set(zenArray);
   *   for (let model of zenArray) { }
   */
  // $FlowIssue[unsupported-syntax]: Flow doesn't support computed property keys
  [Symbol.iterator](): Iterator<T> {
    return this._values[Symbol.iterator]();
  }

  /**
   * Return the wrapped array and clone it. This is a shallow conversion and
   * is an O(n) operation.
   *
   * @deprecated use `arrayView()` instead
   */
  toArray(): $ReadOnlyArray<T> {
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

  push<V>(newEntry: V): ZenArray<T | V> {
    return new ZenArray([...this._values, newEntry]);
  }

  concat<V>(
    ...newEntries: Array<ZenArray<V> | $ReadOnlyArray<V> | V>
  ): ZenArray<T | V> {
    const entries = newEntries.map(item =>
      item instanceof ZenArray ? item._values : item,
    );
    return new ZenArray(this._values.concat(...entries));
  }

  /**
   * pop() removes the last element of the ZenArray, and returns the
   * new ZenArray (as opposed to the JS Array implementation which is mutable
   * and returns the popped element instead). If you wanted to get the
   * popped element you should call `.last()` before calling `.pop()`.
   *
   * @return ZenArray<T>
   */
  pop(): ZenArray<T> {
    return new ZenArray(this._values.slice(0, -1));
  }

  /**
   * shift() removes the first element of the ZenArray, and returns the
   * new ZenArray (as opposed to the JS Array implementation which is mutable
   * and returns the removed element instead). If you wanted to get the
   * removed element you should call `.first()` before calling `.shift()`.
   *
   * @return ZenArray<T>
   */
  shift(): ZenArray<T> {
    return new ZenArray(this._values.slice(1));
  }

  /**
   * Insert `newEntry` into the beginning of the array.
   */
  unshift<V>(newEntry: V): ZenArray<T | V> {
    return new ZenArray([newEntry, ...this._values]);
  }

  sort(compareFunction: (T, T) => number): ZenArray<T> {
    return new ZenArray([...this._values].sort(compareFunction));
  }

  reverse(): ZenArray<T> {
    return new ZenArray([...this._values].reverse());
  }

  slice(begin?: number, end?: number): ZenArray<T> {
    return new ZenArray(this._values.slice(begin, end));
  }

  splice<V>(
    start: number,
    deleteCount?: number,
    ...items: Array<V>
  ): ZenArray<T | V> {
    return new ZenArray([
      ...this._values.slice(0, start),
      ...items,
      ...this._values.slice(start + (deleteCount || 0)),
    ]);
  }

  /**
   * Insert `item` at `index` such that in the new returned array,
   * the inserted item's index will be `index`.
   */
  insertAt<V>(index: number, item: V): ZenArray<T | V> {
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

  set<V>(idx: number, value: V): ZenArray<T | V> {
    const length = this.size();
    if (idx < 0 || idx > this.size() - 1) {
      throw new Error(
        `Index out of bounds. ZenArray length is ${length} and index ${idx} was passed.`,
      );
    }
    return this.splice(idx, 1, value);
  }

  /**
   * Update element at an index with an updater function:
   *   arr.apply(idx, model => model.label('something'));
   */
  apply<V>(idx: number, fn: T => V): ZenArray<T | V> {
    return this.set(idx, fn(this.get(idx)));
  }

  get(idx: number): T {
    return this._values[idx];
  }

  /* ::
  +fill: (<V>(value: V) => ZenArray<V>) & (
    <V>(value: V, start?: number, end?: number) => ZenArray<T | V>
  );
  */
  fill<V>(
    value: V,
    start?: number,
    end?: number,
  ): ZenArray<V> | ZenArray<T | V> {
    return new ZenArray([...this._values].fill(value, start, end));
  }

  includes(item: mixed): boolean {
    if (this._valuesCache === undefined) {
      this._valuesCache = new Set(this._values);
    }
    return this._valuesCache.has(item);
  }

  indexOf(item: mixed, fromIndex?: number): number {
    return this._values.indexOf(item, fromIndex);
  }

  intersection<V>(
    ...newEntries: Array<ZenArray<V> | $ReadOnlyArray<V> | V>
  ): ZenArray<T | V> {
    const entries = newEntries.map(item =>
      item instanceof ZenArray ? item._values : item,
    );

    return new ZenArray(Array.from(new Set(this._values.concat(...entries))));
  }

  join(separator?: string): string {
    return this._values.join(separator);
  }

  /**
   * Flatten a ZenArray of Arrays or ZenArrays. This function only flattens
   * one level deep.
   * TODO(pablo): this function shouldnt use reduce, it's inefficient.
   */
  flatten(): ZenArray<
    $Call<
      (<V>($ReadOnlyArray<V>) => V) & (<V>(ZenArray<V>) => V) & (<V>(V) => V),
      T,
    >,
  > {
    return this.reduce((acc, val) => acc.concat(val), ZenArray.create());
  }

  forEach(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => mixed,
    thisArg?: mixed,
  ): void {
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
   * TODO(pablo): remove the use of the ArrayClass argument
   */
  pull(
    funcName: string,
    ArrayClass?: typeof ZenArray = ZenArray,
  ): ZenArray<any> {
    return this.map(model => {
      if (model === null || model === undefined) {
        return model;
      }
      // $FlowExpectedError[incompatible-use]: Flow can't index into generic type T - for good reason - but we'll allow it here
      const func = model[funcName];
      if (typeof func === 'function') {
        return func.call(model);
      }
      throw new Error(
        '[ZenArray] attempting to pull a property that is not a callable function',
      );
    }, ArrayClass);
  }

  /* ::
  +filter: (
    ((func: typeof Boolean, thisArg?: mixed) => ZenArray<$NonMaybeType<T>>) &
    (
      (
        func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
        thisArg?: mixed
      ) => ZenArray<T>
    )
  );
  */
  filter(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ): ZenArray<T> {
    return new ZenArray(this._values.filter(func, thisArg));
  }

  filterInstance<C>(SomeClass: Class<C>): ZenArray<C> {
    return ((this.filter(val => val instanceof SomeClass): $Cast): ZenArray<C>);
  }

  find(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ): T | void {
    return this._values.find(func, thisArg);
  }

  findIndex(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ): number {
    return this._values.findIndex(func, thisArg);
  }

  /**
   * Find the first element that returns truthy when `func` is applied,
   * then delete it from the ZenArray. If no element was found, return
   * the unmodified ZenArray.
   */
  findAndDelete(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ): ZenArray<T> {
    const idx = this.findIndex(func, thisArg);
    if (idx < 0 || idx >= this.size()) {
      return this;
    }
    return this.delete(this.findIndex(func, thisArg));
  }

  some(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ): boolean {
    return this._values.some(func, thisArg);
  }

  every(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ): boolean {
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
   * TODO(pablo): remove the use of the ArrayClass argument
   * @return {ZenArray<V>}
   */
  map<V>(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => V,
    ArrayClass?: typeof ZenArray = ZenArray,
    thisArg?: mixed,
  ): ZenArray<V> {
    return ArrayClass.create(this._values.map(func, thisArg));
  }

  /**
   * Behaves exactly like 'map', except it returns a JS array
   * instead of a new ZenArray instance.
   */
  mapValues<V>(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => V,
    thisArg?: mixed,
  ): Array<V> {
    return this._values.map(func, thisArg);
  }

  /**
   * flatMap is ideal for cases when you have a map function that returns
   * an Array or ZenArray of values, and you need it immediately flattened.
   * This is inspired from JavaScript's experimental flatMap function.
   *
   * TODO(pablo): remove all uses of `ArrayClass` arguments from this class.
   * Same goes for MapClass in ZenMap.
   */
  flatMap<V>(
    func: (
      value: T,
      idx: number,
      arr: $ReadOnlyArray<T>,
    ) => ZenArray<V> | $ReadOnlyArray<V> | V,
    ArrayClass?: typeof ZenArray = ZenArray,
    thisArg?: ?mixed,
  ): ZenArray<V> {
    // $FlowIssue[incompatible-return] This is safe
    return this.map(func, ArrayClass, thisArg).flatten();
  }
}

// Export a ZenArray API that is compatible with a ZenModel's deepUpdate() call.
// This only includes functions that take at least one argument (otherwise the
// deepUpdate library won't recognize it as a closing call for .deepUpdate())
// AND returns a new ZenArray of the same type.
export type DeepUpdateZenArrayAPI<T, FinalReturn> = {
  push: (newEntry: T) => FinalReturn,
  concat: (...newEntries: Array<ZenArray<T> | Array<T> | T>) => FinalReturn,
  unshift: (newEntry: T) => FinalReturn,
  sort: (compareFunction: (T, T) => number) => FinalReturn,
  slice: (begin?: number, end?: number) => FinalReturn,
  splice: (
    start: number,
    deleteCount?: number,
    ...items: Array<T>
  ) => FinalReturn,
  insertAt: (index: number, item: T) => FinalReturn,
  intersection: (
    ...newEntries: Array<ZenArray<T> | Array<T> | T>
  ) => FinalReturn,
  delete: (idx: number) => FinalReturn,
  set: (idx: number, value: T) => FinalReturn,
  apply: (idx: number, fn: (T) => T) => FinalReturn,
  fill: (value: T, start?: number, end?: number) => FinalReturn,
  filter: (
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ) => FinalReturn,
  filterInstance: (model: Class<T>) => FinalReturn,
  findAndDelete: (
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => boolean,
    thisArg?: mixed,
  ) => FinalReturn,
  reduce: (
    func: (accumulator: T, value: T, idx: number, arr: $ReadOnlyArray<T>) => T,
    initialValue: T,
  ) => FinalReturn,
  map: <V>(
    func: (value: T, idx: number, arr: $ReadOnlyArray<T>) => V,
    ArrayClass?: typeof ZenArray,
    thisArg?: mixed,
  ) => FinalReturn,
};
